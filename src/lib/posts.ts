import { getCollection } from "astro:content";
import fs from "node:fs/promises";
import path from "node:path";
import type { PostRecord } from "../types/post";

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"]);

function extractImgPath(raw?: string): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/!\[.*?\]\((.+?)\)/);
  return match ? match[1] : raw;
}

/** Copy all images from content/posts/ to public/post-images/ */
async function syncContentImages(): Promise<void> {
  const srcDir = path.resolve("content/posts");
  const destDir = path.resolve("public/post-images");
  await fs.mkdir(destDir, { recursive: true });

  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())) {
      await fs.copyFile(path.join(srcDir, entry.name), path.join(destDir, entry.name));
    }
  }
}

function resolveBodyImages(body: string): string {
  return body.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\//.test(src) || src.startsWith("/")) return match;
    return `![${alt}](/post-images/${src})`;
  });
}

async function resolveCoverImg(rawImg?: string): Promise<string | undefined> {
  const filename = extractImgPath(rawImg);
  if (!filename) return undefined;
  try {
    await fs.access(path.resolve("content/posts", filename));
    return `/post-images/${filename}`;
  } catch {
    return undefined;
  }
}

export async function getAllPosts(): Promise<PostRecord[]> {
  await syncContentImages();

  const entries = await getCollection("posts", ({ data }) => !data.draft);

  const posts = await Promise.all(
    entries.map(async (entry) => ({
      slug: entry.id,
      title: entry.data.title,
      description: entry.data.description,
      tags: entry.data.tags,
      img: await resolveCoverImg(entry.data.img),
      draft: entry.data.draft,
      date: entry.data.date,
      body: resolveBodyImages(entry.body ?? ""),
    }))
  );

  return posts.sort((left, right) => right.date.localeCompare(left.date));
}

export async function getPostBySlug(slug: string): Promise<PostRecord | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}
