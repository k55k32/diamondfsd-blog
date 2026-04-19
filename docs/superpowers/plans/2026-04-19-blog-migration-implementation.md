# Blog Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Jekyll blog with an Astro-based GitHub Pages deployment that preserves every historical post URL, keeps Google AdSense active, upgrades analytics to GA4, and reduces future writing to minimal Markdown files.

**Architecture:** Build an Astro static site in parallel inside the existing repository, migrate `_posts/` into a new canonical `content/posts/` store using a scripted one-time transformation, render posts at preserved `/<slug>/` routes, and publish the built output through GitHub Actions to GitHub Pages. Keep static assets path-compatible, isolate ad and analytics scripts in shared layout components, and validate route parity before cutover.

**Tech Stack:** Astro, TypeScript, Node.js, GitHub Actions, GitHub Pages, Markdown content collections or file-based content loading, Google AdSense, Google Analytics 4

---

### Task 1: Baseline inventory and Astro scaffold

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SeoHead.astro`
- Create: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

Create `package.json` with a `build` script that points to Astro before Astro is installed so the first run fails because dependencies are missing.

```json
{
  "name": "diamondfsd-blog",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with a message similar to `astro: command not found` or a missing package error because Astro dependencies are not installed yet.

- [ ] **Step 3: Write minimal implementation**

Replace `package.json` with Astro dependencies and add the base scaffold files.

`package.json`

```json
{
  "name": "diamondfsd-blog",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
```

`astro.config.mjs`

```js
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://diamondfsd.com",
  output: "static",
  trailingSlash: "always"
});
```

`tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

`src/env.d.ts`

```ts
/// <reference types="astro/client" />
```

`src/layouts/BaseLayout.astro`

```astro
---
import SeoHead from "../components/SeoHead.astro";

interface Props {
  title?: string;
  description?: string;
}

const { title = "Diamond-Blog", description = "" } = Astro.props;
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <SeoHead title={title} description={description} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

`src/components/SeoHead.astro`

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description = "" } = Astro.props;
---

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
```

`src/pages/index.astro`

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Diamond-Blog" description="Migrating blog">
  <main>
    <h1>Diamond-Blog</h1>
    <p>Migration scaffold in progress.</p>
  </main>
</BaseLayout>
```

`.gitignore`

```gitignore
node_modules
dist
.astro
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && npm run build`
Expected: PASS with Astro generating a `dist/` directory and no route build failures.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/env.d.ts src/pages/index.astro src/layouts/BaseLayout.astro src/components/SeoHead.astro .gitignore README.md
git commit -m "feat: scaffold astro site"
```

### Task 2: Static assets and global styling port

**Files:**
- Create: `src/styles/global.css`
- Create: `public/assets/`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

Import a stylesheet in `src/layouts/BaseLayout.astro` before creating it so the build fails with a missing import.

```astro
---
import "../styles/global.css";
import SeoHead from "../components/SeoHead.astro";
---
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with an error showing `src/styles/global.css` cannot be resolved.

- [ ] **Step 3: Write minimal implementation**

Create a minimal stylesheet and copy the current `assets/` directory into `public/assets/` without changing file names.

`src/styles/global.css`

```css
:root {
  color-scheme: light;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-family: "PT Serif", serif;
  color: #1f2937;
  background: #f8fafc;
}

a {
  color: inherit;
}

img {
  max-width: 100%;
  display: block;
}
```

Update `src/layouts/BaseLayout.astro` to include the import:

```astro
---
import "../styles/global.css";
import SeoHead from "../components/SeoHead.astro";
---
```

Copy assets:

```bash
mkdir -p public
cp -R assets public/
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with static assets copied under `dist/assets/` and no missing import errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro public/assets README.md
git commit -m "feat: port static assets for astro"
```

### Task 3: Content loader and post schema

**Files:**
- Create: `src/lib/posts.ts`
- Create: `src/types/post.ts`
- Create: `content/posts/.gitkeep`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write the failing test**

Add a homepage import for a not-yet-created post loader.

`src/pages/index.astro`

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getAllPosts } from "../lib/posts";

const posts = await getAllPosts();
---
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with an import resolution error for `../lib/posts`.

- [ ] **Step 3: Write minimal implementation**

Create a typed post loader that reads Markdown files from `content/posts/`.

`src/types/post.ts`

```ts
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
```

`src/lib/posts.ts`

```ts
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
```

Install parser dependency:

```bash
npm install gray-matter
```

Create `content/posts/.gitkeep`.

Update `src/pages/index.astro` to render a basic list.

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getAllPosts } from "../lib/posts";

const posts = await getAllPosts();
---

