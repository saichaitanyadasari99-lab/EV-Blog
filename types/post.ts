export type PostCategory =
  | "post"
  | "review"
  | "deep-dive"
  | "benchmark"
  | "news"
  | "standards";

export type PostRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_url: string | null;
  category: PostCategory | null;
  tags: string[] | null;
  published: boolean;
  reading_time: number | null;
  references?: Array<{ title: string; url: string }> | null;
};

export type SavePostInput = {
  id?: string;
  title: string;
  slug?: string;
  content: Record<string, unknown> | null;
  excerpt?: string;
  cover_url?: string;
  category?: PostCategory;
  tags?: string[];
  published?: boolean;
};
