import type { APIRoute } from "astro";
import { getAllPosts } from "../lib/posts";

export const GET: APIRoute = async () => {
  const posts = await getAllPosts();
  const items = posts
    .map(
      (post) => `
        <item>
          <title><![CDATA[${post.title}]]></title>
          <link>https://diamondfsd.com/${post.slug}/</link>
          <description><![CDATA[${post.description}]]></description>
          <pubDate>${new Date(post.date || "1970-01-01").toUTCString()}</pubDate>
        </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Diamond-Blog</title>
    <link>https://diamondfsd.com/</link>
    <description>Diamond Zhou's blog</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};
