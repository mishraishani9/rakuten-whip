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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      game_events: {
        Row: {
          created_at: string
          dice_value: number | null
          difficulty: string | null
          event_type: string
          game_id: string
          id: string
          is_correct: boolean | null
          player_id: string | null
          position: number | null
          question_id: string | null
          theme: string | null
        }
        Insert: {
          created_at?: string
          dice_value?: number | null
          difficulty?: string | null
          event_type: string
          game_id: string
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          position?: number | null
          question_id?: string | null
          theme?: string | null
        }
        Update: {
          created_at?: string
          dice_value?: number | null
          difficulty?: string | null
          event_type?: string
          game_id?: string
          id?: string
          is_correct?: boolean | null
          player_id?: string | null
          position?: number | null
          question_id?: string | null
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          code: string
          created_at: string
          game_id: string | null
          host_user_id: string
          id: string
          max_players: number
          presenter_mode: boolean
          snapshot: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          game_id?: string | null
          host_user_id: string
          id?: string
          max_players?: number
          presenter_mode?: boolean
          snapshot?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          game_id?: string | null
          host_user_id?: string
          id?: string
          max_players?: number
          presenter_mode?: boolean
          snapshot?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          ended_at: string | null
          game_name: string
          id: string
          number_of_players: number
          started_at: string | null
          status: string
          total_questions_used: number
          winner_player_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          game_name: string
          id?: string
          number_of_players?: number
          started_at?: string | null
          status?: string
          total_questions_used?: number
          winner_player_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          game_name?: string
          id?: string
          number_of_players?: number
          started_at?: string | null
          status?: string
          total_questions_used?: number
          winner_player_id?: string | null
        }
        Relationships: []
      }
      players: {
        Row: {
          bar_count: number
          bonus_count: number
          club_count: number
          completed_circuit: boolean
          correct_answers: number
          created_at: string
          final_position: number
          final_rank: number | null
          game_id: string
          id: string
          incorrect_answers: number
          jail_count: number
          pawn_color: string
          player_name: string
          player_number: number
          timeouts: number
          turns_taken: number
        }
        Insert: {
          bar_count?: number
          bonus_count?: number
          club_count?: number
          completed_circuit?: boolean
          correct_answers?: number
          created_at?: string
          final_position?: number
          final_rank?: number | null
          game_id: string
          id?: string
          incorrect_answers?: number
          jail_count?: number
          pawn_color?: string
          player_name: string
          player_number: number
          timeouts?: number
          turns_taken?: number
        }
        Update: {
          bar_count?: number
          bonus_count?: number
          club_count?: number
          completed_circuit?: boolean
          correct_answers?: number
          created_at?: string
          final_position?: number
          final_rank?: number | null
          game_id?: string
          id?: string
          incorrect_answers?: number
          jail_count?: number
          pawn_color?: string
          player_name?: string
          player_number?: number
          timeouts?: number
          turns_taken?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      presenter_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      question_results: {
        Row: {
          correct_option: string
          created_at: string
          difficulty: string
          game_id: string
          id: string
          is_correct: boolean
          is_timeout: boolean
          player_id: string | null
          position: number | null
          question_record_id: string
          selected_option: string | null
          theme: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          difficulty: string
          game_id: string
          id?: string
          is_correct?: boolean
          is_timeout?: boolean
          player_id?: string | null
          position?: number | null
          question_record_id: string
          selected_option?: string | null
          theme: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          difficulty?: string
          game_id?: string
          id?: string
          is_correct?: boolean
          is_timeout?: boolean
          player_id?: string | null
          position?: number | null
          question_record_id?: string
          selected_option?: string | null
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_results_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          correct_option: string
          created_at: string
          difficulty: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          record_id: string
          record_type: string
          theme: string
          under_review: boolean
        }
        Insert: {
          correct_answer: string
          correct_option: string
          created_at?: string
          difficulty: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          record_id: string
          record_type?: string
          theme: string
          under_review?: boolean
        }
        Update: {
          correct_answer?: string
          correct_option?: string
          created_at?: string
          difficulty?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          record_id?: string
          record_type?: string
          theme?: string
          under_review?: boolean
        }
        Relationships: []
      }
      room_messages: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          kind: string
          room_id: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          id?: string
          kind?: string
          room_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          kind?: string
          room_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_players: {
        Row: {
          color: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_online: boolean
          pending_answer: string | null
          pending_dice: number | null
          player_number: number
          room_id: string
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_online?: boolean
          pending_answer?: string | null
          pending_dice?: number | null
          player_number: number
          room_id: string
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_online?: boolean
          pending_answer?: string | null
          pending_dice?: number | null
          player_number?: number
          room_id?: string
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "presenter" | "player"
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
      app_role: ["admin", "presenter", "player"],
    },
  },
} as const
