import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
  throw new Error('Missing Supabase environment variables');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Invalid Supabase URL format. Please check your VITE_SUPABASE_URL in the .env file.');
}

// Validate that we don't have placeholder values
if (supabaseUrl.includes('your_supabase_project_url') || supabaseAnonKey.includes('your_supabase_anon_key')) {
  console.error('Supabase environment variables contain placeholder values. Please replace with actual values from your Supabase project.');
  throw new Error('Supabase environment variables contain placeholder values');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'visigence-web@1.0.0'
    }
  }
});

// Database helpers - keeping only what's not handled by the backend
export const db = {
  // Contact submissions - keeping this for now since backend might not have this endpoint yet
  createContactSubmission: async (submission: Record<string, any>) => {
    return supabase
      .from('contact_submissions')
      .insert(submission)
      .select()
      .single();
  },

  getContactSubmissions: async (page = 1, limit = 10) => {
    return supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);
  },

  // Categories - public data that can be read directly
  getCategories: async () => {
    return supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
  },

  // Tags - public data that can be read directly
  getTags: async () => {
    return supabase
      .from('tags')
      .select('*')
      .eq('is_active', true)
      .order('usage_count', { ascending: false });
  },

  // File uploads - direct to Supabase Storage
  uploadFile: async (file: File, path: string) => {
    return supabase.storage
      .from('uploads')
      .upload(path, file);
  },

  getFileUrl: (path: string) => {
    return supabase.storage
      .from('uploads')
      .getPublicUrl(path);
  },

  // Search - can be done directly on public content
  searchContent: async (query: string, limit = 20, offset = 0) => {
    return supabase.rpc('search_content', {
      search_query: query,
      content_limit: limit,
      content_offset: offset
    });
  }
};

// Real-time subscriptions - keeping these for live updates
export const realtime = {
  subscribeToMessages: (callback: (payload: any) => void) => {
    return supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        callback
      )
      .subscribe();
  },

  subscribeToUsers: (callback: (payload: any) => void) => {
    return supabase
      .channel('users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        callback
      )
      .subscribe();
  },

  subscribeToContactSubmissions: (callback: (payload: any) => void) => {
    return supabase
      .channel('contact_submissions')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'contact_submissions' }, 
        callback
      )
      .subscribe();
  }
};

export default supabase;