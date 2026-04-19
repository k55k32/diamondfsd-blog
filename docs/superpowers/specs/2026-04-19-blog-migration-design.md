# Blog Migration Design

## Context

This repository is an old `Jekyll + GitHub Pages` blog. It currently stores posts in `_posts/`, relies on Jekyll front matter and layout conventions, and publishes under the custom domain `diamondfsd.com`.

The current site includes:

- Old Jekyll content structure with `_posts/` and Liquid layouts
- Permalink rule `:title/`, which means post URLs are effectively `/<slug>/`
- Google AdSense Auto Ads using publisher id `ca-pub-3418708829554005`
- Universal Analytics `UA-115185351-1`, which is obsolete and should be replaced

The user wants to modernize the blog so new posts are easy to write as plain Markdown, while keeping GitHub Pages hosting, the existing custom domain, existing URLs, and Google Ads intact.

## Goals

- Replace the old Jekyll-based blog architecture with a modern static site stack
- Keep `GitHub Pages` as the production hosting target
- Keep the current custom domain and do not break domain binding
- Preserve all existing post URLs exactly
- Migrate all historical posts in a single pass
- Make new writing workflow as close as possible to "just one Markdown file"
- Preserve Google AdSense integration during and after migration
- Upgrade analytics from Universal Analytics to GA4 as part of the migration

## Non-Goals

- Moving hosting to Vercel, Cloudflare Pages, Netlify, or any non-GitHub platform
- Redesigning the site's visual language beyond what is needed for migration
- Introducing a CMS in this phase
- Rewriting historical article bodies for style or SEO
- Changing post slugs or permalink structure

## Decision

### Recommended stack

Use:

- `Astro` for the site and content rendering
- `GitHub Actions` for build and deploy
- `GitHub Pages` for production hosting
- Existing custom domain `diamondfsd.com`

### Why Astro

Astro is the best fit because it supports static output, Markdown-first content authoring, custom layouts, predictable routing, and a clean path to GitHub Pages deployment. It is more suitable than VitePress for a real blog, less constrained than continuing with Jekyll, and easier to shape around legacy route compatibility than Hugo for this repository.

## Requirements

### Content authoring

The future authoring experience should favor minimal Markdown.

Target behavior:

- Each new post is one Markdown file
- File name determines slug
- Date should be inferred automatically whenever possible
- Front matter should be optional or minimal
- Additional metadata such as `description`, `tags`, or `cover image` should only be added when needed

### URL compatibility

Current Jekyll config uses:

```yaml
permalink: ':title/'
```

This means production URLs are based on the slug portion of the file name, not on date folders.

Migration requirement:

- Every historical post must continue to resolve at the exact same path as before
- New implementation must generate `/<slug>/` pages directly
- Compatibility must not rely on redirect pages for normal historical content

### Ad preservation

The current site includes:

- AdSense loader script in the page head
- `amp-auto-ads` injection in the main content layout

Migration requirement:

- Keep AdSense publisher id `ca-pub-3418708829554005`
- Keep site-wide ad script inclusion in the new global layout
- Validate ad rendering after the new site is deployed
- Avoid layout changes that cause ad overlap or poor content flow

### Hosting constraints

- Production must remain on `GitHub Pages`
- Production domain must remain the current custom domain
- Deployment should move from implicit Jekyll build behavior to explicit `GitHub Actions`
- Pages settings must not be disturbed in a way that risks unbinding the custom domain

## Proposed architecture

### Directory structure

Target structure:

```text
src/
  components/
  layouts/
  pages/
  lib/
content/
  posts/
public/
  assets/
scripts/
docs/
  superpowers/
    specs/
    plans/
```

### Content model

Historical and future posts live in `content/posts/`.

Canonical source format:

- One Markdown file per post
- Slug derived from file name
- Minimal optional front matter

Supported front matter fields:

- `title`
- `description`
- `tags`
- `img`
- `draft`

Derived fields:

- `slug` from file name
- `date` from migration manifest, file metadata, or explicit override

For migrated legacy content, date must come from existing post file naming and front matter extraction so sort order remains stable.

### Routing model

Astro will statically generate:

- Homepage
- Individual post pages at `/<slug>/`
- Optional tag and archive pages
- `sitemap.xml`
- `rss.xml`

Implementation shape:

