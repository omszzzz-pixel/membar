export type Family = {
  spouse: boolean;
  children: number;
  father?: string | null;
  mother?: string | null;
  siblings?: string | null;
  notes?: string | null;
};

export type Todo = { text: string; done: boolean; created_at: string };

export type Meeting = {
  date: string; // YYYY-MM-DD
  place?: string | null;
  notes?: string | null;
};

export type Person = {
  id: string;
  user_id: string;
  name: string;
  title: string | null;
  company: string | null;
  location: string | null;
  education: string | null;
  relationship: string | null;
  birth_year: number | null;
  family: Family;
  interests: string[];
  business: string[];
  tags: string[];
  todos: Todo[];
  meetings: Meeting[];
  i_said: string[];
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  last_updated_at: string;
};

export type HistoryEntry = {
  id: string;
  person_id: string;
  raw_input: string;
  parsed_changes: Record<string, unknown>;
  created_at: string;
};

export type ParsedInput = {
  name?: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  education?: string | null;
  relationship?: string | null;
  birth_year?: number | null;
  family?: Partial<Family>;
  interests?: string[];
  interests_remove?: string[];
  business?: string[];
  business_remove?: string[];
  tags?: string[];
  tags_remove?: string[];
  notes?: string | null;
  todos?: string[];
  i_said?: string[];
  meetings?: Meeting[];
  meetings_remove?: string[];
};

export type SortKey = "recent" | "name" | "favorite";

export const FREE_LIMIT = 5;
export const GUEST_SOFT_NUDGE = 3;
export const GUEST_MEDIUM_NUDGE = 4;
export const GUEST_HARD_LIMIT = 5;
export const MONTHLY_MEMO_LIMIT = 10;
export const MEMO_WARN_AT = 8;
export const STALE_DAYS = 30;

export type Usage = { persons: number; memos: number };

export type Briefing = {
  recent_context: string;
  last_conversations: string[];
  topics_to_mention: string[];
  followups: string[];
  sensitivities: string[];
};

export type TimelineItem = {
  id: string;
  person_id: string;
  person_name: string;
  person_favorite: boolean;
  raw_input: string;
  created_at: string;
};
