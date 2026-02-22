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
      event_achievements: {
        Row: {
          achievement_type: string
          awarded_at: string
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          points: number
          title: string
        }
        Insert: {
          achievement_type: string
          awarded_at?: string
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          points?: number
          title: string
        }
        Update: {
          achievement_type?: string
          awarded_at?: string
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          points?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_achievements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          display_name: string
          email: string
          event_id: string
          id: string
          invite_token: string
          is_moderator: boolean
          joined_at: string | null
          status: Database["public"]["Enums"]["attendee_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          event_id: string
          id?: string
          invite_token?: string
          is_moderator?: boolean
          joined_at?: string | null
          status?: Database["public"]["Enums"]["attendee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          event_id?: string
          id?: string
          invite_token?: string
          is_moderator?: boolean
          joined_at?: string | null
          status?: Database["public"]["Enums"]["attendee_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          attendee_id: string
          content: string
          created_at: string
          display_name: string
          event_id: string
          id: string
        }
        Insert: {
          attendee_id: string
          content: string
          created_at?: string
          display_name: string
          event_id: string
          id?: string
        }
        Update: {
          attendee_id?: string
          content?: string
          created_at?: string
          display_name?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "event_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_photos: {
        Row: {
          attendee_id: string
          created_at: string
          display_name: string
          event_id: string
          id: string
          storage_path: string
          url: string
        }
        Insert: {
          attendee_id: string
          created_at?: string
          display_name: string
          event_id: string
          id?: string
          storage_path: string
          url: string
        }
        Update: {
          attendee_id?: string
          created_at?: string
          display_name?: string
          event_id?: string
          id?: string
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_photos_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "event_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_program: {
        Row: {
          block_type: string
          completed_at: string | null
          config: Json
          created_at: string
          duration_minutes: number | null
          event_id: string
          game_id: string | null
          game_state: Json
          id: string
          sort_order: number
          started_at: string | null
          status: Database["public"]["Enums"]["program_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          block_type?: string
          completed_at?: string | null
          config?: Json
          created_at?: string
          duration_minutes?: number | null
          event_id: string
          game_id?: string | null
          game_state?: Json
          id?: string
          sort_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: string
          completed_at?: string | null
          config?: Json
          created_at?: string
          duration_minutes?: number | null
          event_id?: string
          game_id?: string | null
          game_state?: Json
          id?: string
          sort_order?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["program_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_program_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_program_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games_library"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          event_date: string | null
          event_type: string
          id: string
          is_active: boolean
          live_code: string
          seriousness_level: number
          settings: Json
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          live_code?: string
          seriousness_level?: number
          settings?: Json
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          live_code?: string
          seriousness_level?: number
          settings?: Json
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_responses: {
        Row: {
          attendee_id: string
          created_at: string
          id: string
          payload: Json
          program_id: string
          response_type: string
          round_number: number
          score: number
        }
        Insert: {
          attendee_id: string
          created_at?: string
          id?: string
          payload?: Json
          program_id: string
          response_type: string
          round_number?: number
          score?: number
        }
        Update: {
          attendee_id?: string
          created_at?: string
          id?: string
          payload?: Json
          program_id?: string
          response_type?: string
          round_number?: number
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_responses_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "event_attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_responses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "event_program"
            referencedColumns: ["id"]
          },
        ]
      }
      games_library: {
        Row: {
          category: Database["public"]["Enums"]["game_category"]
          created_at: string
          default_config: Json
          description: string | null
          estimated_duration_minutes: number
          icon: string | null
          id: string
          is_published: boolean
          max_players: number | null
          min_players: number
          name: string
          slug: string
        }
        Insert: {
          category: Database["public"]["Enums"]["game_category"]
          created_at?: string
          default_config?: Json
          description?: string | null
          estimated_duration_minutes?: number
          icon?: string | null
          id?: string
          is_published?: boolean
          max_players?: number | null
          min_players?: number
          name: string
          slug: string
        }
        Update: {
          category?: Database["public"]["Enums"]["game_category"]
          created_at?: string
          default_config?: Json
          description?: string | null
          estimated_duration_minutes?: number
          icon?: string | null
          id?: string
          is_published?: boolean
          max_players?: number | null
          min_players?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: { Args: { token: string }; Returns: string }
      is_event_member: { Args: { p_event_id: string }; Returns: boolean }
    }
    Enums: {
      attendee_status: "invited" | "confirmed" | "declined" | "maybe"
      game_category: "icebreaker" | "quiz" | "party" | "creative" | "team"
      program_status: "pending" | "active" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]),
> = (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends {
  Row: infer R
}
  ? R
  : never

export type TablesInsert<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T] extends {
  Insert: infer I
}
  ? I
  : never

export type TablesUpdate<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T] extends {
  Update: infer U
}
  ? U
  : never

export type Enums<
  T extends keyof PublicSchema["Enums"],
> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      attendee_status: ["invited", "confirmed", "declined", "maybe"],
      game_category: ["icebreaker", "quiz", "party", "creative", "team"],
      program_status: ["pending", "active", "completed"],
    },
  },
} as const