<BaseLayout title="Diamond-Blog" description="Diamond Zhou's blog">
  <main>
    <h1>Diamond-Blog</h1>
    <ul>
      {posts.map((post) => (
        <li><a href={`/${post.slug}/`}>{post.title}</a></li>
      ))}
    </ul>
  </main>
</BaseLayout>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with homepage built successfully even when `content/posts/` is empty.

- [ ] **Step 5: Commit**

```bash
git add src/lib/posts.ts src/types/post.ts content/posts/.gitkeep src/pages/index.astro package.json package-lock.json
git commit -m "feat: add markdown post loader"
```

### Task 4: Historical post migration script

**Files:**
- Create: `scripts/migrate-posts.mjs`
- Create: `scripts/lib/post-migration.mjs`
- Create: `content/posts/`
- Create: `docs/migration-report.md`
- Test: `scripts/migrate-posts.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/migrate-posts.mjs` with a reference to a helper that does not yet exist.

```js
import { migratePosts } from "./lib/post-migration.mjs";

await migratePosts();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/migrate-posts.mjs`
Expected: FAIL with `Cannot find module './lib/post-migration.mjs'`.

- [ ] **Step 3: Write minimal implementation**

Implement the migration helper to transform every file from `_posts/` into `content/posts/<slug>.md`.

`scripts/lib/post-migration.mjs`

```js
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const inputDir = path.resolve("_posts");
const outputDir = path.resolve("content/posts");
const reportPath = path.resolve("docs/migration-report.md");

function extractSlug(filename) {
  return filename
    .replace(/\.(markdown|md)$/i, "")
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, "");
}

function extractDate(filename, data) {
  if (typeof data.date === "string" && data.date.trim()) {
    return data.date.trim();
  }

  const match = filename.match(/^(\d{4}-\d{1,2}-\d{1,2})-/);
  return match ? match[1] : "";
}

function buildFrontmatter(filename, parsed) {
  const slug = extractSlug(filename);
  const frontmatter = {};

  if (parsed.data.title) frontmatter.title = parsed.data.title;
  if (parsed.data.description) frontmatter.description = parsed.data.description;
  if (parsed.data.tags) frontmatter.tags = parsed.data.tags;
  if (parsed.data.img) frontmatter.img = parsed.data.img;

  const date = extractDate(filename, parsed.data);
  if (date) frontmatter.date = date;

  return { slug, frontmatter };
}

export async function migratePosts() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(path.dirname(reportPath), { recursive: true });

  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  const sourceFiles = entries.filter((entry) => entry.isFile() && /\.(markdown|md)$/i.test(entry.name));
  const reportLines = ["# Migration Report", ""];

  for (const entry of sourceFiles) {
    const sourcePath = path.join(inputDir, entry.name);
    const raw = await fs.readFile(sourcePath, "utf8");
    const parsed = matter(raw);
    const { slug, frontmatter } = buildFrontmatter(entry.name, parsed);
    const targetPath = path.join(outputDir, `${slug}.md`);
    const output = matter.stringify(parsed.content.trimStart(), frontmatter);

    await fs.writeFile(targetPath, output);
    reportLines.push(`- migrated \`${entry.name}\` -> \`content/posts/${slug}.md\``);
  }

  await fs.writeFile(reportPath, `${reportLines.join("\n")}\n`);
}
```

`scripts/migrate-posts.mjs`

```js
import { migratePosts } from "./lib/post-migration.mjs";

await migratePosts();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/migrate-posts.mjs`
Expected: PASS with migrated Markdown files written into `content/posts/` and `docs/migration-report.md` created.

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-posts.mjs scripts/lib/post-migration.mjs content/posts docs/migration-report.md
git commit -m "feat: migrate legacy jekyll posts"
```

### Task 5: Post route generation with preserved URLs

**Files:**
- Create: `src/pages/[slug]/index.astro`
- Modify: `src/lib/posts.ts`
- Test: `src/pages/[slug]/index.astro`

- [ ] **Step 1: Write the failing test**

Create a route page that imports a post lookup function that does not yet exist.

`src/pages/[slug]/index.astro`

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getAllPosts, getPostBySlug } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ params: { slug: post.slug } }));
}

const { slug } = Astro.params;
const post = await getPostBySlug(slug ?? "");
---
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with an export error because `getPostBySlug` is missing from `src/lib/posts.ts`.

- [ ] **Step 3: Write minimal implementation**

Extend `src/lib/posts.ts` and render a basic article page.

Add to `src/lib/posts.ts`:

```ts
export async function getPostBySlug(slug: string): Promise<PostRecord | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}
```

Replace `src/pages/[slug]/index.astro` with:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { marked } from "marked";
import { getAllPosts, getPostBySlug } from "../../lib/posts";

export async function getStaticPaths() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ params: { slug: post.slug } }));
}

const { slug } = Astro.params;
const post = await getPostBySlug(slug ?? "");

