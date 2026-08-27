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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      enquiry_source: "website" | "whatsapp" | "field_marketing" | "referral" | "social_media" | "walk_in" | "other";
      enquiry_status: "new" | "contacted" | "in_progress" | "completed" | "cancelled";
      service_type: "tourism" | "work_abroad" | "visa" | "passport" | "air_ticket" | "hotel" | "airbnb" | "car_hire" | "delivery" | "consultancy";
    };
    CompositeTypes: Record<string, never>;
  };
}
