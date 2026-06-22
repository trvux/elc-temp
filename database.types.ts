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
      about_blocks: {
        Row: {
          caption: string
          content: string
          created_at: string | null
          id: string
          order_index: number
          type: string
        }
        Insert: {
          caption?: string
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number
          type: string
        }
        Update: {
          caption?: string
          content?: string
          created_at?: string | null
          id?: string
          order_index?: number
          type?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          created_at: string | null
          deleted_at: string | null
          description: Json
          email: string
          id: string
          image_url: string | null
          is_published: boolean
          maps_embed: string
          maps_url: string
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number
          phone: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          email?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          maps_embed?: string
          maps_url?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number
          phone?: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          email?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          maps_embed?: string
          maps_url?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number
          phone?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_featured: boolean | null
          logo_url: string
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_featured?: boolean | null
          logo_url?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          id: string
          is_active: boolean | null
          label: string | null
          order_index: number | null
          type: string
          value: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          label?: string | null
          order_index?: number | null
          type: string
          value: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          label?: string | null
          order_index?: number | null
          type?: string
          value?: string
        }
        Relationships: []
      }
      group_categories: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category_id: string | null
          content: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          image: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          order_index: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      old_services: {
        Row: {
          content: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          image: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          order_index: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json
          created_at: string | null
          deleted_at: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          order_index: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string
          category_id: string
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string | null
          deleted_at: string | null
          description: Json
          discount_percent: number | null
          gtin: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          labels: string[] | null
          meta_description: string | null
          meta_title: string | null
          mpn: string | null
          name: string
          order_index: number | null
          original_price: number | null
          sale_price: number | null
          sku: string
          slug: string
          specs: Json
          stock_status: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          category_id: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          discount_percent?: number | null
          gtin?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          labels?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          mpn?: string | null
          name: string
          order_index?: number | null
          original_price?: number | null
          sale_price?: number | null
          sku: string
          slug: string
          specs?: Json
          stock_status?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          discount_percent?: number | null
          gtin?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          labels?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          mpn?: string | null
          name?: string
          order_index?: number | null
          original_price?: number | null
          sale_price?: number | null
          sku?: string
          slug?: string
          specs?: Json
          stock_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      project_category: {
        Row: {
          category_id: string
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          project_id: string
        }
        Insert: {
          category_id: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          project_id: string
        }
        Update: {
          category_id?: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_category_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_service: {
        Row: {
          created_at: string
          project_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_service_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_service_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      project_type: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          image: string | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_type_category: {
        Row: {
          category_id: string
          created_at: string
          project_type_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          project_type_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          project_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_type_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_category_service_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_type"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category_id: string
          created_at: string | null
          deleted_at: string | null
          description: Json
          id: string
          images: string[]
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          order_index: number | null
          project_type_id: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          id?: string
          images?: string[]
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          project_type_id?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: Json
          id?: string
          images?: string[]
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          project_type_id?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_service_type_id_fkey"
            columns: ["project_type_id"]
            isOneToOne: false
            referencedRelation: "project_type"
            referencedColumns: ["id"]
          },
        ]
      }
      service_groups: {
        Row: {
          category_ids: string[] | null
          created_at: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_ids?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_ids?: string[] | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          content: Json | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          discount_percent: number | null
          group_id: string | null
          id: string
          image: string | null
          is_featured: boolean | null
          is_published: boolean | null
          labels: string[] | null
          meta_description: string | null
          meta_title: string | null
          order_index: number | null
          original_price: number | null
          price_display_text: string | null
          sale_price: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          content?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number | null
          group_id?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          labels?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          original_price?: number | null
          price_display_text?: string | null
          sale_price?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          content?: Json | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          discount_percent?: number | null
          group_id?: string | null
          id?: string
          image?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          labels?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          order_index?: number | null
          original_price?: number | null
          price_display_text?: string | null
          sale_price?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      slug_registry: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          entity_id: string
          entity_type: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          entity_id: string
          entity_type: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          entity_id?: string
          entity_type?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_pages: {
        Row: {
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      tracking_events: {
        Row: {
          created_at: string
          event_category: string | null
          event_label: string | null
          event_name: string
          id: string
          metadata: Json | null
          page_path: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          event_category?: string | null
          event_label?: string | null
          event_name: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string | null
          event_label?: string | null
          event_name?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_slug_conflict: {
        Args: { p_entity_id: string; p_entity_type: string; p_slug: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { value: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      product_condition: "new" | "used"
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
      product_condition: ["new", "used"],
    },
  },
} as const
