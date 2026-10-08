export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      avatar_moderation_log: {
        Row: {
          auto: boolean
          created_at: string
          id: string
          note: string | null
          storage_path: string
          user_id: string
          verdict: Database["public"]["Enums"]["avatar_moderation_status"]
        }
        Insert: {
          auto?: boolean
          created_at?: string
          id?: string
          note?: string | null
          storage_path: string
          user_id: string
          verdict: Database["public"]["Enums"]["avatar_moderation_status"]
        }
        Update: {
          auto?: boolean
          created_at?: string
          id?: string
          note?: string | null
          storage_path?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["avatar_moderation_status"]
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_holder: string
          account_last4: string
          bank_name: string
          created_at: string
          iban_masked: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder: string
          account_last4: string
          bank_name: string
          created_at?: string
          iban_masked?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          account_last4?: string
          bank_name?: string
          created_at?: string
          iban_masked?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          auto_complete_at: string | null
          cancellation_policy: string
          created_at: string
          currency: string
          end_time: string
          frequency: string | null
          id: string
          listing_page_url: string | null
          notes: string | null
          owner_fee: number
          owner_id: string
          payment_intent_id: string | null
          payment_status: string
          pet_id: string | null
          pet_ids: Json | null
          pet_names_display: string | null
          platform_commission: number
          provider_amount: number
          provider_display_name: string | null
          provider_display_photo: string | null
          provider_display_title: string | null
          refunded_amount: number
          service_id: string
          sitter_id: string
          start_time: string
          status: Database["public"]["Enums"]["booking_status"]
          tip_amount: number
          total_price: number
          transfer_id: string | null
          updated_at: string
        }
        Insert: {
          auto_complete_at?: string | null
          cancellation_policy?: string
          created_at?: string
          currency?: string
          end_time: string
          frequency?: string | null
          id?: string
          listing_page_url?: string | null
          notes?: string | null
          owner_fee?: number
          owner_id: string
          payment_intent_id?: string | null
          payment_status?: string
          pet_id?: string | null
          pet_ids?: Json | null
          pet_names_display?: string | null
          platform_commission?: number
          provider_amount?: number
          provider_display_name?: string | null
          provider_display_photo?: string | null
          provider_display_title?: string | null
          refunded_amount?: number
          service_id: string
          sitter_id: string
          start_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          tip_amount?: number
          total_price?: number
          transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_complete_at?: string | null
          cancellation_policy?: string
          created_at?: string
          currency?: string
          end_time?: string
          frequency?: string | null
          id?: string
          listing_page_url?: string | null
          notes?: string | null
          owner_fee?: number
          owner_id?: string
          payment_intent_id?: string | null
          payment_status?: string
          pet_id?: string | null
          pet_ids?: Json | null
          pet_names_display?: string | null
          platform_commission?: number
          provider_amount?: number
          provider_display_name?: string | null
          provider_display_photo?: string | null
          provider_display_title?: string | null
          refunded_amount?: number
          service_id?: string
          sitter_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tip_amount?: number
          total_price?: number
          transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          attachment_urls: Json
          country: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          phone: string | null
          subject: string
          town: string | null
        }
        Insert: {
          attachment_urls?: Json
          country?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          phone?: string | null
          subject: string
          town?: string | null
        }
        Update: {
          attachment_urls?: Json
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          phone?: string | null
          subject?: string
          town?: string | null
        }
        Relationships: []
      }
      demo_short_ids: {
        Row: {
          created_at: string
          short_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          short_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          short_id?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          kind: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          target_id?: string
          user_id?: string
        }
        Relationships: []
      }
      kb_articles: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      lost_pet_claims: {
        Row: {
          created_at: string
          finder_id: string
          id: string
          lost_pet_id: string
          message: string | null
          photo_urls: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          finder_id: string
          id?: string
          lost_pet_id: string
          message?: string | null
          photo_urls?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          finder_id?: string
          id?: string
          lost_pet_id?: string
          message?: string | null
          photo_urls?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_claims_finder_id_fkey"
            columns: ["finder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pet_claims_lost_pet_id_fkey"
            columns: ["lost_pet_id"]
            isOneToOne: false
            referencedRelation: "lost_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pets: {
        Row: {
          breed: string | null
          city: string | null
          close_reason: string | null
          closed_at: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          last_seen_date: string
          last_seen_lat: number | null
          last_seen_location: string
          last_seen_lon: number | null
          owner_id: string
          pet_id: string | null
          pet_name: string
          photos: string[] | null
          reunited_at: string | null
          reward_amount: number | null
          reward_currency: string | null
          species: string
          status: string
          updated_at: string
        }
        Insert: {
          breed?: string | null
          city?: string | null
          close_reason?: string | null
          closed_at?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_seen_date?: string
          last_seen_lat?: number | null
          last_seen_location: string
          last_seen_lon?: number | null
          owner_id: string
          pet_id?: string | null
          pet_name: string
          photos?: string[] | null
          reunited_at?: string | null
          reward_amount?: number | null
          reward_currency?: string | null
          species: string
          status?: string
          updated_at?: string
        }
        Update: {
          breed?: string | null
          city?: string | null
          close_reason?: string | null
          closed_at?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_seen_date?: string
          last_seen_lat?: number | null
          last_seen_location?: string
          last_seen_lon?: number | null
          owner_id?: string
          pet_id?: string | null
          pet_name?: string
          photos?: string[] | null
          reunited_at?: string | null
          reward_amount?: number | null
          reward_currency?: string | null
          species?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pets_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          id: string
          listing_id: string | null
          listing_type: string | null
          read_at: string | null
          recipient_display_name: string | null
          recipient_display_photo: string | null
          recipient_id: string
          sender_display_name: string | null
          sender_display_photo: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_type?: string | null
          read_at?: string | null
          recipient_display_name?: string | null
          recipient_display_photo?: string | null
          recipient_id: string
          sender_display_name?: string | null
          sender_display_photo?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          listing_type?: string | null
          read_at?: string | null
          recipient_display_name?: string | null
          recipient_display_photo?: string | null
          recipient_id?: string
          sender_display_name?: string | null
          sender_display_photo?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string
          cardholder: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          user_id: string
        }
        Insert: {
          brand: string
          cardholder: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last4: string
          user_id: string
        }
        Update: {
          brand?: string
          cardholder?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          kind: string
          owner_id: string
          provider_id: string
          status: string
          stripe_object_id: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind: string
          owner_id: string
          provider_id: string
          status?: string
          stripe_object_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          kind?: string
          owner_id?: string
          provider_id?: string
          status?: string
          stripe_object_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_disputes: {
        Row: {
          buyer_id: string
          created_at: string
          evidence_urls: Json
          id: string
          pet_order_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          evidence_urls?: Json
          id?: string
          pet_order_id: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          evidence_urls?: Json
          id?: string
          pet_order_id?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_disputes_pet_order_id_fkey"
            columns: ["pet_order_id"]
            isOneToOne: false
            referencedRelation: "pet_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_listings: {
        Row: {
          age: string | null
          breed: string | null
          certificates: Json
          child_friendly: boolean
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          gallery: Json
          good_with_cats: boolean
          good_with_dogs: boolean
          id: string
          is_free: boolean
          location: string | null
          photo_url: string | null
          price: number
          seller_id: string
          species: string
          status: string
          temperament: string | null
          title: string
          updated_at: string
          vaccinations: Json
        }
        Insert: {
          age?: string | null
          breed?: string | null
          certificates?: Json
          child_friendly?: boolean
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          gallery?: Json
          good_with_cats?: boolean
          good_with_dogs?: boolean
          id?: string
          is_free?: boolean
          location?: string | null
          photo_url?: string | null
          price: number
          seller_id: string
          species?: string
          status?: string
          temperament?: string | null
          title: string
          updated_at?: string
          vaccinations?: Json
        }
        Update: {
          age?: string | null
          breed?: string | null
          certificates?: Json
          child_friendly?: boolean
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          gallery?: Json
          good_with_cats?: boolean
          good_with_dogs?: boolean
          id?: string
          is_free?: boolean
          location?: string | null
          photo_url?: string | null
          price?: number
          seller_id?: string
          species?: string
          status?: string
          temperament?: string | null
          title?: string
          updated_at?: string
          vaccinations?: Json
        }
        Relationships: []
      }
      pet_offers: {
        Row: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_by_buyer_at?: string | null
          confirmed_by_seller_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_adoption?: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline?: string | null
          payment_intent_id?: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code?: string | null
          seller_id?: string | null
          seller_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_by_buyer_at?: string | null
          confirmed_by_seller_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_adoption?: boolean
          listed_price_cents?: number
          offer_amount_cents?: number
          payment_deadline?: string | null
          payment_intent_id?: string | null
          pet_listing_id?: string
          pet_name?: string
          pickup_code?: string | null
          seller_id?: string | null
          seller_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pet_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          pet_order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          pet_order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          pet_order_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_reviews_pet_order_id_fkey"
            columns: ["pet_order_id"]
            isOneToOne: false
            referencedRelation: "pet_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string
          id: string
          name: string
          neutered: boolean | null
          notes: string | null
          owner_id: string
          photo_url: string | null
          sex: string | null
          species: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name: string
          neutered?: boolean | null
          notes?: string | null
          owner_id: string
          photo_url?: string | null
          sex?: string | null
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string
          id?: string
          name?: string
          neutered?: boolean | null
          notes?: string | null
          owner_id?: string
          photo_url?: string | null
          sex?: string | null
          species?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_moderation_note: string | null
          avatar_reviewed_at: string | null
          avatar_status: Database["public"]["Enums"]["avatar_moderation_status"]
          avatar_submitted_at: string | null
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          business_address: string | null
          business_name: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          currency: string
          facebook_verified: boolean
          full_name: string
          gender: string | null
          id: string
          language: string
          last_login: string | null
          last_seen_at: string | null
          location: string | null
          notification_prefs: Json
          pending_avatar_url: string | null
          phone: string | null
          phone_country_code: string | null
          postal_city: string | null
          postal_code: string | null
          postal_country: string | null
          postal_street: string | null
          provider_categories: string[]
          provider_quiz_passed_at: string | null
          service_categories: Json
          stripe_account_id: string | null
          stripe_status: string
          theme: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
          vat_number: string | null
        }
        Insert: {
          avatar_moderation_note?: string | null
          avatar_reviewed_at?: string | null
          avatar_status?: Database["public"]["Enums"]["avatar_moderation_status"]
          avatar_submitted_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          business_address?: string | null
          business_name?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          facebook_verified?: boolean
          full_name?: string
          gender?: string | null
          id: string
          language?: string
          last_login?: string | null
          last_seen_at?: string | null
          location?: string | null
          notification_prefs?: Json
          pending_avatar_url?: string | null
          phone?: string | null
          phone_country_code?: string | null
          postal_city?: string | null
          postal_code?: string | null
          postal_country?: string | null
          postal_street?: string | null
          provider_categories?: string[]
          provider_quiz_passed_at?: string | null
          service_categories?: Json
          stripe_account_id?: string | null
          stripe_status?: string
          theme?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
          vat_number?: string | null
        }
        Update: {
          avatar_moderation_note?: string | null
          avatar_reviewed_at?: string | null
          avatar_status?: Database["public"]["Enums"]["avatar_moderation_status"]
          avatar_submitted_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          business_address?: string | null
          business_name?: string | null
          country?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          facebook_verified?: boolean
          full_name?: string
          gender?: string | null
          id?: string
          language?: string
          last_login?: string | null
          last_seen_at?: string | null
          location?: string | null
          notification_prefs?: Json
          pending_avatar_url?: string | null
          phone?: string | null
          phone_country_code?: string | null
          postal_city?: string | null
          postal_code?: string | null
          postal_country?: string | null
          postal_street?: string | null
          provider_categories?: string[]
          provider_quiz_passed_at?: string | null
          service_categories?: Json
          stripe_account_id?: string | null
          stripe_status?: string
          theme?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          sitter_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          sitter_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          sitter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          availability: string | null
          certifications: Json | null
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_pricing: Json | null
          gallery: Json | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          photo_url: string | null
          price_max: number | null
          price_min: number | null
          price_per_hour: number
          province: string | null
          service_attributes: Json | null
          service_type: Database["public"]["Enums"]["service_type"]
          services_offered: Json | null
          sitter_id: string
          slot_duration: number | null
          title: string
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          active?: boolean
          availability?: string | null
          certifications?: Json | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_pricing?: Json | null
          gallery?: Json | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          photo_url?: string | null
          price_max?: number | null
          price_min?: number | null
          price_per_hour?: number
          province?: string | null
          service_attributes?: Json | null
          service_type: Database["public"]["Enums"]["service_type"]
          services_offered?: Json | null
          sitter_id: string
          slot_duration?: number | null
          title: string
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          active?: boolean
          availability?: string | null
          certifications?: Json | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_pricing?: Json | null
          gallery?: Json | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          photo_url?: string | null
          price_max?: number | null
          price_min?: number | null
          price_per_hour?: number
          province?: string | null
          service_attributes?: Json | null
          service_type?: Database["public"]["Enums"]["service_type"]
          services_offered?: Json | null
          sitter_id?: string
          slot_duration?: number | null
          title?: string
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          status: string
          transcript: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          status?: string
          transcript?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          status?: string
          transcript?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      swivv_announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string | null
          id: string
          scheduled_for: string | null
          sent_at: string | null
          target_country: string | null
          title: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          target_country?: string | null
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          target_country?: string | null
          title?: string
        }
        Relationships: []
      }
      swivv_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: []
      }
      swivv_chat_feedback: {
        Row: {
          created_at: string
          detail: string
          id: number
          kind: string
          msg_id: string
          reactor: string
        }
        Insert: {
          created_at?: string
          detail?: string
          id?: never
          kind: string
          msg_id: string
          reactor?: string
        }
        Update: {
          created_at?: string
          detail?: string
          id?: never
          kind?: string
          msg_id?: string
          reactor?: string
        }
        Relationships: []
      }
      swivv_chats: {
        Row: {
          audio_url: string | null
          body: string
          created_at: string
          duration_s: number | null
          msg_id: string
          peer_id: string
          peer_name: string
          peer_photo: string
          sender: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          body: string
          created_at?: string
          duration_s?: number | null
          msg_id: string
          peer_id: string
          peer_name?: string
          peer_photo?: string
          sender: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          body?: string
          created_at?: string
          duration_s?: number | null
          msg_id?: string
          peer_id?: string
          peer_name?: string
          peer_photo?: string
          sender?: string
          user_id?: string
        }
        Relationships: []
      }
      swivv_internal_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          target_id: string
          target_kind: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          target_id: string
          target_kind: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          target_id?: string
          target_kind?: string
        }
        Relationships: []
      }
      swivv_moderation_cases: {
        Row: {
          action_taken: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          priority: string
          reason: string | null
          report_id: string | null
          status: string
          subject_user_id: string | null
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: string
          reason?: string | null
          report_id?: string | null
          status?: string
          subject_user_id?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          priority?: string
          reason?: string | null
          report_id?: string | null
          status?: string
          subject_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "swivv_moderation_cases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "swivv_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      swivv_notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      swivv_profiles: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      swivv_reports: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          evidence_url: string | null
          id: string
          priority: string
          reported_user_id: string | null
          reporter_id: string | null
          resolution: string | null
          resolved_at: string | null
          status: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          priority?: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          evidence_url?: string | null
          id?: string
          priority?: string
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string
        }
        Relationships: []
      }
      swivv_support_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swivv_support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "swivv_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      swivv_support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      swivv_user_status: {
        Row: {
          reason: string | null
          status: string
          until: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          reason?: string | null
          status?: string
          until?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          reason?: string | null
          status?: string
          until?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      swivv_verification_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_pet_offer: {
        Args: { _offer_id: string }
        Returns: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_pet_offer: {
        Args: { _offer_id: string; _reason?: string }
        Returns: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_unpaid_offer: {
        Args: { _offer_id: string }
        Returns: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_pet_received:
        | {
            Args: { _offer_id: string }
            Returns: {
              buyer_id: string
              cancel_reason: string | null
              cancelled_at: string | null
              cancelled_by: string | null
              confirmed_by_buyer_at: string | null
              confirmed_by_seller_at: string | null
              created_at: string
              currency: string
              id: string
              is_adoption: boolean
              listed_price_cents: number
              offer_amount_cents: number
              payment_deadline: string | null
              payment_intent_id: string | null
              pet_listing_id: string
              pet_name: string
              pickup_code: string | null
              seller_id: string | null
              seller_name: string | null
              status: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "pet_offers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { _offer_id: string; _pickup_code?: string }
            Returns: {
              buyer_id: string
              cancel_reason: string | null
              cancelled_at: string | null
              cancelled_by: string | null
              confirmed_by_buyer_at: string | null
              confirmed_by_seller_at: string | null
              created_at: string
              currency: string
              id: string
              is_adoption: boolean
              listed_price_cents: number
              offer_amount_cents: number
              payment_deadline: string | null
              payment_intent_id: string | null
              pet_listing_id: string
              pet_name: string
              pickup_code: string | null
              seller_id: string | null
              seller_name: string | null
              status: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "pet_offers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      create_demo_auth_user: {
        Args: {
          p_email: string
          p_id: string
          p_name: string
          p_password: string
        }
        Returns: undefined
      }
      create_pet_offer:
        | {
            Args: {
              _currency?: string
              _listed_price_cents: number
              _offer_amount_cents: number
              _pet_listing_id: string
              _pet_name: string
              _seller_name: string
            }
            Returns: {
              buyer_id: string
              cancel_reason: string | null
              cancelled_at: string | null
              cancelled_by: string | null
              confirmed_by_buyer_at: string | null
              confirmed_by_seller_at: string | null
              created_at: string
              currency: string
              id: string
              is_adoption: boolean
              listed_price_cents: number
              offer_amount_cents: number
              payment_deadline: string | null
              payment_intent_id: string | null
              pet_listing_id: string
              pet_name: string
              pickup_code: string | null
              seller_id: string | null
              seller_name: string | null
              status: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "pet_offers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              _currency?: string
              _listed_price_cents: number
              _offer_amount_cents: number
              _pet_listing_id: string
              _pet_name: string
              _seller_id?: string
              _seller_name: string
            }
            Returns: {
              buyer_id: string
              cancel_reason: string | null
              cancelled_at: string | null
              cancelled_by: string | null
              confirmed_by_buyer_at: string | null
              confirmed_by_seller_at: string | null
              created_at: string
              currency: string
              id: string
              is_adoption: boolean
              listed_price_cents: number
              offer_amount_cents: number
              payment_deadline: string | null
              payment_intent_id: string | null
              pet_listing_id: string
              pet_name: string
              pickup_code: string | null
              seller_id: string | null
              seller_name: string | null
              status: string
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "pet_offers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      decline_pet_offer: {
        Args: { _offer_id: string }
        Returns: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      escrow_pet_offer: {
        Args: { _offer_id: string; _payment_intent_id: string }
        Returns: {
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_by_buyer_at: string | null
          confirmed_by_seller_at: string | null
          created_at: string
          currency: string
          id: string
          is_adoption: boolean
          listed_price_cents: number
          offer_amount_cents: number
          payment_deadline: string | null
          payment_intent_id: string | null
          pet_listing_id: string
          pet_name: string
          pickup_code: string | null
          seller_id: string | null
          seller_name: string | null
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_offers"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_pickup_code: { Args: { _offer_id: string }; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_moderation_note: string | null
          avatar_reviewed_at: string | null
          avatar_status: Database["public"]["Enums"]["avatar_moderation_status"]
          avatar_submitted_at: string | null
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          business_address: string | null
          business_name: string | null
          country: string | null
          cover_url: string | null
          created_at: string
          currency: string
          facebook_verified: boolean
          full_name: string
          gender: string | null
          id: string
          language: string
          last_login: string | null
          last_seen_at: string | null
          location: string | null
          notification_prefs: Json
          pending_avatar_url: string | null
          phone: string | null
          phone_country_code: string | null
          postal_city: string | null
          postal_code: string | null
          postal_country: string | null
          postal_street: string | null
          provider_categories: string[]
          provider_quiz_passed_at: string | null
          service_categories: Json
          stripe_account_id: string | null
          stripe_status: string
          theme: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string | null
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: never; Returns: boolean }
      open_pet_dispute: {
        Args: { _evidence_urls?: Json; _offer_id: string; _reason: string }
        Returns: {
          buyer_id: string
          created_at: string
          evidence_urls: Json
          id: string
          pet_order_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pet_offers_daily_count: { Args: never; Returns: number }
      resolve_pet_dispute: {
        Args: { _dispute_id: string; _notes?: string; _status: string }
        Returns: {
          buyer_id: string
          created_at: string
          evidence_urls: Json
          id: string
          pet_order_id: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          seller_id: string
          status: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "pet_disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      staff_level: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "super_admin"
        | "support"
        | "analyst"
      avatar_moderation_status: "pending" | "approved" | "rejected"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      service_type:
        | "dog_walking"
        | "pet_sitting"
        | "boarding"
        | "daycare"
        | "drop_in"
        | "grooming"
        | "veterinary"
      user_type: "owner" | "sitter" | "both"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "moderator",
        "user",
        "super_admin",
        "support",
        "analyst",
      ],
      avatar_moderation_status: ["pending", "approved", "rejected"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      service_type: [
        "dog_walking",
        "pet_sitting",
        "boarding",
        "daycare",
        "drop_in",
        "grooming",
        "veterinary",
      ],
      user_type: ["owner", "sitter", "both"],
    },
  },
} as const

