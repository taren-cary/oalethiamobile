export interface TimelineAction {
  date: string;
  action: string;
  transit: string;
  strategy?: string;
  strategies?: string[];
  youtubeVideos?: Array< { title: string; url: string; thumbnail: string }>;
  articles?: Array< { title: string; url: string }>;
}

export interface SavedTimeline {
  id: string;
  user_id: string;
  outcome: string;
  context: string;
  timeframe: number;
  actions: TimelineAction[];
  timeline_affirmations: string[];
  summary: { actionsGenerated?: number };
  credits_used: number;
  created_at: string;
  /** One of 12 life-context slugs for affirmation image folder (e.g. career, identity). */
  life_context?: string | null;
}
