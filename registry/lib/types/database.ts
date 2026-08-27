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
      clients: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          district: string | null;
          date_of_birth: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          district?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          district?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      enquiries: {
        Row: {
          id: string;
          client_id: string;
          service: string;
          destination: string | null;
          preferred_date: string | null;
          notes: string | null;
          details: Json | null;
          source: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service: string;
          destination?: string | null;
          preferred_date?: string | null;
          notes?: string | null;
          details?: Json | null;
          source?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service?: string;
          destination?: string | null;
          preferred_date?: string | null;
          notes?: string | null;
          details?: Json | null;
          source?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enquiries_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      staff_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string | null;
          role: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          phone?: string | null;
          role?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          key: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          description?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      role_permissions: {
        Row: {
          role: string;
          permission_id: string;
        };
        Insert: {
          role: string;
          permission_id: string;
        };
        Update: {
          role?: string;
          permission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          }
        ];
      };
      field_leads: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          district: string | null;
          date_of_birth: string | null;
          service_interest: string;
          notes: string | null;
          status: string;
          source: string;
          created_by: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          last_contacted_at: string | null;
          next_follow_up_at: string | null;
          converted_client_id: string | null;
          version: number;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          district?: string | null;
          date_of_birth?: string | null;
          service_interest: string;
          notes?: string | null;
          status?: string;
          source?: string;
          created_by: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          converted_client_id?: string | null;
          version?: number;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          district?: string | null;
          date_of_birth?: string | null;
          service_interest?: string;
          notes?: string | null;
          status?: string;
          source?: string;
          created_by?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          last_contacted_at?: string | null;
          next_follow_up_at?: string | null;
          converted_client_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "field_leads_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_leads_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "field_leads_converted_client_id_fkey";
            columns: ["converted_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          }
        ];
      };
      follow_ups: {
        Row: {
          id: string;
          field_lead_id: string;
          assigned_to: string;
          due_at: string;
          status: string;
          notes: string | null;
          outcome: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          field_lead_id: string;
          assigned_to: string;
          due_at: string;
          status?: string;
          notes?: string | null;
          outcome?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          id?: string;
          field_lead_id?: string;
          assigned_to?: string;
          due_at?: string;
          status?: string;
          notes?: string | null;
          outcome?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "follow_ups_field_lead_id_fkey";
            columns: ["field_lead_id"];
            isOneToOne: false;
            referencedRelation: "field_leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follow_ups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "staff_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sync_operations: {
        Row: {
          id: string;
          operation_id: string;
          user_id: string;
          staff_id: string;
          operation_type: string;
          entity_type: string;
          entity_id: string;
          processed_at: string;
          result: Json | null;
        };
        Insert: {
          id?: string;
          operation_id: string;
          user_id: string;
          staff_id: string;
          operation_type: string;
          entity_type: string;
          entity_id: string;
          processed_at?: string;
          result?: Json | null;
        };
        Update: {
          id?: string;
          operation_id?: string;
          user_id?: string;
          staff_id?: string;
          operation_type?: string;
          entity_type?: string;
          entity_id?: string;
          processed_at?: string;
          result?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      enquiry_source: "website" | "whatsapp" | "field_marketing" | "referral" | "social_media" | "walk_in" | "other";
      enquiry_status: "new" | "contacted" | "in_progress" | "completed" | "cancelled";
      service_type: "tourism" | "work_abroad" | "visa" | "passport" | "air_ticket" | "hotel" | "airbnb" | "car_hire" | "delivery" | "consultancy";
      staff_role: "admin" | "supervisor" | "data_entrant" | "field_marketer";
      field_lead_status: "new" | "contacted" | "interested" | "follow_up" | "converted" | "not_interested" | "lost";
      field_lead_source: "field_marketing" | "office_visit" | "referral" | "event" | "social_media" | "phone" | "whatsapp" | "other";
      followup_status: "pending" | "completed" | "missed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
}
