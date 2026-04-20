import fs from "node:fs/promises";
import path from "node:path";

const legacyDir = path.resolve("_posts");
const contentDir = path.resolve("content/posts");
const distDir = path.resolve("dist");

function slugFromLegacyFilename(filename) {
  return filename
    .replace(/\.(markdown|md)$/i, "")
    .replace(/^\d{4}-\d{1,2}-\d{1,2}-/, "");
}

function slugFromContentFilename(filename) {
  return filename.replace(/\.md$/i, "");
}

async function listExpectedSlugs() {
  try {
    const entries = await fs.readdir(legacyDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.(markdown|md)$/i.test(entry.name))
      .map((entry) => slugFromLegacyFilename(entry.name));
  } catch {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
      .map((entry) => slugFromContentFilename(entry.name));
  }
}

const slugs = await listExpectedSlugs();
const missing = [];

for (const slug of slugs) {
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

console.log(`Validated ${slugs.length} historical routes.`);
