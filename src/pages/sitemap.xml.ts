import type { APIRoute } from "astro";
import { getAllPosts } from "../lib/posts";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const urls = [
    "<url><loc>https://diamondfsd.com/</loc></url>",
    ...posts.map((post) => `<url><loc>https://diamondfsd.com/${post.slug}/</loc></url>`)
  ].join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};
