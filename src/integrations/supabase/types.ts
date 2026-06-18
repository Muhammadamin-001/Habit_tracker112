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
      daily_reports: {
        Row: {
          average_percent: number
          completed_tasks: number
          created_at: string
          id: string
          report_date: string
          section_breakdown: Json
          total_tasks: number
          user_id: string
        }
        Insert: {
          average_percent?: number
          completed_tasks?: number
          created_at?: string
          id?: string
          report_date: string
          section_breakdown?: Json
          total_tasks?: number
          user_id: string
        }
        Update: {
          average_percent?: number
          completed_tasks?: number
          created_at?: string
          id?: string
          report_date?: string
          section_breakdown?: Json
          total_tasks?: number
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          payload: Json | null
          sent_via: Database["public"]["Enums"]["sent_via"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json | null
          sent_via?: Database["public"]["Enums"]["sent_via"]
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          payload?: Json | null
          sent_via?: Database["public"]["Enums"]["sent_via"]
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_sections_seeded: boolean
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone_number: string | null
          settings: Json
          telegram_id: number | null
          timezone: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          default_sections_seeded?: boolean
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          settings?: Json
          telegram_id?: number | null
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          default_sections_seeded?: boolean
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone_number?: string | null
          settings?: Json
          telegram_id?: number | null
          timezone?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          sort_order: number
          standard_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          sort_order?: number
          standard_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          sort_order?: number
          standard_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_progress: {
        Row: {
          created_at: string
          done_amount: number
          id: string
          note: string | null
          percent: number
          report_date: string
          reported_via: Database["public"]["Enums"]["sent_via"]
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done_amount?: number
          id?: string
          note?: string | null
          percent?: number
          report_date: string
          reported_via?: Database["public"]["Enums"]["sent_via"]
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done_amount?: number
          id?: string
          note?: string | null
          percent?: number
          report_date?: string
          reported_via?: Database["public"]["Enums"]["sent_via"]
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          created_at: string
          daily_target_amount: number | null
          daily_target_unit: string | null
          deadline_at: string | null
          description: string | null
          history: Json
          id: string
          priority: number
          remind_at: string | null
          report_due_at: string | null
          section_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          total_target_amount: number | null
          updated_at: string
          user_id: string
          week_days: Database["public"]["Enums"]["week_day"][] | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          daily_target_amount?: number | null
          daily_target_unit?: string | null
          deadline_at?: string | null
          description?: string | null
          history?: Json
          id?: string
          priority?: number
          remind_at?: string | null
          report_due_at?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type: Database["public"]["Enums"]["task_type"]
          title: string
          total_target_amount?: number | null
          updated_at?: string
          user_id: string
          week_days?: Database["public"]["Enums"]["week_day"][] | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          daily_target_amount?: number | null
          daily_target_unit?: string | null
          deadline_at?: string | null
          description?: string | null
          history?: Json
          id?: string
          priority?: number
          remind_at?: string | null
          report_due_at?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          task_type?: Database["public"]["Enums"]["task_type"]
          title?: string
          total_target_amount?: number | null
          updated_at?: string
          user_id?: string
          week_days?: Database["public"]["Enums"]["week_day"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_link_codes: {
        Row: {
          code: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          code: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          code?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          processed: boolean
          raw_update: Json
          text: string | null
          tg_user_id: number | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          processed?: boolean
          raw_update: Json
          text?: string | null
          tg_user_id?: number | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          processed?: boolean
          raw_update?: Json
          text?: string | null
          tg_user_id?: number | null
          update_id?: number
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
      get_anonymous_comparison: {
        Args: { _days?: number }
        Returns: {
          global_avg: number
          sample_size: number
          user_avg: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      notification_type:
        | "report-reminder"
        | "late-alert"
        | "onetime-reminder"
        | "onetime-overdue"
        | "weekly"
        | "admin-message"
        | "system"
      sent_via: "telegram" | "web"
      task_status: "active" | "paused" | "completed" | "cancelled" | "overdue"
      task_type: "daily" | "deadline" | "onetime"
      week_day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
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
      app_role: ["user", "admin"],
      notification_type: [
        "report-reminder",
        "late-alert",
        "onetime-reminder",
        "onetime-overdue",
        "weekly",
        "admin-message",
        "system",
      ],
      sent_via: ["telegram", "web"],
      task_status: ["active", "paused", "completed", "cancelled", "overdue"],
      task_type: ["daily", "deadline", "onetime"],
      week_day: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    },
  },
} as const
