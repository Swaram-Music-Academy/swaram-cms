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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      batch_schedules: {
        Row: {
          batch_id: string
          day_of_week: Database["public"]["Enums"]["days"]
          end_time: string
          id: string
          start_time: string
        }
        Insert: {
          batch_id: string
          day_of_week: Database["public"]["Enums"]["days"]
          end_time: string
          id?: string
          start_time: string
        }
        Update: {
          batch_id?: string
          day_of_week?: Database["public"]["Enums"]["days"]
          end_time?: string
          id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_schedules_batch_id_fkey"
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
          year_number: number
        }
        Insert: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          year_number: number
        }
        Update: {
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          id?: string
          year_number?: number
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
      cities: {
        Row: {
          id: number
          name: string
          state_id: number | null
        }
        Insert: {
          id?: number
          name?: string
          state_id?: number | null
        }
        Update: {
          id?: number
          name?: string
          state_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
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
      countries: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name?: string
        }
        Update: {
          id?: number
          name?: string
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
      states: {
        Row: {
          country_id: number | null
          id: number
          name: string
        }
        Insert: {
          country_id?: number | null
          id?: number
          name?: string
        }
        Update: {
          country_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "states_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          id: string
          is_paid: boolean | null
          receipt_id: string | null
          registeration_fee: number
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          receipt_id?: string | null
          registeration_fee?: number
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          receipt_id?: string | null
          registeration_fee?: number
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
          created_at: string | null
          date_of_birth: string
          first_name: string
          form_url: string | null
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
          created_at?: string | null
          date_of_birth: string
          first_name: string
          form_url?: string | null
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
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          form_url?: string | null
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
      get_all_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: number
          username: string
          email: string
          created_at: string
        }[]
      }
      get_payment_history: {
        Args: { p_student_id: string }
        Returns: {
          due_date: string
          fee_type: string
          description: string
          amount: number
          receipt_id: string
          payment_status: string
        }[]
      }
      get_timetable_by_slot: {
        Args: Record<PropertyKey, never>
        Returns: Json
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
