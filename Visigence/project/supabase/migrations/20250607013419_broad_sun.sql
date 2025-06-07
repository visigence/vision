/*
  # Database Functions and Triggers

  1. Utility Functions
    - Update timestamp triggers
    - Slug generation
    - Search functionality

  2. Security Functions
    - Password validation
    - Rate limiting
    - Audit logging

  3. Business Logic Functions
    - Content management
    - User management
    - Analytics
*/

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ language 'plpgsql';

-- Function to ensure unique slug
CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug text, table_name text, exclude_id uuid DEFAULT NULL)
RETURNS text AS $$
DECLARE
  final_slug text := base_slug;
  counter integer := 1;
  exists_check boolean;
BEGIN
  LOOP
    -- Check if slug exists
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE slug = $1 AND ($2 IS NULL OR id != $2))', table_name)
    INTO exists_check
    USING final_slug, exclude_id;
    
    IF NOT exists_check THEN
      EXIT;
    END IF;
    
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ language 'plpgsql';

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_action audit_action,
  p_resource_type text,
  p_resource_id text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_additional_info jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id,
    old_values, new_values, ip_address, user_agent,
    session_id, additional_info
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, p_ip_address, p_user_agent,
    p_session_id, p_additional_info
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ language 'plpgsql';

-- Function to validate password strength
CREATE OR REPLACE FUNCTION validate_password(password text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    length(password) >= 8 AND
    password ~ '[a-z]' AND
    password ~ '[A-Z]' AND
    password ~ '[0-9]' AND
    password ~ '[^a-zA-Z0-9]'
  );
END;
$$ language 'plpgsql';

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit_count integer,
  p_time_window interval
)
RETURNS boolean AS $$
DECLARE
  action_count integer;
BEGIN
  SELECT COUNT(*)
  INTO action_count
  FROM audit_logs
  WHERE user_id = p_user_id
    AND action::text = p_action
    AND created_at > (now() - p_time_window);
  
  RETURN action_count < p_limit_count;
END;
$$ language 'plpgsql';

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM refresh_tokens
  WHERE expires_at < now() OR is_revoked = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM user_sessions
  WHERE expires_at < now() OR is_active = false;
  
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', COUNT(*),
    'active_users', COUNT(*) FILTER (WHERE status = 'active'),
    'inactive_users', COUNT(*) FILTER (WHERE status = 'inactive'),
    'suspended_users', COUNT(*) FILTER (WHERE status = 'suspended'),
    'admin_users', COUNT(*) FILTER (WHERE role = 'admin'),
    'moderator_users', COUNT(*) FILTER (WHERE role = 'moderator'),
    'regular_users', COUNT(*) FILTER (WHERE role = 'user'),
    'new_users_30d', COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days'),
    'active_users_30d', COUNT(*) FILTER (WHERE last_login >= now() - interval '30 days')
  )
  INTO stats
  FROM users
  WHERE deleted_at IS NULL;
  
  RETURN stats;
END;
$$ language 'plpgsql';

-- Function to get content statistics
CREATE OR REPLACE FUNCTION get_content_statistics()
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_messages', COUNT(*),
    'published_messages', COUNT(*) FILTER (WHERE status = 'published'),
    'draft_messages', COUNT(*) FILTER (WHERE status = 'draft'),
    'archived_messages', COUNT(*) FILTER (WHERE status = 'archived'),
    'flagged_messages', COUNT(*) FILTER (WHERE status = 'flagged'),
    'featured_messages', COUNT(*) FILTER (WHERE is_featured = true),
    'pinned_messages', COUNT(*) FILTER (WHERE is_pinned = true),
    'total_views', COALESCE(SUM(view_count), 0),
    'total_likes', COALESCE(SUM(like_count), 0),
    'avg_reading_time', COALESCE(AVG(reading_time), 0)
  )
  INTO stats
  FROM messages
  WHERE deleted_at IS NULL;
  
  RETURN stats;
END;
$$ language 'plpgsql';

-- Function for full-text search
CREATE OR REPLACE FUNCTION search_content(
  search_query text,
  content_limit integer DEFAULT 20,
  content_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  title text,
  excerpt text,
  slug text,
  author_name text,
  category_name text,
  published_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.title,
    m.excerpt,
    m.slug,
    (u.first_name || ' ' || u.last_name) as author_name,
    c.name as category_name,
    m.published_at,
    ts_rank(to_tsvector('english', m.title || ' ' || m.content), plainto_tsquery('english', search_query)) as rank
  FROM messages m
  LEFT JOIN users u ON m.author_id = u.id
  LEFT JOIN categories c ON m.category_id = c.id
  WHERE m.status = 'published'
    AND m.deleted_at IS NULL
    AND to_tsvector('english', m.title || ' ' || m.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, m.published_at DESC
  LIMIT content_limit
  OFFSET content_offset;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-generate slug for messages
CREATE OR REPLACE FUNCTION auto_generate_message_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.title), 'messages', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_generate_message_slug_trigger
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_message_slug();

-- Trigger to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tag_usage_count_trigger
  AFTER INSERT OR DELETE ON message_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- Trigger to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
DECLARE
  word_count integer;
  words_per_minute integer := 200;
BEGIN
  -- Count words in content (rough estimation)
  word_count := array_length(string_to_array(NEW.content, ' '), 1);
  NEW.reading_time := GREATEST(CEIL(word_count::float / words_per_minute), 1);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_reading_time_trigger
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION calculate_reading_time();