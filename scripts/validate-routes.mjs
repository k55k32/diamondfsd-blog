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
