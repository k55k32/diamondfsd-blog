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
