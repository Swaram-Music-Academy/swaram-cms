export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          line_1: string
          line_2: string | null
          state: string
          unit: string | null
          zipcode: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          line_1: string
          line_2?: string | null
          state: string
          unit?: string | null
          zipcode: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          line_1?: string
          line_2?: string | null
          state?: string
          unit?: string | null
          zipcode?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      batch_schedules: {
        Row: {
          batch_id: string | null
          created_at: string
          day_of_week: Database["public"]["Enums"]["days"] | null
          end_time: string | null
          id: string
          start_time: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["days"] | null
          end_time?: string | null
          id?: string
          start_time?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["days"] | null
          end_time?: string | null
          id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_schedule_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_year_courses: {
        Row: {
          batch_id: string | null
          course_id: string | null
          created_at: string
          id: string
          year_number: number | null
        }
        Insert: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          year_number?: number | null
        }
        Update: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          year_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_year_courses_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_year_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          academic_year: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
        }
        Insert: {
          academic_year?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
        }
        Update: {
          academic_year?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          phone: string
          whatsapp_num: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone: string
          whatsapp_num?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          phone?: string
          whatsapp_num?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration_years: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_years?: number
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_years?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          batch_id: string | null
          completion_date: string | null
          course_id: string | null
          created_at: string
          current_year: number | null
          enrollment_date: string | null
          id: string
          status: Database["public"]["Enums"]["enrollment_status"] | null
          student_id: string | null
        }
        Insert: {
          batch_id?: string | null
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          current_year?: number | null
          enrollment_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string | null
        }
        Update: {
          batch_id?: string | null
          completion_date?: string | null
          course_id?: string | null
          created_at?: string
          current_year?: number | null
          enrollment_date?: string | null
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"] | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          created_by: string | null
          expense_date: string
          id: string
          notes: string | null
          paid_to: string | null
          payment_method: string | null
          receipt_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          created_by?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          paid_to?: string | null
          payment_method?: string | null
          receipt_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          total_fee: number | null
          year_number: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          total_fee?: number | null
          year_number?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          total_fee?: number | null
          year_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_history: {
        Row: {
          course_id: string
          created_at: string
          enrollment_ids: string[]
          excluded_ids: string[]
          from_year: number
          id: string
          promoted_by: string | null
          promotion_date: string
          source_batch_id: string
          target_batch_id: string
          to_year: number
        }
        Insert: {
          course_id: string
          created_at?: string
          enrollment_ids?: string[]
          excluded_ids?: string[]
          from_year: number
          id?: string
          promoted_by?: string | null
          promotion_date?: string
          source_batch_id: string
          target_batch_id: string
          to_year: number
        }
        Update: {
          course_id?: string
          created_at?: string
          enrollment_ids?: string[]
          excluded_ids?: string[]
          from_year?: number
          id?: string
          promoted_by?: string | null
          promotion_date?: string
          source_batch_id?: string
          target_batch_id?: string
          to_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "promotion_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_source_batch_id_fkey"
            columns: ["source_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_history_target_batch_id_fkey"
            columns: ["target_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          payee: string | null
          payment_date: string | null
          payment_method: Database["public"]["Enums"]["payment_type"] | null
          receipt_number: number
          reference_number: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          payee?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_type"] | null
          receipt_number?: number
          reference_number?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          payee?: string | null
          payment_date?: string | null
          payment_method?: Database["public"]["Enums"]["payment_type"] | null
          receipt_number?: number
          reference_number?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string | null
          permissions: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          permissions?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          permissions?: Json | null
        }
        Relationships: []
      }
      student_fee_summary: {
        Row: {
          course_id: string | null
          created_at: string
          discount: number | null
          final_fees: number | null
          id: string
          status: Database["public"]["Enums"]["fee_status"] | null
          student_id: string | null
          total_fees: number | null
          year_number: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          discount?: number | null
          final_fees?: number | null
          id?: string
          status?: Database["public"]["Enums"]["fee_status"] | null
          student_id?: string | null
          total_fees?: number | null
          year_number?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string
          discount?: number | null
          final_fees?: number | null
          id?: string
          status?: Database["public"]["Enums"]["fee_status"] | null
          student_id?: string | null
          total_fees?: number | null
          year_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_summary_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_summary_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_installments: {
        Row: {
          academic_year: number | null
          created_at: string
          due_date: string | null
          fee_summary_id: string | null
          id: string
          installment_amount: number | null
          installment_number: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          receipt_id: string | null
        }
        Insert: {
          academic_year?: number | null
          created_at?: string
          due_date?: string | null
          fee_summary_id?: string | null
          id?: string
          installment_amount?: number | null
          installment_number?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_id?: string | null
        }
        Update: {
          academic_year?: number | null
          created_at?: string
          due_date?: string | null
          fee_summary_id?: string | null
          id?: string
          installment_amount?: number | null
          installment_number?: number | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          receipt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_installments_fee_summary_id_fkey"
            columns: ["fee_summary_id"]
            isOneToOne: false
            referencedRelation: "student_fee_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_installments_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registeration_fees: {
        Row: {
          created_at: string
          id: string
          is_paid: boolean | null
          receipt_id: string | null
          registeration_fee: number | null
          student_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_paid?: boolean | null
          receipt_id?: string | null
          registeration_fee?: number | null
          student_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_paid?: boolean | null
          receipt_id?: string | null
          registeration_fee?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_registeration_fees_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registeration_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address_id: string | null
          admission_date: string
          avatar_url: string | null
          created_at: string
          date_of_birth: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          gr_no: number
          id: string
          last_name: string
          middle_name: string | null
        }
        Insert: {
          address_id?: string | null
          admission_date?: string
          avatar_url?: string | null
          created_at?: string
          date_of_birth: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          gr_no?: number
          id?: string
          last_name: string
          middle_name?: string | null
        }
        Update: {
          address_id?: string | null
          admission_date?: string
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          gr_no?: number
          id?: string
          last_name?: string
          middle_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      students_contacts: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          occupation: string | null
          relationship: Database["public"]["Enums"]["relation"] | null
          student_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          occupation?: string | null
          relationship?: Database["public"]["Enums"]["relation"] | null
          student_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          occupation?: string | null
          relationship?: Database["public"]["Enums"]["relation"] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_contacts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string | null
          role_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_fee_summary: {
        Args: { enrollment_id: string }
        Returns: undefined
      }
      get_payment_history: {
        Args: { p_student_id: string }
        Returns: {
          amount: number
          description: string
          due_date: string
          fee_type: string
          payment_status: string
          receipt_id: string
        }[]
      }
      get_timetable_by_slot: { Args: never; Returns: Json }
      promote_students: {
        Args: {
          p_course_id: string
          p_enrollment_ids: string[]
          p_excluded_ids?: string[]
          p_from_year: number
          p_new_year: number
          p_promoted_by?: string
          p_source_batch_id: string
          p_target_batch_id: string
        }
        Returns: string
      }
      undo_promotion: {
        Args: { p_enrollment_ids?: string[]; p_history_id: string }
        Returns: undefined
      }
    }
    Enums: {
      days:
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday"
        | "Sunday"
        | ""
      enrollment_status: "Enrolled" | "Completed" | "Dropped"
      fee_status: "Active" | "Cancelled"
      gender: "Male" | "Female"
      payment_status: "Pending" | "Completed"
      payment_type: "Cash" | "Cheque" | "UPI"
      relation: "Self" | "Father" | "Mother" | "Guardian"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      days: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "",
      ],
      enrollment_status: ["Enrolled", "Completed", "Dropped"],
      fee_status: ["Active", "Cancelled"],
      gender: ["Male", "Female"],
      payment_status: ["Pending", "Completed"],
      payment_type: ["Cash", "Cheque", "UPI"],
      relation: ["Self", "Father", "Mother", "Guardian"],
    },
  },
} as const

