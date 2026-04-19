import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { PostFrontmatter, PostRecord } from "../types/post";

const postsDir = path.resolve("content/posts");

function normalizeFrontmatter(slug: string, frontmatter: PostFrontmatter, body: string): PostRecord {
  return {
    slug,
    title: frontmatter.title ?? slug,
    description: frontmatter.description ?? "",
    tags: frontmatter.tags ?? [],
    img: frontmatter.img,
    draft: frontmatter.draft ?? false,
    date: frontmatter.date ?? "",
    body
  };
}

export async function getAllPosts(): Promise<PostRecord[]> {
  const entries = await fs.readdir(postsDir, { withFileTypes: true }).catch(() => []);
  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));

  const posts = await Promise.all(
    markdownFiles.map(async (entry) => {
      const slug = entry.name.replace(/\.md$/, "");
      const filePath = path.join(postsDir, entry.name);
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      return normalizeFrontmatter(slug, parsed.data as PostFrontmatter, parsed.content);
    })
  );

  return posts
    .filter((post) => !post.draft)
    .sort((left, right) => right.date.localeCompare(left.date));
}

export async function getPostBySlug(slug: string): Promise<PostRecord | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}
