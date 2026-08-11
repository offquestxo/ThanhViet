/**
 * Hand-written types matching supabase/migrations/0001_init.sql,
 * 0002_roles_and_approval.sql, and 0003_chunks_and_workspace.sql.
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

export type ProfileRole = "member" | "admin" | "ceo";
export type ApprovalStatus = "pending" | "approved" | "rejected";

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
          role: ProfileRole;
          approval_status: ApprovalStatus;
          email: string | null;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          accent_pref?: "northern" | "southern";
          total_points?: number;
          created_at?: string;
          role?: ProfileRole;
          approval_status?: ApprovalStatus;
          email?: string | null;
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
        // No longer unit-scoped directly (0003) — reached via `chunk_words`.
        // Still the atomic unit for Tone Tuner drills.
        Row: {
          id: string;
          vietnamese_text: string;
          english_text: string;
          tone_pattern: string | null;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vietnamese_text: string;
          english_text: string;
          tone_pattern?: string | null;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["words"]["Insert"]>;
        Relationships: [];
      };
      chunks: {
        // Primary teaching unit (Section 1a) — sentence/phrase-level,
        // pulled from real talks. See 0003.
        Row: {
          id: string;
          unit_id: string;
          vietnamese_text: string;
          english_text: string;
          source_context: string | null;
          audio_url: string | null;
          structural_concept:
            | "classifier"
            | "topic_comment"
            | "particle"
            | "tone_identity"
            | "none";
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id: string;
          vietnamese_text: string;
          english_text: string;
          source_context?: string | null;
          audio_url?: string | null;
          structural_concept?:
            | "classifier"
            | "topic_comment"
            | "particle"
            | "tone_identity"
            | "none";
          display_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["chunks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chunks_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      chunk_words: {
        // Composite PK (chunk_id, word_id), no surrogate id — pure join
        // linking a Chunk to the Word entries it contains, for Tone Tuner
        // purposes. See 0003.
        Row: {
          chunk_id: string;
          word_id: string;
          display_order: number;
        };
        Insert: {
          chunk_id: string;
          word_id: string;
          display_order?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["chunk_words"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "chunk_words_chunk_id_fkey";
            columns: ["chunk_id"];
            isOneToOne: false;
            referencedRelation: "chunks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chunk_words_word_id_fkey";
            columns: ["word_id"];
            isOneToOne: false;
            referencedRelation: "words";
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
      user_chunk_progress: {
        // SRS scheduling (Half-Life Regression, simplified for Phase 1a —
        // see the flag comment at the top of migration 0003). One row per
        // (user, chunk).
        Row: {
          id: string;
          user_id: string;
          chunk_id: string;
          mastery_level: number;
          recognition_accuracy: number | null;
          last_practiced_at: string | null;
          interval_days: number;
          ease_factor: number;
          next_review_at: string | null;
          consecutive_correct: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          chunk_id: string;
          mastery_level?: number;
          recognition_accuracy?: number | null;
          last_practiced_at?: string | null;
          interval_days?: number;
          ease_factor?: number;
          next_review_at?: string | null;
          consecutive_correct?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_chunk_progress"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "user_chunk_progress_chunk_id_fkey";
            columns: ["chunk_id"];
            isOneToOne: false;
            referencedRelation: "chunks";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_items: {
        // Talk Practice / Personal Workspace (Section 5.6) — supersedes the
        // unused 0001 talk_practice_sets stub. See 0003.
        Row: {
          id: string;
          user_id: string;
          title: string;
          source_text: string;
          item_type: "talk" | "demo" | "prayer" | "reading" | "other";
          deadline_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          source_text: string;
          item_type?: "talk" | "demo" | "prayer" | "reading" | "other";
          deadline_date: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_items"]["Insert"]
        >;
        Relationships: [];
      };
      rehearsal_chunks: {
        // Breath-group segmented (Principle 3) — distinct from the
        // Learning tab's `chunks` table above.
        Row: {
          id: string;
          workspace_item_id: string;
          text: string;
          display_order: number;
          tier: "verbatim" | "gist";
          is_opener: boolean;
          is_closer: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_item_id: string;
          text: string;
          display_order?: number;
          tier?: "verbatim" | "gist";
          is_opener?: boolean;
          is_closer?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rehearsal_chunks"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "rehearsal_chunks_workspace_item_id_fkey";
            columns: ["workspace_item_id"];
            isOneToOne: false;
            referencedRelation: "workspace_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_rehearsal_progress: {
        // Drives weak-spot-first resurfacing (Principle 5). Note: 1:1 with
        // rehearsal_chunks in practice — see Flag 3 in migration 0003.
        Row: {
          id: string;
          user_id: string;
          rehearsal_chunk_id: string;
          error_count: number;
          avg_hesitation_ms: number | null;
          last_practiced_at: string | null;
          mastery_status: "weak" | "developing" | "ready";
        };
        Insert: {
          id?: string;
          user_id: string;
          rehearsal_chunk_id: string;
          error_count?: number;
          avg_hesitation_ms?: number | null;
          last_practiced_at?: string | null;
          mastery_status?: "weak" | "developing" | "ready";
        };
        Update: Partial<
          Database["public"]["Tables"]["user_rehearsal_progress"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "user_rehearsal_progress_rehearsal_chunk_id_fkey";
            columns: ["rehearsal_chunk_id"];
            isOneToOne: false;
            referencedRelation: "rehearsal_chunks";
            referencedColumns: ["id"];
          },
        ];
      };
      workspace_schedules: {
        // Build-then-taper curve (Principle 2). PK is workspace_item_id —
        // 1:1 with workspace_items, no surrogate id.
        Row: {
          workspace_item_id: string;
          deadline_date: string;
          build_phase_end: string | null;
          taper_start: string | null;
        };
        Insert: {
          workspace_item_id: string;
          deadline_date: string;
          build_phase_end?: string | null;
          taper_start?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_schedules"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "workspace_schedules_workspace_item_id_fkey";
            columns: ["workspace_item_id"];
            isOneToOne: true;
            referencedRelation: "workspace_items";
            referencedColumns: ["id"];
          },
        ];
      };
      full_run_through_attempts: {
        // Taper-phase drill (Principle 5). `timestamp` from the spec
        // sketch renamed to `created_at` — see Flag 6 in migration 0003.
        Row: {
          id: string;
          user_id: string;
          workspace_item_id: string;
          completed_without_restart: boolean;
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workspace_item_id: string;
          completed_without_restart: boolean;
          duration_seconds: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["full_run_through_attempts"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "full_run_through_attempts_workspace_item_id_fkey";
            columns: ["workspace_item_id"];
            isOneToOne: false;
            referencedRelation: "workspace_items";
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
