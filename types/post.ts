export type PostRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  tags: string[] | null;
  published: boolean;
  reading_time: number | null;
  tier: 'basic' | 'intermediate' | 'advanced' | 'expert';
  pullquote: string | null;
  stats: Array<{ value: string; label: string }> | null;
  references?: Array<{ title: string; url: string }> | null;
  faqs?: Array<{ question: string; answer: string }> | null;
};

export type SavePostInput = {
  id?: string;
  title: string;
  slug?: string;
  content: Record<string, unknown> | null;
  excerpt?: string;
  cover_url?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  tier?: 'basic' | 'intermediate' | 'advanced' | 'expert';
  pullquote?: string;
  stats?: Array<{ value: string; label: string }>;
  faqs?: Array<{ question: string; answer: string }>;
};
