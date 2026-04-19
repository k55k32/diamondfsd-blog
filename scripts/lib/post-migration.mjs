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

function parseTagList(value) {
  if (!value.startsWith("[") || !value.endsWith("]")) {
    return value;
  }

  return value
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeScalar(value) {
  const trimmed = value.trim().replace(/\u0000/g, "");

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseLegacyMatter(raw) {
  const normalized = raw.replace(/\u0000/g, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return { data: {}, content: normalized };
  }

  const [, frontmatterBlock, content] = match;
  const data = {};

  for (const line of frontmatterBlock.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1);
    const scalar = normalizeScalar(rawValue);

    if (key === "tags") {
      data[key] = parseTagList(scalar);
      continue;
    }

    data[key] = scalar;
  }

  return { data, content };
}

function parsePost(raw) {
  try {
    return matter(raw);
  } catch {
    return parseLegacyMatter(raw);
  }
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
    const parsed = parsePost(raw);
    const { slug, frontmatter } = buildFrontmatter(entry.name, parsed);
    const targetPath = path.join(outputDir, `${slug}.md`);
    const output = matter.stringify(parsed.content.trimStart(), frontmatter);

    await fs.writeFile(targetPath, output);
    reportLines.push(`- migrated \`${entry.name}\` -> \`content/posts/${slug}.md\``);
  }

  await fs.writeFile(reportPath, `${reportLines.join("\n")}\n`);
}
