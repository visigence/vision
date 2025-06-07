/**
 * Type definitions for the Visigence application
 * Provides comprehensive type safety across the frontend
 */

// User-related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
}

// Message/Content types
export interface Message {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: MessageStatus;
  isFeatured: boolean;
  isPinned: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  author: User;
  tags: Tag[];
}

export type MessageStatus = 'active' | 'hidden' | 'flagged' | 'deleted';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project/Portfolio types
export interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
  featured?: boolean;
  technologies?: string[];
  completedAt?: string;
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface MessageFormData {
  title: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string[];
  isFeatured?: boolean;
  isPinned?: boolean;
  status?: MessageStatus;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ModalState {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'delete' | 'view';
  data?: any;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeConfig {
  mode: ThemeMode;
  primaryColor: string;
  accentColor: string;
  customizations?: Record<string, any>;
}

// Filter and search types
export interface MessageFilters {
  search?: string;
  category?: string;
  status?: MessageStatus;
  author?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  dateFrom?: string;
  dateTo?: string;
}

// Statistics types
export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  moderatorUsers: number;
  regularUsers: number;
  newUsers30d: number;
  activeUsers30d: number;
}

export interface MessageStats {
  totalMessages: number;
  activeMessages: number;
  hiddenMessages: number;
  flaggedMessages: number;
  featuredMessages: number;
  pinnedMessages: number;
  totalViews: number;
  totalLikes: number;
}

// Audit log types
export interface AuditLog {
  id: string;
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: Pick<User, 'username' | 'firstName' | 'lastName' | 'email'>;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'password_reset';

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event types for custom hooks
export interface CustomEvent<T = any> {
  type: string;
  payload?: T;
  timestamp: number;
}

// Error types
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// Configuration types
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    enableAnalytics: boolean;
    enableNotifications: boolean;
    enableRealtime: boolean;
    enableDarkMode: boolean;
  };
  limits: {
    maxFileSize: number;
    maxImageSize: number;
    maxMessageLength: number;
    maxUsernameLength: number;
  };
}