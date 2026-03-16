export interface Source {
  id?: string;
  title: string;
  authors: string;
  year: string;
  journal: string;
  doi?: string | null;
  pmid?: string | null;
  url: string | null;
  type: string;
  source_db: string;
  abstract?: string;
  citedByCount?: number;
  verified: boolean;
}

export interface EvidenceResult {
  evidence_summary: string;
  personalized_interpretation: string;
  context_fit: {
    matches: string[];
    gaps: string[];
    track_next: string[];
  };
  evidence_quality: {
    level: "High" | "Moderate" | "Low";
    explanation: string;
  };
  practical_steps: string[];
  safety_note: string;
  sources: Source[];
  last_updated: string;
  insufficient?: boolean;
  sourceCount?: number;
}

export interface ContextQuestion {
  id: string;
  text: string;
  type: "single" | "multi";
  options: string[];
  required: boolean;
  prefill?: string | null;
}

export interface SavedEntry {
  id?: string;
  query: string;
  answers: Record<string, string>;
  result: EvidenceResult;
  savedAt: string;
}

export interface JournalEntry {
  id?: string;
  type: "text" | "voice";
  title: string;
  content: string;
  createdAt: string;
}

export interface UserProfile {
  ageRange?: string;
  sex?: string;
  activityLevel?: string;
  goals?: string;
  dietPattern?: string;
  healthConditions?: string; // comma-separated
  supplements?: string;      // comma-separated
  sleepQuality?: string;
}

export interface Suggestion {
  category: "nutrition" | "exercise" | "recovery" | "wellness" | "sleep";
  icon: string;
  title: string;
  summary: string;
  detail: string;
  why: string;
}

export type Screen =
  | "home"
  | "context"
  | "results"
  | "journal"
  | "viewSaved"
  | "foryou"
  | "profile"
  | "login"
  | "signup";
