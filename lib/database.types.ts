export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      billing_customers: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          stripe_customer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          stripe_customer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          stripe_customer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by_profile_id: string | null
          edited_at: string | null
          id: string
          moderation_status: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          edited_at?: string | null
          id?: string
          moderation_status?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          edited_at?: string | null
          id?: string
          moderation_status?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_deleted_by_profile_id_fkey"
            columns: ["deleted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by_profile_id: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean
          moderation_status: string
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          moderation_status?: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean
          moderation_status?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_deleted_by_profile_id_fkey"
            columns: ["deleted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "community_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          profile_id: string
          reaction_type: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          profile_id?: string
          reaction_type?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          profile_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          moderator_notes: string | null
          post_id: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by_profile_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          moderator_notes?: string | null
          post_id?: string | null
          reason: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          moderator_notes?: string | null
          post_id?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by_profile_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_resolved_by_profile_id_fkey"
            columns: ["resolved_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_roles: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          profile_id: string
          role: string
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          profile_id: string
          role: string
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_roles_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_spaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug: string
          sort_order: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          submitted_by_profile_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          submitted_by_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          submitted_by_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_submitted_by_profile_id_fkey"
            columns: ["submitted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_entries: {
        Row: {
          category: string
          city: string
          created_at: string
          description: string
          email: string | null
          entry_type: string
          id: string
          image_path: string | null
          moderation_status: string
          name: string
          owner_id: string
          phone: string | null
          service_area: string | null
          slug: string
          state: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          city: string
          created_at?: string
          description: string
          email?: string | null
          entry_type?: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          name: string
          owner_id?: string
          phone?: string | null
          service_area?: string | null
          slug: string
          state: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          description?: string
          email?: string | null
          entry_type?: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          name?: string
          owner_id?: string
          phone?: string | null
          service_area?: string | null
          slug?: string
          state?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "directory_entries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          circuit: string
          city: string
          contact_details: string | null
          created_at: string
          description: string
          end_date: string
          id: string
          moderation_status: string
          organizer_directory_entry_id: string | null
          owner_id: string
          slug: string
          start_date: string
          state: string
          title: string
          updated_at: string
          venue: string
          website: string | null
        }
        Insert: {
          circuit: string
          city: string
          contact_details?: string | null
          created_at?: string
          description: string
          end_date: string
          id?: string
          moderation_status?: string
          organizer_directory_entry_id?: string | null
          owner_id?: string
          slug: string
          start_date: string
          state: string
          title: string
          updated_at?: string
          venue: string
          website?: string | null
        }
        Update: {
          circuit?: string
          city?: string
          contact_details?: string | null
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          moderation_status?: string
          organizer_directory_entry_id?: string | null
          owner_id?: string
          slug?: string
          start_date?: string
          state?: string
          title?: string
          updated_at?: string
          venue?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_directory_entry_id_fkey"
            columns: ["organizer_directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_contact: string
          category: string
          city: string
          created_at: string
          description: string
          directory_entry_id: string | null
          employer: string
          employment_type: string
          housing_available: boolean
          id: string
          moderation_status: string
          owner_id: string
          show_travel: boolean
          slug: string
          state: string
          title: string
          updated_at: string
        }
        Insert: {
          application_contact: string
          category: string
          city: string
          created_at?: string
          description: string
          directory_entry_id?: string | null
          employer: string
          employment_type: string
          housing_available?: boolean
          id?: string
          moderation_status?: string
          owner_id?: string
          show_travel?: boolean
          slug: string
          state: string
          title: string
          updated_at?: string
        }
        Update: {
          application_contact?: string
          category?: string
          city?: string
          created_at?: string
          description?: string
          directory_entry_id?: string | null
          employer?: string
          employment_type?: string
          housing_available?: boolean
          id?: string
          moderation_status?: string
          owner_id?: string
          show_travel?: boolean
          slug?: string
          state?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_directory_entry_id_fkey"
            columns: ["directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_directory_relationships: {
        Row: {
          created_at: string
          directory_entry_id: string
          id: string
          listing_id: string
          relationship_type: string
        }
        Insert: {
          created_at?: string
          directory_entry_id: string
          id?: string
          listing_id: string
          relationship_type: string
        }
        Update: {
          created_at?: string
          directory_entry_id?: string
          id?: string
          listing_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_directory_relationships_directory_entry_id_fkey"
            columns: ["directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_directory_relationships_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_event_relationships: {
        Row: {
          created_at: string
          event_id: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_event_relationships_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_event_relationships_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          focal_x: number
          focal_y: number
          id: string
          is_primary: boolean
          listing_id: string
          owner_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_primary?: boolean
          listing_id: string
          owner_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          is_primary?: boolean
          listing_id?: string
          owner_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          owner_id: string
          provider: string
          provider_video_id: string | null
          sort_order: number
          title: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          owner_id: string
          provider: string
          provider_video_id?: string | null
          sort_order?: number
          title?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          owner_id?: string
          provider?: string
          provider_video_id?: string | null
          sort_order?: number
          title?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_videos_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          age: number | null
          breed: string | null
          created_at: string
          description: string | null
          division: string
          height_text: string | null
          horse_name: string
          id: string
          image_alt_text: string | null
          image_focal_position: string
          image_path: string | null
          is_featured: boolean
          is_published: boolean
          listing_type: string
          location: string
          owner_id: string | null
          price_text: string
          sex: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          breed?: string | null
          created_at?: string
          description?: string | null
          division: string
          height_text?: string | null
          horse_name: string
          id?: string
          image_alt_text?: string | null
          image_focal_position?: string
          image_path?: string | null
          is_featured?: boolean
          is_published?: boolean
          listing_type: string
          location: string
          owner_id?: string | null
          price_text: string
          sex?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          breed?: string | null
          created_at?: string
          description?: string | null
          division?: string
          height_text?: string | null
          horse_name?: string
          id?: string
          image_alt_text?: string | null
          image_focal_position?: string
          image_path?: string | null
          is_featured?: boolean
          is_published?: boolean
          listing_type?: string
          location?: string
          owner_id?: string | null
          price_text?: string
          sex?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          past_due_grace_days: number
          slug: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          past_due_grace_days?: number
          slug: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          past_due_grace_days?: number
          slug?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      membership_subscriptions: {
        Row: {
          billing_customer_id: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          ended_at: string | null
          id: string
          last_invoice_status: string | null
          last_stripe_event_created_at: string
          membership_plan_id: string | null
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          billing_customer_id: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          last_invoice_status?: string | null
          last_stripe_event_created_at: string
          membership_plan_id?: string | null
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          billing_customer_id?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          ended_at?: string | null
          id?: string
          last_invoice_status?: string | null
          last_stripe_event_created_at?: string
          membership_plan_id?: string | null
          status?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_subscriptions_billing_customer_id_fkey"
            columns: ["billing_customer_id"]
            isOneToOne: false
            referencedRelation: "billing_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_subscriptions_membership_plan_id_fkey"
            columns: ["membership_plan_id"]
            isOneToOne: false
            referencedRelation: "membership_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean
          location: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_public?: boolean
          location?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          deleted_by_profile_id: string | null
          directory_entry_id: string | null
          edited_at: string | null
          event_id: string | null
          id: string
          listing_id: string | null
          moderation_status: string
          rating: number
          service_offering_id: string | null
          shipping_route_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string
          body: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          directory_entry_id?: string | null
          edited_at?: string | null
          event_id?: string | null
          id?: string
          listing_id?: string | null
          moderation_status?: string
          rating: number
          service_offering_id?: string | null
          shipping_route_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by_profile_id?: string | null
          directory_entry_id?: string | null
          edited_at?: string | null
          event_id?: string | null
          id?: string
          listing_id?: string | null
          moderation_status?: string
          rating?: number
          service_offering_id?: string | null
          shipping_route_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_deleted_by_profile_id_fkey"
            columns: ["deleted_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_directory_entry_id_fkey"
            columns: ["directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_offering_id_fkey"
            columns: ["service_offering_id"]
            isOneToOne: false
            referencedRelation: "service_offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_shipping_route_id_fkey"
            columns: ["shipping_route_id"]
            isOneToOne: false
            referencedRelation: "shipping_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_offerings: {
        Row: {
          category: string
          created_at: string
          description: string
          directory_entry_id: string
          id: string
          image_path: string | null
          moderation_status: string
          service_area: string | null
          slug: string
          title: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          directory_entry_id: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          service_area?: string | null
          slug: string
          title: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          directory_entry_id?: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          service_area?: string | null
          slug?: string
          title?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_offerings_directory_entry_id_fkey"
            columns: ["directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_routes: {
        Row: {
          availability_note: string | null
          created_at: string
          description: string
          destination: string
          directory_entry_id: string
          id: string
          image_path: string | null
          moderation_status: string
          origin: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          availability_note?: string | null
          created_at?: string
          description: string
          destination: string
          directory_entry_id: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          origin: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          availability_note?: string | null
          created_at?: string
          description?: string
          destination?: string
          directory_entry_id?: string
          id?: string
          image_path?: string | null
          moderation_status?: string
          origin?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_routes_directory_entry_id_fkey"
            columns: ["directory_entry_id"]
            isOneToOne: false
            referencedRelation: "directory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_items: {
        Row: {
          category: string
          created_at: string
          description: string
          destination_url: string
          id: string
          image_path: string | null
          is_affiliate: boolean
          moderation_status: string
          owner_id: string
          price_label: string | null
          seller_name: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          destination_url: string
          id?: string
          image_path?: string | null
          is_affiliate?: boolean
          moderation_status?: string
          owner_id?: string
          price_label?: string | null
          seller_name: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          destination_url?: string
          id?: string
          image_path?: string | null
          is_affiliate?: boolean
          moderation_status?: string
          owner_id?: string
          price_label?: string | null
          seller_name?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_media: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          focal_x: number
          focal_y: number
          id: string
          media_key: string
          mobile_storage_path: string | null
          overlay_color: string | null
          overlay_opacity: number
          overlay_tone: string
          page_key: string
          placement: string
          storage_path: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          media_key: string
          mobile_storage_path?: string | null
          overlay_color?: string | null
          overlay_opacity?: number
          overlay_tone?: string
          page_key: string
          placement: string
          storage_path: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          focal_x?: number
          focal_y?: number
          id?: string
          media_key?: string
          mobile_storage_path?: string | null
          overlay_color?: string | null
          overlay_opacity?: number
          overlay_tone?: string
          page_key?: string
          placement?: string
          storage_path?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_media_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_stripe_webhook_event: {
        Args: {
          p_processing_error?: string
          p_processing_status: string
          p_stripe_event_id: string
        }
        Returns: undefined
      }
      record_stripe_webhook_event: {
        Args: {
          p_event_type: string
          p_payload: Json
          p_stripe_created_at: string
          p_stripe_event_id: string
        }
        Returns: boolean
      }
      sync_membership_subscription: {
        Args: {
          p_billing_customer_id: string
          p_cancel_at_period_end: boolean
          p_canceled_at: string
          p_current_period_end: string
          p_current_period_start: string
          p_ended_at: string
          p_last_invoice_status: string
          p_last_stripe_event_created_at: string
          p_membership_plan_id: string
          p_status: string
          p_stripe_price_id: string
          p_stripe_subscription_id: string
          p_trial_end: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
