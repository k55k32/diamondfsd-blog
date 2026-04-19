export interface PostFrontmatter {
  title?: string;
  description?: string;
  tags?: string[];
  img?: string;
  draft?: boolean;
  date?: string;
}

export interface PostRecord {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  img?: string;
  draft: boolean;
  date: string;
  body: string;
}
