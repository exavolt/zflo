// Database types from editor
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      shared_flows: {
        Row: {
          created_at: string | null;
          expires_at: string | null;
          flow_data: Json;
          id: string;
          is_public: boolean;
          title: string;
          description: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          expires_at?: string | null;
          flow_data: Json;
          id?: string;
          is_public?: boolean;
          title: string;
          description?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          expires_at?: string | null;
          flow_data?: Json;
          id?: string;
          is_public?: boolean;
          title?: string;
          description?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
      };
      user_flows: {
        Row: {
          created_at: string | null;
          flow_data: Json;
          id: string;
          metadata: Json | null;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          flow_data: Json;
          id?: string;
          metadata?: Json | null;
          title: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string | null;
          flow_data?: Json;
          id?: string;
          metadata?: Json | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
      };
    };
  };
}

// Flow types
export type SharedFlow = Database['public']['Tables']['shared_flows']['Row'];
export type SharedFlowInsert =
  Database['public']['Tables']['shared_flows']['Insert'];
export type SharedFlowUpdate =
  Database['public']['Tables']['shared_flows']['Update'];

export type UserFlow = Database['public']['Tables']['user_flows']['Row'];
export type UserFlowInsert =
  Database['public']['Tables']['user_flows']['Insert'];
export type UserFlowUpdate =
  Database['public']['Tables']['user_flows']['Update'];

// Filter and search interfaces
export interface FlowFilter {
  search?: string;
  limit?: number;
  offset?: number;
  is_discoverable?: boolean;
}

export interface EditorData {
  nodes: any[];
  edges: any[];
  flowTitle: string;
  nodeIdCounter: number;
  edgeIdCounter: number;
  flowMetadata: any;
  [key: string]: any; // Allow additional properties for Json compatibility
}
