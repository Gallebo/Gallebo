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
      airfield_events: {
        Row: {
          airfield_id: string;
          created_at: string;
          description: string | null;
          event_date: string;
          id: string;
          link: string | null;
          title: string;
        };
        Insert: {
          airfield_id: string;
          created_at?: string;
          description?: string | null;
          event_date: string;
          id?: string;
          link?: string | null;
          title: string;
        };
        Update: {
          airfield_id?: string;
          created_at?: string;
          description?: string | null;
          event_date?: string;
          id?: string;
          link?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      airfield_notices: {
        Row: {
          airfield_id: string;
          body: string;
          created_at: string;
          id: string;
        };
        Insert: {
          airfield_id: string;
          body: string;
          created_at?: string;
          id?: string;
        };
        Update: {
          airfield_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
        };
        Relationships: [];
      };
      airfield_photos: {
        Row: {
          airfield_id: string;
          created_at: string;
          id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          airfield_id: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          airfield_id?: string;
          created_at?: string;
          id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [];
      };
      airfields: {
        Row: {
          contact_email: string | null;
          contact_phone: string | null;
          country: string;
          created_at: string;
          description: string | null;
          destination_info: string | null;
          has_fuel: boolean;
          has_hangar: boolean;
          has_rental: boolean;
          icao_code: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          operator_user_id: string | null;
          status: string;
          updated_at: string;
          working_hours: string | null;
        };
        Insert: {
          contact_email?: string | null;
          contact_phone?: string | null;
          country: string;
          created_at?: string;
          description?: string | null;
          destination_info?: string | null;
          has_fuel?: boolean;
          has_hangar?: boolean;
          has_rental?: boolean;
          icao_code: string;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          operator_user_id?: string | null;
          status?: string;
          updated_at?: string;
          working_hours?: string | null;
        };
        Update: {
          contact_email?: string | null;
          contact_phone?: string | null;
          country?: string;
          created_at?: string;
          description?: string | null;
          destination_info?: string | null;
          has_fuel?: boolean;
          has_hangar?: boolean;
          has_rental?: boolean;
          icao_code?: string;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          operator_user_id?: string | null;
          status?: string;
          updated_at?: string;
          working_hours?: string | null;
        };
        Relationships: [];
      };
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
      aircraft: {
        Row: {
          created_at: string;
          id: string;
          max_passenger_weight_kg: number | null;
          model: string;
          pilot_user_id: string;
          registration: string;
          seats: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          max_passenger_weight_kg?: number | null;
          model: string;
          pilot_user_id: string;
          registration: string;
          seats: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          max_passenger_weight_kg?: number | null;
          model?: string;
          pilot_user_id?: string;
          registration?: string;
          seats?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "aircraft_pilot_user_id_fkey";
            columns: ["pilot_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      aircraft_photos: {
        Row: {
          aircraft_id: string;
          created_at: string;
          id: string;
          position: number;
          storage_path: string;
        };
        Insert: {
          aircraft_id: string;
          created_at?: string;
          id?: string;
          position?: number;
          storage_path: string;
        };
        Update: {
          aircraft_id?: string;
          created_at?: string;
          id?: string;
          position?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "aircraft_photos_aircraft_id_fkey";
            columns: ["aircraft_id"];
            isOneToOne: false;
            referencedRelation: "aircraft";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          booking_id: string;
          content: string;
          created_at: string;
          id: string;
          is_system: boolean;
          sender_user_id: string | null;
        };
        Insert: {
          booking_id: string;
          content: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          sender_user_id?: string | null;
        };
        Update: {
          booking_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          is_system?: boolean;
          sender_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "flight_booking_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_messages_sender_user_id_fkey";
            columns: ["sender_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
      flight_booking_requests: {
        Row: {
          accepted_at: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          checkout_session_id: string | null;
          created_at: string;
          flight_id: string;
          review_deadline_at: string | null;
          reviews_processed_at: string | null;
          id: string;
          paid_at: string | null;
          paid_out_at: string | null;
          passenger_amount_eur: number | null;
          passenger_user_id: string;
          payout_after: string | null;
          payout_failed_count: number;
          payout_status: Database["public"]["Enums"]["payout_status_type"];
          payment_expires_at: string | null;
          payment_intent_id: string | null;
          pilot_payout_eur: number | null;
          pilot_responded_at: string | null;
          pilot_response_expires_at: string | null;
          platform_fee_eur: number | null;
          refund_id: string | null;
          refunded_at: string | null;
          status: Database["public"]["Enums"]["flight_booking_status"];
          stripe_charge_id: string | null;
          stripe_transfer_id: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          checkout_session_id?: string | null;
          created_at?: string;
          flight_id: string;
          id?: string;
          paid_at?: string | null;
          paid_out_at?: string | null;
          passenger_amount_eur?: number | null;
          passenger_user_id: string;
          payout_after?: string | null;
          payout_failed_count?: number;
          payout_status?: Database["public"]["Enums"]["payout_status_type"];
          payment_expires_at?: string | null;
          payment_intent_id?: string | null;
          pilot_payout_eur?: number | null;
          pilot_responded_at?: string | null;
          pilot_response_expires_at?: string | null;
          review_deadline_at?: string | null;
          reviews_processed_at?: string | null;
          platform_fee_eur?: number | null;
          refund_id?: string | null;
          refunded_at?: string | null;
          status?: Database["public"]["Enums"]["flight_booking_status"];
          stripe_charge_id?: string | null;
          stripe_transfer_id?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          checkout_session_id?: string | null;
          created_at?: string;
          flight_id?: string;
          id?: string;
          paid_at?: string | null;
          paid_out_at?: string | null;
          passenger_amount_eur?: number | null;
          passenger_user_id?: string;
          payout_after?: string | null;
          payout_failed_count?: number;
          payout_status?: Database["public"]["Enums"]["payout_status_type"];
          payment_expires_at?: string | null;
          payment_intent_id?: string | null;
          pilot_payout_eur?: number | null;
          pilot_responded_at?: string | null;
          pilot_response_expires_at?: string | null;
          review_deadline_at?: string | null;
          reviews_processed_at?: string | null;
          platform_fee_eur?: number | null;
          refund_id?: string | null;
          refunded_at?: string | null;
          status?: Database["public"]["Enums"]["flight_booking_status"];
          stripe_charge_id?: string | null;
          stripe_transfer_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "flight_booking_requests_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
        ];
      };
      flight_photos: {
        Row: {
          created_at: string;
          flight_id: string;
          id: string;
          position: number;
          storage_path: string;
        };
        Insert: {
          created_at?: string;
          flight_id: string;
          id?: string;
          position?: number;
          storage_path: string;
        };
        Update: {
          created_at?: string;
          flight_id?: string;
          id?: string;
          position?: number;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flight_photos_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
        ];
      };
      flight_publish_drafts: {
        Row: {
          draft: Json;
          pilot_user_id: string;
          step: number;
          updated_at: string;
        };
        Insert: {
          draft?: Json;
          pilot_user_id: string;
          step?: number;
          updated_at?: string;
        };
        Update: {
          draft?: Json;
          pilot_user_id?: string;
          step?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      ledger: {
        Row: {
          amount_eur: number;
          booking_id: string | null;
          created_at: string;
          id: string;
          idempotency_key: string;
          metadata: Json;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_refund_id: string | null;
          stripe_transfer_id: string | null;
          type: Database["public"]["Enums"]["ledger_entry_type"];
        };
        Insert: {
          amount_eur: number;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          metadata?: Json;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_refund_id?: string | null;
          stripe_transfer_id?: string | null;
          type: Database["public"]["Enums"]["ledger_entry_type"];
        };
        Update: {
          amount_eur?: number;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          metadata?: Json;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_refund_id?: string | null;
          stripe_transfer_id?: string | null;
          type?: Database["public"]["Enums"]["ledger_entry_type"];
        };
        Relationships: [];
      };
      flights: {
        Row: {
          aircraft_id: string | null;
          arrival_airfield_id: string;
          communication_language: Database["public"]["Enums"]["flight_language"];
          completed_at: string | null;
          created_at: string;
          departure_airfield_id: string;
          departure_time: string;
          description: string;
          flight_date: string;
          flight_type: Database["public"]["Enums"]["flight_type"];
          id: string;
          passenger_seats: number;
          pilot_return_date: string | null;
          pilot_user_id: string;
          price_deviation_flag: boolean;
          price_per_passenger_eur: number;
          published_at: string | null;
          rented_model: string | null;
          rented_registration: string | null;
          rented_seats: number | null;
          return_note: string | null;
          route_avg_price_eur: number | null;
          status: Database["public"]["Enums"]["flight_status"];
          total_cost_eur: number;
          updated_at: string;
        };
        Insert: {
          aircraft_id?: string | null;
          arrival_airfield_id: string;
          communication_language?: Database["public"]["Enums"]["flight_language"];
          completed_at?: string | null;
          created_at?: string;
          departure_airfield_id: string;
          departure_time: string;
          description: string;
          flight_date: string;
          flight_type: Database["public"]["Enums"]["flight_type"];
          id?: string;
          passenger_seats: number;
          pilot_return_date?: string | null;
          pilot_user_id: string;
          price_deviation_flag?: boolean;
          price_per_passenger_eur: number;
          published_at?: string | null;
          rented_model?: string | null;
          rented_registration?: string | null;
          rented_seats?: number | null;
          return_note?: string | null;
          route_avg_price_eur?: number | null;
          status?: Database["public"]["Enums"]["flight_status"];
          total_cost_eur: number;
          updated_at?: string;
        };
        Update: {
          aircraft_id?: string | null;
          arrival_airfield_id?: string;
          communication_language?: Database["public"]["Enums"]["flight_language"];
          completed_at?: string | null;
          created_at?: string;
          departure_airfield_id?: string;
          departure_time?: string;
          description?: string;
          flight_date?: string;
          flight_type?: Database["public"]["Enums"]["flight_type"];
          id?: string;
          passenger_seats?: number;
          pilot_return_date?: string | null;
          pilot_user_id?: string;
          price_deviation_flag?: boolean;
          price_per_passenger_eur?: number;
          published_at?: string | null;
          rented_model?: string | null;
          rented_registration?: string | null;
          rented_seats?: number | null;
          return_note?: string | null;
          route_avg_price_eur?: number | null;
          status?: Database["public"]["Enums"]["flight_status"];
          total_cost_eur?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flights_aircraft_id_fkey";
            columns: ["aircraft_id"];
            isOneToOne: false;
            referencedRelation: "aircraft";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_arrival_airfield_id_fkey";
            columns: ["arrival_airfield_id"];
            isOneToOne: false;
            referencedRelation: "airfields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_departure_airfield_id_fkey";
            columns: ["departure_airfield_id"];
            isOneToOne: false;
            referencedRelation: "airfields";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "flights_pilot_user_id_fkey";
            columns: ["pilot_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      in_app_notifications: {
        Row: {
          body: string;
          booking_id: string | null;
          created_at: string;
          flight_id: string | null;
          id: string;
          read_at: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          body: string;
          booking_id?: string | null;
          created_at?: string;
          flight_id?: string | null;
          id?: string;
          read_at?: string | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          body?: string;
          booking_id?: string | null;
          created_at?: string;
          flight_id?: string | null;
          id?: string;
          read_at?: string | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "in_app_notifications_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "flight_booking_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "in_app_notifications_flight_id_fkey";
            columns: ["flight_id"];
            isOneToOne: false;
            referencedRelation: "flights";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "in_app_notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_queue: {
        Row: {
          created_at: string;
          failed_at: string | null;
          id: string;
          payload: Json;
          retry_count: number;
          sent_at: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          failed_at?: string | null;
          id?: string;
          payload?: Json;
          retry_count?: number;
          sent_at?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          failed_at?: string | null;
          id?: string;
          payload?: Json;
          retry_count?: number;
          sent_at?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      route_price_benchmarks: {
        Row: {
          arrival_airfield_id: string;
          avg_price_per_passenger_eur: number | null;
          departure_airfield_id: string;
          flight_type: Database["public"]["Enums"]["flight_type"];
          sample_count: number;
          updated_at: string;
        };
        Insert: {
          arrival_airfield_id: string;
          avg_price_per_passenger_eur?: number | null;
          departure_airfield_id: string;
          flight_type: Database["public"]["Enums"]["flight_type"];
          sample_count?: number;
          updated_at?: string;
        };
        Update: {
          arrival_airfield_id?: string;
          avg_price_per_passenger_eur?: number | null;
          departure_airfield_id?: string;
          flight_type?: Database["public"]["Enums"]["flight_type"];
          sample_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      pilot_profiles: {
        Row: {
          created_at: string;
          license_expires_at: string | null;
          medical_expires_at: string | null;
          onboarding_draft: Json | null;
          onboarding_step: number;
          stripe_account_id: string | null;
          stripe_onboarding_complete: boolean;
          tax_declaration_accepted_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          license_expires_at?: string | null;
          medical_expires_at?: string | null;
          onboarding_draft?: Json | null;
          onboarding_step?: number;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          tax_declaration_accepted_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          license_expires_at?: string | null;
          medical_expires_at?: string | null;
          onboarding_draft?: Json | null;
          onboarding_step?: number;
          stripe_account_id?: string | null;
          stripe_onboarding_complete?: boolean;
          tax_declaration_accepted_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      pilot_reviews: {
        Row: {
          accuracy_rating: number | null;
          booking_id: string | null;
          comment: string | null;
          communication_rating: number | null;
          created_at: string;
          experience_rating: number | null;
          id: string;
          is_visible: boolean;
          pilot_user_id: string;
          rating: number;
          reviewer_user_id: string;
        };
        Insert: {
          accuracy_rating?: number | null;
          booking_id?: string | null;
          comment?: string | null;
          communication_rating?: number | null;
          created_at?: string;
          experience_rating?: number | null;
          id?: string;
          is_visible?: boolean;
          pilot_user_id: string;
          rating: number;
          reviewer_user_id: string;
        };
        Update: {
          accuracy_rating?: number | null;
          booking_id?: string | null;
          comment?: string | null;
          communication_rating?: number | null;
          created_at?: string;
          experience_rating?: number | null;
          id?: string;
          is_visible?: boolean;
          pilot_user_id?: string;
          rating?: number;
          reviewer_user_id?: string;
        };
        Relationships: [];
      };
      passenger_reviews: {
        Row: {
          accuracy_rating: number;
          behavior_rating: number;
          booking_id: string;
          comment: string | null;
          id: string;
          is_visible: boolean;
          pilot_user_id: string;
          passenger_user_id: string;
          rating: number;
          submitted_at: string;
          weight_accuracy_rating: number;
        };
        Insert: {
          accuracy_rating: number;
          behavior_rating: number;
          booking_id: string;
          comment?: string | null;
          id?: string;
          is_visible?: boolean;
          pilot_user_id: string;
          passenger_user_id: string;
          rating: number;
          submitted_at?: string;
          weight_accuracy_rating: number;
        };
        Update: {
          accuracy_rating?: number;
          behavior_rating?: number;
          booking_id?: string;
          comment?: string | null;
          id?: string;
          is_visible?: boolean;
          pilot_user_id?: string;
          passenger_user_id?: string;
          rating?: number;
          submitted_at?: string;
          weight_accuracy_rating?: number;
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
          avatar_path: string | null;
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
          avatar_path?: string | null;
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
          avatar_path?: string | null;
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
      flights_with_available_seats: {
        Row: Database["public"]["Tables"]["flights"]["Row"] & {
          available_seats: number;
        };
        Insert: Database["public"]["Tables"]["flights"]["Insert"] & {
          available_seats?: number;
        };
        Update: Database["public"]["Tables"]["flights"]["Update"] & {
          available_seats?: number;
        };
        Relationships: Database["public"]["Tables"]["flights"]["Relationships"];
      };
      pilot_reviews_public: {
        Row: {
          accuracy_rating: number | null;
          comment: string | null;
          communication_rating: number | null;
          created_at: string | null;
          experience_rating: number | null;
          id: string | null;
          pilot_user_id: string | null;
          rating: number | null;
        };
        Insert: {
          accuracy_rating?: number | null;
          comment?: string | null;
          communication_rating?: number | null;
          created_at?: string | null;
          experience_rating?: number | null;
          id?: string | null;
          pilot_user_id?: string | null;
          rating?: number | null;
        };
        Update: {
          accuracy_rating?: number | null;
          comment?: string | null;
          communication_rating?: number | null;
          created_at?: string | null;
          experience_rating?: number | null;
          id?: string | null;
          pilot_user_id?: string | null;
          rating?: number | null;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_notification_settings: {
        Row: {
          email_enabled: boolean;
          in_app_enabled: boolean;
          push_enabled: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          push_enabled?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          email_enabled?: boolean;
          in_app_enabled?: boolean;
          push_enabled?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_notification_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles_public: {
        Row: {
          avatar_path: string | null;
          created_at: string | null;
          first_name: string | null;
          id: string | null;
          last_name: string | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          status: Database["public"]["Enums"]["user_status"] | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string | null;
          first_name?: string | null;
          id?: string | null;
          last_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          status?: Database["public"]["Enums"]["user_status"] | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_path?: string | null;
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
      count_pending_bookings: {
        Args: { p_flight_id: string };
        Returns: number;
      };
      count_reserved_bookings: {
        Args: { p_flight_id: string };
        Returns: number;
      };
      increment_payout_failed_count: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      reveal_booking_reviews: {
        Args: { p_booking_id: string };
        Returns: undefined;
      };
      finalize_expired_booking_reviews: {
        Args: {
          p_booking_id: string;
          p_pilot_user_id: string;
          p_passenger_user_id: string;
        };
        Returns: undefined;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      pilot_payout_threshold_met: {
        Args: { p_pilot_user_id: string };
        Returns: boolean;
      };
      is_airfield_operator_for: {
        Args: { p_airfield_id: string };
        Returns: boolean;
      };
      swap_airfield_photo_order: {
        Args: {
          p_id_a: string;
          p_order_a: number;
          p_id_b: string;
          p_order_b: number;
        };
        Returns: undefined;
      };
      update_airfield_as_operator: {
        Args: {
          p_airfield_id: string;
          p_name: string;
          p_contact_email: string | null;
          p_contact_phone: string | null;
          p_working_hours: string | null;
          p_latitude: number;
          p_longitude: number;
          p_country: string;
          p_has_fuel: boolean;
          p_has_hangar: boolean;
          p_has_rental: boolean;
          p_description: string | null;
          p_destination_info: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      flight_booking_status:
        | "pending"
        | "accepted"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "rejected"
        | "expired";
      flight_language: "hr" | "en" | "it";
      flight_status: "draft" | "published" | "cancelled" | "completed";
      ledger_entry_type:
        | "booking_payment"
        | "platform_fee"
        | "pilot_payout"
        | "refund"
        | "payout_failed";
      flight_type: "panoramic" | "excursion" | "one_way";
      doc_review_status: "pending" | "approved" | "rejected";
      payout_status_type: "pending" | "paid" | "failed" | "not_applicable";
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
      flight_booking_status: [
        "pending",
        "accepted",
        "confirmed",
        "completed",
        "cancelled",
        "rejected",
        "expired",
      ],
      flight_language: ["hr", "en", "it"],
      flight_status: ["draft", "published", "cancelled", "completed"],
      ledger_entry_type: [
        "booking_payment",
        "platform_fee",
        "pilot_payout",
        "refund",
        "payout_failed",
      ],
      flight_type: ["panoramic", "excursion", "one_way"],
      doc_review_status: ["pending", "approved", "rejected"],
      payout_status_type: ["pending", "paid", "failed", "not_applicable"],
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
