/**
 * Backend API client for interacting with the Express server
 */

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  status: string;
  emailVerified: boolean;
  lastLogin?: string;
  loginCount: number;
  createdAt: string;
  updatedAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface ContactSubmissionData {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
  service_interest?: string[];
  budget_range?: string;
  timeline?: string;
  source?: string;
  user_agent?: string;
}

class BackendApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001';
    
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if we have an access token
    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      // Handle token refresh if access token is expired
      if (response.status === 401 && data.message === 'Token expired' && this.refreshToken) {
        const refreshResult = await this.refreshAccessToken();
        if (refreshResult.success) {
          // Retry the original request with new token
          headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          return retryResponse.json();
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  private setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Authentication methods
  async register(userData: RegisterData): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User } & AuthTokens>> {
    const response = await this.request<{ user: User } & AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    this.clearTokens();
    return response;
  }

  async refreshAccessToken(): Promise<ApiResponse<{ accessToken: string; user: User }>> {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const response = await this.request<{ accessToken: string; user: User }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (response.success && response.data) {
      this.accessToken = response.data.accessToken;
      localStorage.setItem('accessToken', response.data.accessToken);
    } else {
      this.clearTokens();
    }

    return response;
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/profile');
  }

  async resetPassword(email: string): Promise<ApiResponse> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Contact form submission
  async createContactSubmission(data: ContactSubmissionData): Promise<ApiResponse> {
    // Remove the backend API call for now since we don't have the endpoint
    // This will be handled by Supabase directly for now
    throw new Error('Contact submission should use Supabase directly for now');
  }

  // User management (admin only)
  async getUsers(page = 1, limit = 10, filters?: Record<string, any>): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/users?${params.toString()}`);
  }

  async getUserById(id: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/users/${id}`);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Messages/Content management
  async getMessages(page = 1, limit = 10, filters?: Record<string, any>): Promise<ApiResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/messages?${params.toString()}`);
  }

  async getMessageBySlug(slug: string): Promise<ApiResponse> {
    return this.request(`/messages/${slug}`);
  }

  async createMessage(messageData: Record<string, any>): Promise<ApiResponse> {
    return this.request('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateMessage(id: string, updates: Record<string, any>): Promise<ApiResponse> {
    return this.request(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMessage(id: string): Promise<ApiResponse> {
    return this.request(`/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health', { method: 'GET' });
  }

  // Get current tokens (for debugging)
  getTokens() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
    };
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

// Export singleton instance
export const backendApi = new BackendApiClient();
export default backendApi;

// Export types for use in other files
export type {
  ApiResponse,
  AuthTokens,
  User,
  LoginCredentials,
  RegisterData,
  ContactSubmissionData,
};