if (!post) {
  throw new Error(`Missing post for slug: ${slug}`);
}

const html = marked.parse(post.body);
---

<BaseLayout title={post.title} description={post.description}>
  <main>
    <article>
      <h1>{post.title}</h1>
      <p>{post.date}</p>
      <Fragment set:html={html} />
    </article>
  </main>
</BaseLayout>
```

Install renderer dependency:

```bash
npm install marked
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with one static route generated per migrated slug and output paths shaped as `dist/<slug>/index.html`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/[slug]/index.astro src/lib/posts.ts package.json package-lock.json
git commit -m "feat: preserve legacy post routes"
```

### Task 6: SEO metadata, sitemap, and RSS

**Files:**
- Create: `src/pages/rss.xml.ts`
- Create: `src/pages/sitemap.xml.ts`
- Modify: `src/components/SeoHead.astro`
- Modify: `src/lib/posts.ts`

- [ ] **Step 1: Write the failing test**

Reference a canonical URL prop in `src/components/SeoHead.astro` before it is implemented.

```astro
---
interface Props {
  title: string;
  description?: string;
  canonicalUrl?: string;
}
---
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL after updating consuming pages to pass `canonicalUrl` because `SeoHead` implementation and sitemap or RSS routes do not yet exist.

- [ ] **Step 3: Write minimal implementation**

Update `src/components/SeoHead.astro`:

```astro
---
interface Props {
  title: string;
  description?: string;
  canonicalUrl?: string;
}

const { title, description = "", canonicalUrl } = Astro.props;
---

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content={description} />
{canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
{canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
```

Create `src/pages/rss.xml.ts`

```ts
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
```

Create `src/pages/sitemap.xml.ts`

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with generated `dist/rss.xml` and `dist/sitemap.xml`, and no metadata component errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/SeoHead.astro src/pages/rss.xml.ts src/pages/sitemap.xml.ts src/lib/posts.ts
git commit -m "feat: add seo sitemap and rss"
```

### Task 7: AdSense and GA4 shared integrations

**Files:**
- Create: `src/components/AdSense.astro`
- Create: `src/components/Analytics.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/pages/[slug]/index.astro`

- [ ] **Step 1: Write the failing test**

Import a non-existent AdSense component in the base layout.

```astro
---
import AdSense from "../components/AdSense.astro";
---
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with a missing module error for `../components/AdSense.astro`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/AdSense.astro`

```astro
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3418708829554005" crossorigin="anonymous"></script>
```

Create `src/components/Analytics.astro`

```astro
---
const ga4Id = import.meta.env.PUBLIC_GA4_ID;
---

