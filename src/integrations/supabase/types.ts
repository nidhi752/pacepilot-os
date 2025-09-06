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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          context_refs_json: Json | null
          created_at: string | null
          id: string
          message: string
          response: string | null
          user_id: string
        }
        Insert: {
          context_refs_json?: Json | null
          created_at?: string | null
          id?: string
          message: string
          response?: string | null
          user_id: string
        }
        Update: {
          context_refs_json?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chunks: {
        Row: {
          course_id: string | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          meta_json: Json | null
          text: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          meta_json?: Json | null
          text: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          meta_json?: Json | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string | null
          id: string
          instructor: string | null
          schedule_json: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          instructor?: string | null
          schedule_json?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          instructor?: string | null
          schedule_json?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          course_id: string | null
          created_at: string | null
          doc_type: string
          extracted_text: string | null
          file_path: string | null
          id: string
          meta_json: Json | null
          title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          doc_type: string
          extracted_text?: string | null
          file_path?: string | null
          id?: string
          meta_json?: Json | null
          title: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          doc_type?: string
          extracted_text?: string | null
          file_path?: string | null
          id?: string
          meta_json?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          course_id: string | null
          created_at: string | null
          exam_date: string
          exam_name: string
          id: string
          meta_json: Json | null
          user_id: string
          weightage: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          exam_date: string
          exam_name: string
          id?: string
          meta_json?: Json | null
          user_id: string
          weightage?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          exam_date?: string
          exam_name?: string
          id?: string
          meta_json?: Json | null
          user_id?: string
          weightage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          extractions_json: Json | null
          id: string
          lecture_date: string | null
          source_type: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          extractions_json?: Json | null
          id?: string
          lecture_date?: string | null
          source_type: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          extractions_json?: Json | null
          id?: string
          lecture_date?: string | null
          source_type?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          study_goals: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          study_goals?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          study_goals?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers_json: Json | null
          completed_at: string | null
          id: string
          quiz_id: string
          score: number | null
          started_at: string | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          answers_json?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id: string
          score?: number | null
          started_at?: string | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          answers_json?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          options_json: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          source_refs_json: Json | null
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          options_json?: Json | null
          question_text: string
          question_type: string
          quiz_id: string
          source_refs_json?: Json | null
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          options_json?: Json | null
          question_text?: string
          question_type?: string
          quiz_id?: string
          source_refs_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          scope_type: string
          scope_value: string | null
          title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          scope_type: string
          scope_value?: string | null
          title: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          scope_type?: string
          scope_value?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      study_profiles: {
        Row: {
          avg_pomodoro_minutes: number | null
          created_at: string | null
          id: string
          learning_velocity: number | null
          section_estimates: Json | null
          target_daily_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_pomodoro_minutes?: number | null
          created_at?: string | null
          id?: string
          learning_velocity?: number | null
          section_estimates?: Json | null
          target_daily_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_pomodoro_minutes?: number | null
          created_at?: string | null
          id?: string
          learning_velocity?: number | null
          section_estimates?: Json | null
          target_daily_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          course_id: string | null
          created_at: string | null
          end_date: string
          flashcards_json: Json | null
          id: string
          period_type: string
          start_date: string
          summary_text: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          end_date: string
          flashcards_json?: Json | null
          id?: string
          period_type: string
          start_date: string
          summary_text?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          end_date?: string
          flashcards_json?: Json | null
          id?: string
          period_type?: string
          start_date?: string
          summary_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_minutes: number | null
          completed_at: string | null
          course_id: string | null
          created_at: string | null
          description: string | null
          due_at: string | null
          estimated_minutes: number | null
          google_calendar_event_id: string | null
          id: string
          links_json: Json | null
          priority: number | null
          rrule: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          actual_minutes?: number | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          links_json?: Json | null
          priority?: number | null
          rrule?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          actual_minutes?: number | null
          completed_at?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          google_calendar_event_id?: string | null
          id?: string
          links_json?: Json | null
          priority?: number | null
          rrule?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
