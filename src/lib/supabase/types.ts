/**
 * Hand-written types matching supabase/migrations/0001_init.sql.
 *
 * Shape follows what @supabase/postgrest-js expects for type inference
 * (each table needs Row/Insert/Update/Relationships; the schema needs
 * Tables/Views/Functions) — this is the same shape the Supabase CLI's
 * codegen produces.
 *
 * These will drift from the real schema as it evolves. Once the Supabase
 * CLI is worth installing, replace this file by running:
 *   supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
 * Until then, update this by hand alongside any migration.
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          accent_pref: "northern" | "southern";
          total_points: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          accent_pref?: "northern" | "southern";
          total_points?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          title: string;
          order: number;
          source_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          order: number;
          source_reference?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          unit_id: string | null;
          vietnamese_text: string;
          english_text: string;
          tone_pattern: string | null;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id?: string | null;
          vietnamese_text: string;
          english_text: string;
          tone_pattern?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["words"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "words_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          mastery_level: number;
          last_practiced_at: string | null;
          accuracy_history: unknown;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          mastery_level?: number;
          last_practiced_at?: string | null;
          accuracy_history?: unknown;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_progress"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "user_progress_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      talk_practice_sets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_text?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["talk_practice_sets"]["Insert"]
        >;
        Relationships: [];
      };
      talk_practice_words: {
        Row: {
          id: string;
          talk_practice_set_id: string;
          word_id: string;
        };
        Insert: {
          id?: string;
          talk_practice_set_id: string;
          word_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["talk_practice_words"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "talk_practice_words_talk_practice_set_id_fkey";
            columns: ["talk_practice_set_id"];
            isOneToOne: false;
            referencedRelation: "talk_practice_sets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "talk_practice_words_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      tone_practice_attempts: {
        Row: {
          id: string;
          user_id: string;
          word_id: string;
          detected_tone: string | null;
          target_tone: string | null;
          passed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word_id: string;
          detected_tone?: string | null;
          target_tone?: string | null;
          passed: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["tone_practice_attempts"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "tone_practice_attempts_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
            referencedColumns: ["id"];
          },
        ];
      };
      badges: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          icon_url: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["badges"]["Insert"]>;
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_badges"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "badges";
            referencedColumns: ["id"];
          },
        ];
      };
      user_streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_streaks"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          name: string;
          total_points: number;
          current_streak: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
  };
};
