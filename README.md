# Diamond Zhou's Blog

This repository now uses `Astro + GitHub Actions + GitHub Pages`.

The old Jekyll site has been retired. Historical posts were migrated into `content/posts/`, legacy URLs are preserved, and the site is intended to continue publishing under the custom domain `diamondfsd.com`.

## Repository Layout

- `src/`: Astro pages, layouts, and components
- `content/posts/`: canonical Markdown post source
- `public/`: files that must be published at the site root
- `scripts/migrate-posts.mjs`: one-time migration script used to move old Jekyll posts
- `scripts/validate-routes.mjs`: checks that historical post routes were generated
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
pnpm dev
```

WSL note:

- This repository lives under `/mnt/c/...`, and native `astro dev` can stall on Windows-mounted filesystems.
- `pnpm dev` now starts a real Astro dev server from a Linux mirror under `/tmp/diamondfsd-blog-dev`, then keeps source changes synced from the current repo.
- Open `http://127.0.0.1:4321/` in your browser.
- The first startup is slower because the mirror installs dependencies once. Later starts are faster.

Build the site:

```bash
npm run build
```

Validate historical routes:

```bash
npm run validate:routes
```

Use a temporary GA4 id locally if needed:

```bash
PUBLIC_GA4_ID=G-TEST123 npm run build
```

## Writing New Posts

Create a new file under `content/posts/`:

```text
content/posts/my-new-post.md
```

Minimal example:

```md
---
title: My New Post
description: Short summary for SEO and list pages
date: 2026-04-20
tags:
  - notes
  - blog
---

# My New Post

Write the article in normal Markdown.
```

Notes:

- File name becomes the URL slug
- Article URL will be `https://diamondfsd.com/my-new-post/`
- Supported front matter fields are `title`, `description`, `date`, `tags`, `img`, and `draft`
- Static files that must stay at the website root belong in `public/`

## Important Publishing Files

These files are expected to remain published at the root of the site:

- `public/CNAME`
- `public/ads.txt`
- `public/bdunion.txt`
- `public/favicon.ico`
- `public/google72d3de2a4c47aca6.html`
- `public/rose-for-shuxin.html`

Do not remove them unless you are intentionally changing site verification, ads, or domain setup.

## AdSense and Analytics

Current ad integration:

- AdSense publisher id: `ca-pub-3418708829554005`
- AdSense script component: `src/components/AdSense.astro`

Current analytics integration:

- GA4 env var: `PUBLIC_GA4_ID`
- Analytics component: `src/components/Analytics.astro`

Before production deployment, configure the repository secret:

```text
PUBLIC_GA4_ID=<your real GA4 id>
```

## GitHub Pages Cutover Steps

These are the remaining manual steps to finish deployment on GitHub.

### 1. Push the branch

If your local branch is not pushed yet:

```bash
git push -u origin master
```

### 2. Add the GA4 secret

In GitHub:

- Open the repository
- Go to `Settings`
- Go to `Secrets and variables` -> `Actions`
- Add a new repository secret named `PUBLIC_GA4_ID`
- Paste your real GA4 measurement id, for example `G-XXXXXXXXXX`

### 3. Switch Pages to GitHub Actions

In GitHub:

- Open the repository
- Go to `Settings`
- Go to `Pages`
- Under `Build and deployment`
- Set `Source` to `GitHub Actions`

Do not remove the custom domain while doing this.

### 4. Confirm the custom domain

Still in `Settings` -> `Pages`, confirm:

- Custom domain is `diamondfsd.com`
- HTTPS remains enabled if GitHub offers it

The repository already ships `public/CNAME`, so the generated site should include the correct domain file.

### 5. Watch the first deployment

After pushing:

- Open the `Actions` tab
- Wait for `Deploy to GitHub Pages` to finish successfully
- Open the deployed site

## Post-Cutover Verification

After the first successful deploy, check these manually:

1. Homepage opens correctly
2. One old article URL still works
3. `https://diamondfsd.com/tags/` works
4. One image-heavy article renders images correctly
5. `https://diamondfsd.com/ads.txt` opens
6. `https://diamondfsd.com/sitemap.xml` opens
7. `https://diamondfsd.com/rss.xml` opens
8. Browser page source contains the AdSense script
9. Browser page source contains the GA4 script
10. Mobile layout is readable

## Recommended Pre-Deploy Command

Run this locally before pushing:

```bash
PUBLIC_GA4_ID=G-TEST123 npm run build && npm run validate:routes
```

This verifies:

- Astro build succeeds
- historical route generation still works
- root publishing files are copied into `dist/`

## Rollback

If the new deployment has a production issue:

1. Revert the latest commit or revert the migration branch merge
2. Push the revert
3. Let GitHub Actions redeploy the previous known-good state

If the problem is specifically GitHub Pages configuration:

1. Re-open `Settings` -> `Pages`
2. Confirm `GitHub Actions` is still selected
3. Confirm the custom domain is still `diamondfsd.com`

## Current Status

Migration work already completed in this repository:

- Astro site scaffolded
- historical posts migrated
- historical URLs preserved
- sitemap and RSS added
- AdSense kept
- GA4 integration added
- GitHub Actions Pages workflow added
- legacy Jekyll files removed

## License

GNU General Public License v3.0
