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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_access_audit: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_ids: string[] | null
          resource_type: string
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_ids?: string[] | null
          resource_type: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_ids?: string[] | null
          resource_type?: string
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          agent_type: string
          created_at: string
          generated_content: string
          id: string
          input_data: Json
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          generated_content: string
          id?: string
          input_data: Json
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          generated_content?: string
          id?: string
          input_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auth_attempts: {
        Row: {
          created_at: string
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address: unknown
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          colors: string[] | null
          created_at: string
          id: string
          instagram_images: string[] | null
          logo_url: string | null
          mood: string | null
          name: string
          overall_description: string | null
          person_photos: Json | null
          recurring_elements: string[] | null
          typography: Json | null
          updated_at: string
          user_id: string
          visual_style: string | null
        }
        Insert: {
          colors?: string[] | null
          created_at?: string
          id?: string
          instagram_images?: string[] | null
          logo_url?: string | null
          mood?: string | null
          name: string
          overall_description?: string | null
          person_photos?: Json | null
          recurring_elements?: string[] | null
          typography?: Json | null
          updated_at?: string
          user_id: string
          visual_style?: string | null
        }
        Update: {
          colors?: string[] | null
          created_at?: string
          id?: string
          instagram_images?: string[] | null
          logo_url?: string | null
          mood?: string | null
          name?: string
          overall_description?: string | null
          person_photos?: Json | null
          recurring_elements?: string[] | null
          typography?: Json | null
          updated_at?: string
          user_id?: string
          visual_style?: string | null
        }
        Relationships: []
      }
      brand_projects: {
        Row: {
          brand_profile_id: string | null
          created_at: string
          default_formats: string[] | null
          id: string
          name: string
          person_analysis: Json | null
          person_photo_url: string | null
          updated_at: string
          user_id: string
          variations_count: number | null
        }
        Insert: {
          brand_profile_id?: string | null
          created_at?: string
          default_formats?: string[] | null
          id?: string
          name: string
          person_analysis?: Json | null
          person_photo_url?: string | null
          updated_at?: string
          user_id: string
          variations_count?: number | null
        }
        Update: {
          brand_profile_id?: string | null
          created_at?: string
          default_formats?: string[] | null
          id?: string
          name?: string
          person_analysis?: Json | null
          person_photo_url?: string | null
          updated_at?: string
          user_id?: string
          variations_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_projects_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          likes_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_access_audit: {
        Row: {
          accessed_at: string
          action: string
          id: string
          ip_address: unknown
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_registration_rate_limit: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          last_registration: string | null
          registration_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: unknown
          last_registration?: string | null
          registration_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          last_registration?: string | null
          registration_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      form_submission_rate_limit: {
        Row: {
          created_at: string | null
          form_type: string
          id: string
          ip_address: unknown
          last_submission: string | null
          submission_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          form_type: string
          id?: string
          ip_address: unknown
          last_submission?: string | null
          submission_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          form_type?: string
          id?: string
          ip_address?: unknown
          last_submission?: string | null
          submission_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          module_id: string | null
          order_index: number
          title: string
          training_id: string | null
          updated_at: string
          video_platform: string | null
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          order_index?: number
          title: string
          training_id?: string | null
          updated_at?: string
          video_platform?: string | null
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          module_id?: string | null
          order_index?: number
          title?: string
          training_id?: string | null
          updated_at?: string
          video_platform?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_agents_access: {
        Row: {
          agent_key: string
          created_at: string
          id: string
          label: string | null
          plan: string
        }
        Insert: {
          agent_key: string
          created_at?: string
          id?: string
          label?: string | null
          plan: string
        }
        Update: {
          agent_key?: string
          created_at?: string
          id?: string
          label?: string | null
          plan?: string
        }
        Relationships: []
      }
      plan_courses_access: {
        Row: {
          course_id: string
          created_at: string
          id: string
          plan: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          plan: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_courses_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          monthly_credits: number
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_credits?: number
          plan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_credits?: number
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          daily_credits_limit: number | null
          display_name: string | null
          id: string
          is_trial_active: boolean | null
          role: string | null
          status: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_credits_limit?: number | null
          display_name?: string | null
          id?: string
          is_trial_active?: boolean | null
          role?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          daily_credits_limit?: number | null
          display_name?: string | null
          id?: string
          is_trial_active?: boolean | null
          role?: string | null
          status?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      project_generations: {
        Row: {
          banner_text: string | null
          created_at: string
          cta: string | null
          formats: string[]
          id: string
          images: Json
          project_id: string
          user_id: string
        }
        Insert: {
          banner_text?: string | null
          created_at?: string
          cta?: string | null
          formats?: string[]
          id?: string
          images?: Json
          project_id: string
          user_id: string
        }
        Update: {
          banner_text?: string | null
          created_at?: string
          cta?: string | null
          formats?: string[]
          id?: string
          images?: Json
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "brand_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_price_config: {
        Row: {
          billing_cycle: string
          created_at: string
          id: string
          plan_tier: string
          price_id: string
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string
          id?: string
          plan_tier: string
          price_id: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          id?: string
          plan_tier?: string
          price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trainings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_credits_usage: {
        Row: {
          agent_type: string
          created_at: string
          credits_used: number
          date_used: string | null
          id: string
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          credits_used?: number
          date_used?: string | null
          id?: string
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          credits_used?: number
          date_used?: string | null
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_enrollments: {
        Row: {
          course_id: string | null
          enrolled_at: string
          id: string
          training_id: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          enrolled_at?: string
          id?: string
          training_id: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          enrolled_at?: string
          id?: string
          training_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          agent_type: string
          created_at: string
          generated_content: string
          id: string
          input_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string
          generated_content: string
          id?: string
          input_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          generated_content?: string
          id?: string
          input_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          sent_by: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sent_by?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sent_by?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_auth_rate_limit: {
        Args: {
          p_email?: string
          p_ip_address: unknown
          p_max_per_hour?: number
          p_max_per_minute?: number
        }
        Returns: boolean
      }
      check_event_registration_rate_limit: { Args: never; Returns: boolean }
      check_form_rate_limit: {
        Args: { form_name: string; max_per_hour?: number }
        Returns: boolean
      }
      decrypt_pii: { Args: { encrypted_data: string }; Returns: string }
      detect_suspicious_auth_activity: {
        Args: {
          p_ip_address: unknown
          p_max_failures?: number
          p_time_window_minutes?: number
        }
        Returns: boolean
      }
      encrypt_pii: { Args: { data: string }; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_decrypted_event_registration: {
        Args: { registration_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_decrypted_event_registrations: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_event_registration_details: {
        Args: { registration_id: string }
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_event_registrations_masked: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_pii_encryption_key: { Args: never; Returns: string }
      get_security_stats: {
        Args: never
        Returns: {
          failed_attempts: number
          successful_attempts: number
          suspicious_ips: number
          total_auth_attempts: number
          unique_ips: number
        }[]
      }
      get_user_daily_credits_usage: {
        Args: { p_date?: string; p_user_id: string }
        Returns: number
      }
      get_user_monthly_credits_usage: {
        Args: { p_month_year?: string; p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_trial_active: { Args: { p_user_id: string }; Returns: boolean }
      log_admin_access: {
        Args: {
          p_action: string
          p_metadata?: Json
          p_resource_ids?: string[]
          p_resource_type?: string
          p_target_user_id?: string
        }
        Returns: undefined
      }
      log_auth_attempt: {
        Args: {
          p_email?: string
          p_failure_reason?: string
          p_ip_address: unknown
          p_success?: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_auth_event: {
        Args: { details?: Json; event_type: string }
        Returns: undefined
      }
      log_data_access: {
        Args: { p_action: string; p_record_id: string; p_table_name: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_new_values?: Json
          p_old_values?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
