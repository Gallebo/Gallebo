export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      airfield_operator_requests: {
        Row: {
          admin_notes: string | null;
          airfield_name: string;
          contact_email: string;
          contact_phone: string;
          created_at: string;
          icao_code: string;
          id: string;
          location: string;
          status: Database["public"]["Enums"]["doc_review_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          admin_notes?: string | null;
          airfield_name: string;
          contact_email: string;
          contact_phone: string;
          created_at?: string;
          icao_code: string;
          id?: string;
          location: string;
          status?: Database["public"]["Enums"]["doc_review_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          admin_notes?: string | null;
          airfield_name?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          icao_code?: string;
          id?: string;
          location?: string;
          status?: Database["public"]["Enums"]["doc_review_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          expires_at: string | null;
          id: string;
          review_status: Database["public"]["Enums"]["doc_review_status"];
          storage_path: string;
          type: Database["public"]["Enums"]["document_type"];
          uploaded_at: string;
          user_id: string;
        };
        Insert: {
          expires_at?: string | null;
          id?: string;
          review_status?: Database["public"]["Enums"]["doc_review_status"];
          storage_path: string;
          type: Database["public"]["Enums"]["document_type"];
          uploaded_at?: string;
          user_id: string;
        };
        Update: {
          expires_at?: string | null;
          id?: string;
          review_status?: Database["public"]["Enums"]["doc_review_status"];
          storage_path?: string;
          type?: Database["public"]["Enums"]["document_type"];
          uploaded_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notification_queue: {
        Row: {
          created_at: string;
          id: string;
          payload: Json;
          sent_at: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          payload?: Json;
          sent_at?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          payload?: Json;
          sent_at?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      pilot_profiles: {
        Row: {
          account_holder_name: string | null;
          created_at: string;
          iban_vault_secret_id: string | null;
          license_expires_at: string | null;
          medical_expires_at: string | null;
          onboarding_draft: Json | null;
          onboarding_step: number;
          tax_declaration_accepted_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_holder_name?: string | null;
          created_at?: string;
          iban_vault_secret_id?: string | null;
          license_expires_at?: string | null;
          medical_expires_at?: string | null;
          onboarding_draft?: Json | null;
          onboarding_step?: number;
          tax_declaration_accepted_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_holder_name?: string | null;
          created_at?: string;
          iban_vault_secret_id?: string | null;
          license_expires_at?: string | null;
          medical_expires_at?: string | null;
          onboarding_draft?: Json | null;
          onboarding_step?: number;
          tax_declaration_accepted_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          date_of_birth: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone_encrypted: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          status: Database["public"]["Enums"]["user_status"];
          updated_at: string;
          weight_encrypted: string | null;
        };
        Insert: {
          created_at?: string;
          date_of_birth?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone_encrypted?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
          weight_encrypted?: string | null;
        };
        Update: {
          created_at?: string;
          date_of_birth?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone_encrypted?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
          weight_encrypted?: string | null;
        };
        Relationships: [];
      };
      verification_requests: {
        Row: {
          auto_approved: boolean;
          created_at: string;
          didit_session_id: string | null;
          didit_status: string | null;
          id: string;
          rejection_reason: string | null;
          requested_role: Database["public"]["Enums"]["user_role"];
          reviewed_at: string | null;
          reviewed_by: string | null;
          user_id: string;
        };
        Insert: {
          auto_approved?: boolean;
          created_at?: string;
          didit_session_id?: string | null;
          didit_status?: string | null;
          id?: string;
          rejection_reason?: string | null;
          requested_role: Database["public"]["Enums"]["user_role"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          user_id: string;
        };
        Update: {
          auto_approved?: boolean;
          created_at?: string;
          didit_session_id?: string | null;
          didit_status?: string | null;
          id?: string;
          rejection_reason?: string | null;
          requested_role?: Database["public"]["Enums"]["user_role"];
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      profiles_public: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          id: string | null;
          last_name: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          status: Database["public"]["Enums"]["user_status"] | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string | null;
          last_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          status?: Database["public"]["Enums"]["user_status"] | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string | null;
          last_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          status?: Database["public"]["Enums"]["user_status"] | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      delete_pilot_iban: { Args: { p_secret_id: string }; Returns: undefined };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      store_pilot_iban: {
        Args: { p_iban: string; p_user_id: string };
        Returns: string;
      };
    };
    Enums: {
      doc_review_status: "pending" | "approved" | "rejected";
      document_type:
        | "id_card"
        | "ppl_license"
        | "lapl_license"
        | "medical_certificate"
        | "airfield_operating_license";
      user_role: "passenger" | "pilot" | "airfield_operator" | "admin";
      user_status: "registered" | "pending" | "verified" | "suspended";
    };
    CompositeTypes: Record<string, never>;
  };
};

type DefaultSchema = Database["public"];

export type Tables<
  TableName extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[TableName] extends {
  Row: infer R;
}
  ? R
  : never;

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends { Insert: infer I } ? I : never;

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName] extends { Update: infer U } ? U : never;

export type Enums<EnumName extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][EnumName];

export const Constants = {
  public: {
    Enums: {
      doc_review_status: ["pending", "approved", "rejected"],
      document_type: [
        "id_card",
        "ppl_license",
        "lapl_license",
        "medical_certificate",
        "airfield_operating_license",
      ],
      user_role: ["passenger", "pilot", "airfield_operator", "admin"],
      user_status: ["registered", "pending", "verified", "suspended"],
    },
  },
} as const;
