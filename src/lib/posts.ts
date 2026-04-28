import { getCollection } from "astro:content";
import fs from "node:fs/promises";
import path from "node:path";
import type { PostRecord } from "../types/post";

function extractImgPath(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/!\[.*?\]\((.+?)\)/);
  return match ? match[1] : raw;
}

async function resolveImg(slug: string, rawImg?: string): Promise<string | undefined> {
  const filename = extractImgPath(rawImg);
  if (!filename) return undefined;

  const srcPath = path.resolve("content/posts", filename);
  const destDir = path.resolve("public/post-images");
  const destPath = path.join(destDir, filename);

  try {
    await fs.access(srcPath);
    await fs.mkdir(destDir, { recursive: true });
    await fs.copyFile(srcPath, destPath);
    return `/post-images/${filename}`;
  } catch {
    return undefined;
  }
}

export async function getAllPosts(): Promise<PostRecord[]> {
  const entries = await getCollection("posts", ({ data }) => !data.draft);

  const posts = await Promise.all(
    entries.map(async (entry) => ({
      slug: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      tags: entry.data.tags,
      img: await resolveImg(entry.id, entry.data.img),
      draft: entry.data.draft,
      date: entry.data.date,
      body: entry.body ?? "",
    }))
  );

  return posts.sort((left, right) => right.date.localeCompare(left.date));
}

export async function getPostBySlug(slug: string): Promise<PostRecord | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}