- A dynamic route page generates each historical and future post using the preserved slug
- Route output must be deterministic and slug-driven

### Rendering model

- Use Astro layouts for global page chrome
- Use a shared SEO head component for title, description, canonical, Open Graph, and Twitter metadata
- Use Markdown rendering for article bodies
- Reuse static assets from current `assets/` directory through `public/assets/`

## Migration strategy

### Phase 1: Parallel scaffold

Create the Astro application structure inside the existing repository without deleting the current Jekyll site yet.

Purpose:

- Allow local comparison between legacy and new output
- Avoid risky one-shot replacement before validation

### Phase 2: Historical content migration

Build a migration script that processes every file under `_posts/`.

Transform rules:

- Input file names like `YYYY-MM-DD-slug.md` and `YYYY-MM-DD-slug.markdown`
- Output file path `content/posts/slug.md`
- Remove Jekyll-only fields such as `layout`
- Preserve `title`, `description`, `tags`, and `img` when present
- Preserve body content
- Normalize date extraction from old file naming and existing front matter
- Record any ambiguous cases in a migration report

The migration is one-time and repository-local. The result becomes the canonical content store for the new site.

### Phase 3: Layout and metadata port

Port the useful behavior from current templates into Astro:

- Author profile/sidebar if still desired
- Post header
- SEO metadata
- Social metadata
- Disqus integration if still required
- AdSense integration

This phase should modernize the implementation, not mechanically copy Liquid templates.

### Phase 4: Publishing pipeline

Introduce a GitHub Pages workflow that:

- Checks out repository content
- Installs Node dependencies
- Builds Astro static output
- Uploads the built site as GitHub Pages artifact
- Deploys using `actions/deploy-pages`

This removes dependency on GitHub's built-in Jekyll runtime.

### Phase 5: Cutover

Switch production publishing to the new workflow only after:

- Route parity is validated
- Core metadata is validated
- AdSense script presence is validated
- Custom domain Pages settings are confirmed

## Google Ads and analytics

### AdSense

AdSense must be treated as a hard migration constraint.

Plan:

- Keep the same publisher id
- Inject the AdSense script globally in the Astro base layout
- Add page structure compatible with Auto Ads
- Verify ad behavior on homepage and post pages after deployment

### Analytics

Universal Analytics is obsolete and should not be carried forward.

Plan:

- Remove old `UA-115185351-1` integration from the new implementation
- Add GA4 tracking in the new shared layout
- Keep analytics code isolated in a dedicated component so it is easy to update later

## Risk management

### Primary risks

- Historical URL mismatch
- Loss of custom domain binding during Pages reconfiguration
- Missing metadata on migrated posts
- Broken image paths after static asset move
- AdSense rendering regressions after DOM structure changes
- Dirty working tree causing accidental interference during implementation

### Mitigations

- Generate route fixtures and compare legacy slug set with new slug set
- Preserve `public/assets/` paths to avoid mass image rewrites where possible
- Keep migration script idempotent and report exceptions
- Avoid touching GitHub Pages domain settings until workflow output is ready
- Implement and validate AdSense in shared layout before cutover
- Work in additive steps and avoid destructive edits to unrelated files

## Validation checklist

Before production cutover, verify:

- All historical slugs resolve to generated pages
- Post title and description match expected metadata
- Images render for old posts
- Homepage pagination or listing behaves correctly
- `sitemap.xml` includes expected canonical URLs
- RSS output is valid
- AdSense script is present in final HTML
- GA4 script is present in final HTML
- Custom domain remains configured in GitHub Pages settings

## Rollback plan

Rollback must be simple and fast.

Plan:

- Keep a restorable reference to the current Jekyll state before cutover
- Introduce the new deployment as a reversible publishing change
- If production regression occurs, revert deployment configuration to the previous site state immediately

## Open implementation notes

- The repo is currently dirty, so implementation must avoid reverting unrelated user changes
- The migration script should produce a report of any files with malformed front matter or inconsistent date extraction
- The final site should prefer minimal Markdown authoring, but migration must preserve enough metadata for old posts to render correctly

## Summary

The migration should move this blog from an aging Jekyll setup to an Astro-based static site while preserving GitHub Pages hosting, the custom domain, historical URLs, and AdSense. The implementation should make future writing nearly frictionless while handling historical content in a one-time scripted conversion with explicit validation and rollback safeguards.