{ga4Id && (
  <>
    <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}></script>
    <script is:inline define:vars={{ ga4Id }}>
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', ga4Id);
      `}
    </script>
  </>
)}
```

Update `src/layouts/BaseLayout.astro`

```astro
---
import "../styles/global.css";
import AdSense from "../components/AdSense.astro";
import Analytics from "../components/Analytics.astro";
import SeoHead from "../components/SeoHead.astro";
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <SeoHead title={title} description={description} />
    <AdSense />
    <Analytics />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Add a reserved content wrapper in `src/pages/[slug]/index.astro`

```astro
<main class="post-page">
  <article class="post-content">
    <h1>{post.title}</h1>
    <p>{post.date}</p>
    <Fragment set:html={html} />
  </article>
</main>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PUBLIC_GA4_ID=G-TEST123 npm run build`
Expected: PASS with AdSense and GA4 snippets present in built HTML for homepage and post pages.

- [ ] **Step 5: Commit**

```bash
git add src/components/AdSense.astro src/components/Analytics.astro src/layouts/BaseLayout.astro src/pages/[slug]/index.astro
git commit -m "feat: add adsense and ga4 integrations"
```

### Task 8: Homepage listing, tags, and migration-era UX parity

**Files:**
- Create: `src/pages/tags/index.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/styles/global.css`
- Modify: `src/lib/posts.ts`

- [ ] **Step 1: Write the failing test**

Add tag links to the homepage that point to a route that does not yet exist.

```astro
{post.tags.map((tag) => (
  <a href={`/tags/#${tag}`}>#{tag}</a>
))}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL after adding a tags page import or route dependency that has not yet been created.

- [ ] **Step 3: Write minimal implementation**

Update `src/pages/index.astro`

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { getAllPosts } from "../lib/posts";

const posts = await getAllPosts();
---

<BaseLayout title="Diamond-Blog" description="Diamond Zhou's blog">
  <main>
    <h1>Diamond-Blog</h1>
    <ul>
      {posts.map((post) => (
        <li>
          <a href={`/${post.slug}/`}>{post.title}</a>
          <p>{post.description}</p>
          <div>
            {post.tags.map((tag) => (
              <a href={`/tags/#${tag}`}>#{tag}</a>
            ))}
          </div>
        </li>
      ))}
    </ul>
  </main>
</BaseLayout>
```

Create `src/pages/tags/index.astro`

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getAllPosts } from "../../lib/posts";

const posts = await getAllPosts();
const tags = [...new Set(posts.flatMap((post) => post.tags))].sort();
---

<BaseLayout title="Tags - Diamond-Blog" description="Tags">
  <main>
    <h1>Tags</h1>
    {tags.map((tag) => (
      <section id={tag}>
        <h2>#{tag}</h2>
        <ul>
          {posts
            .filter((post) => post.tags.includes(tag))
            .map((post) => (
              <li><a href={`/${post.slug}/`}>{post.title}</a></li>
            ))}
        </ul>
      </section>
    ))}
  </main>
</BaseLayout>
```

Add minimal styles to `src/styles/global.css`

```css
main {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.post-content {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with homepage, tags page, and post pages all generated.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/tags/index.astro src/styles/global.css src/lib/posts.ts
git commit -m "feat: add blog index and tags page"
```

### Task 9: GitHub Pages deployment workflow and domain-safe cutover files

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `public/CNAME`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**

Create a workflow file with a build step that references a missing install command so validation fails.

```yaml
name: deploy-pages

on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm ci && npm run build`
Expected: FAIL before the workflow is reliable if `package-lock.json` or deployment-specific files are not yet correct.

- [ ] **Step 3: Write minimal implementation**

Create `.github/workflows/deploy-pages.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build site
        env:
          PUBLIC_GA4_ID: ${{ secrets.PUBLIC_GA4_ID }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Create `public/CNAME`

```text
diamondfsd.com
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm ci && PUBLIC_GA4_ID=G-TEST123 npm run build`
Expected: PASS with `dist/CNAME` present and build output ready for Pages artifact upload.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-pages.yml public/CNAME README.md
git commit -m "feat: add github pages deployment workflow"
```

### Task 10: Validation scripts, rollout checklist, and rollback instructions

**Files:**
- Create: `scripts/validate-routes.mjs`
- Create: `docs/cutover-checklist.md`
- Modify: `README.md`
- Test: `scripts/validate-routes.mjs`

- [ ] **Step 1: Write the failing test**

Create a validation script entry in `package.json` before the script exists.

```json
{
  "scripts": {
    "validate:routes": "node scripts/validate-routes.mjs"
  }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run validate:routes`
Expected: FAIL with `Cannot find module 'scripts/validate-routes.mjs'`.

- [ ] **Step 3: Write minimal implementation**

Update `package.json`

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "migrate:posts": "node scripts/migrate-posts.mjs",
    "validate:routes": "node scripts/validate-routes.mjs"
  }
}
```

Create `scripts/validate-routes.mjs`

```js
import fs from "node:fs/promises";
import path from "node:path";

const legacyDir = path.resolve("_posts");
const distDir = path.resolve("dist");

function slugFromLegacyFilename(filename) {
  return filename
    .replace(/\.(markdown|md)$/i, "")
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, "");
}

const entries = await fs.readdir(legacyDir, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile() && /\.(markdown|md)$/i.test(entry.name));
const missing = [];

for (const file of files) {
  const slug = slugFromLegacyFilename(file.name);
  const expectedPath = path.join(distDir, slug, "index.html");

  try {
    await fs.access(expectedPath);
  } catch {
    missing.push(`${slug} -> ${expectedPath}`);
  }
}

if (missing.length > 0) {
  console.error("Missing generated routes:");
  for (const entry of missing) {
    console.error(entry);
  }
  process.exit(1);
}

console.log(`Validated ${files.length} historical routes.`);
```

Create `docs/cutover-checklist.md`

```md
# Cutover Checklist

- Confirm `npm run build` passes locally
- Confirm `npm run validate:routes` passes locally
- Confirm homepage HTML contains AdSense script
- Confirm at least one post page HTML contains AdSense script
- Confirm GA4 id is configured in GitHub secret `PUBLIC_GA4_ID`
- Confirm GitHub Pages custom domain is still `diamondfsd.com`
- Confirm generated `dist/CNAME` equals `diamondfsd.com`
- Confirm `sitemap.xml` and `rss.xml` exist in build output
- After deployment, spot-check homepage, one old post URL, one image-heavy post, tags page, and mobile layout
- If regression appears, revert to the pre-cutover ref and redeploy
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build && npm run validate:routes`
Expected: PASS with a success line similar to `Validated <count> historical routes.`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json scripts/validate-routes.mjs docs/cutover-checklist.md README.md
git commit -m "chore: add migration validation and cutover checklist"
```
