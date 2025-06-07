/*
  # Initial Database Schema for Visigence

  1. New Tables
    - `users` - User accounts with enhanced security
    - `user_profiles` - Extended user profile information
    - `messages` - Content/blog posts with moderation
    - `categories` - Content categorization
    - `tags` - Content tagging system
    - `message_tags` - Many-to-many relationship
    - `audit_logs` - Comprehensive audit trail
    - `refresh_tokens` - Secure token management
    - `user_sessions` - Session tracking
    - `contact_submissions` - Contact form submissions
    - `file_uploads` - File management system

  2. Security
    - Enable RLS on all tables
    - Comprehensive policies for data access
    - Audit logging for all operations
    - Secure token management

  3. Performance
    - Optimized indexes
    - Efficient queries
    - Proper constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator', 'super_admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending_verification', 'deleted');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived', 'flagged', 'deleted');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'password_reset', 'email_verify', 'role_change');
CREATE TYPE file_type AS ENUM ('image', 'document', 'video', 'audio', 'other');

-- Users table with enhanced security
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  username text UNIQUE NOT NULL,
  role user_role DEFAULT 'user',
  status user_status DEFAULT 'active',
  last_login timestamptz,
  login_count integer DEFAULT 0,
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamptz,
  password_changed_at timestamptz DEFAULT now(),
  two_factor_enabled boolean DEFAULT false,
  two_factor_secret text,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  
  -- Constraints
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_username_check CHECK (username ~* '^[a-zA-Z0-9_]{3,30}$'),
  CONSTRAINT users_name_check CHECK (length(first_name) >= 2 AND length(last_name) >= 2)
);

-- User profiles for extended information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  avatar_url text,
  bio text,
  website text,
  location text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  theme text DEFAULT 'dark',
  notifications_enabled boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  social_links jsonb DEFAULT '{}',
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Categories for content organization
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#6366f1',
  icon text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT categories_name_check CHECK (length(name) >= 2),
  CONSTRAINT categories_slug_check CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT categories_color_check CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Tags for flexible content labeling
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#8b5cf6',
  usage_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT tags_name_check CHECK (length(name) >= 2),
  CONSTRAINT tags_slug_check CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT tags_color_check CHECK (color ~* '^#[0-9A-Fa-f]{6}$')
);

-- Messages/Content table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  status content_status DEFAULT 'draft',
  is_featured boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  reading_time integer, -- in minutes
  seo_title text,
  seo_description text,
  seo_keywords text[],
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  
  CONSTRAINT messages_title_check CHECK (length(title) >= 5),
  CONSTRAINT messages_slug_check CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT messages_content_check CHECK (length(content) >= 10)
);

-- Message tags junction table
CREATE TABLE IF NOT EXISTS message_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(message_id, tag_id)
);

-- Refresh tokens for secure authentication
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  is_revoked boolean DEFAULT false,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES users(id) ON DELETE SET NULL,
  device_info jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT refresh_tokens_expires_check CHECK (expires_at > created_at)
);

-- User sessions for tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  location_info jsonb,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  
  CONSTRAINT user_sessions_expires_check CHECK (expires_at > created_at)
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  phone text,
  company text,
  service_interest text[],
  budget_range text,
  timeline text,
  source text, -- how they found us
  ip_address inet,
  user_agent text,
  is_read boolean DEFAULT false,
  is_responded boolean DEFAULT false,
  responded_at timestamptz,
  responded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT contact_submissions_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT contact_submissions_name_check CHECK (length(name) >= 2),
  CONSTRAINT contact_submissions_message_check CHECK (length(message) >= 10)
);

-- File uploads management
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type file_type NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_public boolean DEFAULT false,
  alt_text text,
  caption text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT file_uploads_size_check CHECK (file_size > 0 AND file_size <= 104857600) -- 100MB max
);

-- Comprehensive audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action audit_action NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id uuid,
  additional_info jsonb,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT audit_logs_resource_check CHECK (length(resource_type) >= 2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_category_id ON messages(category_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_published_at ON messages(published_at);
CREATE INDEX IF NOT EXISTS idx_messages_slug ON messages(slug);
CREATE INDEX IF NOT EXISTS idx_messages_featured ON messages(is_featured);

CREATE INDEX IF NOT EXISTS idx_message_tags_message_id ON message_tags(message_id);
CREATE INDEX IF NOT EXISTS idx_message_tags_tag_id ON message_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_is_read ON contact_submissions(is_read);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || username));

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;