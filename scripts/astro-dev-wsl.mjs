import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const sourceDir = process.cwd();
const mirrorDir = path.join(os.tmpdir(), "diamondfsd-blog-dev");
const syncIntervalMs = 2000;
const installInputs = [
  "package.json",
  "npm-lock.yaml",
  "astro.config.mjs",
  "tsconfig.json"
].map((entry) => path.join(sourceDir, entry));

let astroProcess;
let syncing = false;
let installFingerprint = "";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? sourceDir,
      stdio: options.stdio ?? "inherit",
      shell: options.shell ?? false,
      env: options.env ?? process.env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? -1}`));
    });
  });
}

async function syncProject() {
  await run("rsync", [
    "-a",
    "--delete",
    "--exclude",
    ".git",
    "--exclude",
    "node_modules",
    "--exclude",
    "dist",
    "--exclude",
    ".astro",
    `${sourceDir}/`,
    `${mirrorDir}/`
  ]);
}

async function computeInstallFingerprint() {
  const { stat, readFile } = await import("node:fs/promises");
  const parts = [];

  for (const target of installInputs) {
    try {
      const info = await stat(target);
      const content = await readFile(target, "utf8");
      parts.push(`${target}:${info.mtimeMs}:${content.length}`);
    } catch {
      parts.push(`${target}:missing`);
    }
  }

  return parts.join("|");
}

async function ensureDependencies() {
  const nextFingerprint = await computeInstallFingerprint();
  if (nextFingerprint === installFingerprint) {
    return;
  }

  console.log("[astro-dev-wsl] installing mirror dependencies...");
  await run("npm", ["install", "--frozen-lockfile"], { cwd: mirrorDir });
  installFingerprint = nextFingerprint;
}

function startAstro() {
  if (astroProcess && !astroProcess.killed) {
    return;
  }

  console.log("[astro-dev-wsl] starting Astro dev at http://127.0.0.1:4321/");
  astroProcess = spawn("npm", ["exec", "astro", "dev", "--host", "127.0.0.1", "--port", "4321"], {
    cwd: mirrorDir,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      CI: "1",
      ASTRO_TELEMETRY_DISABLED: "1"
    }
  });

  astroProcess.on("exit", (code) => {
    astroProcess = undefined;
    if (code && code !== 0) {
      console.error(`[astro-dev-wsl] Astro exited with code ${code}`);
    }
  });
}

async function syncLoop() {
  if (syncing) {
    return;
  }

  syncing = true;
  try {
    await syncProject();
    await ensureDependencies();
    startAstro();
  } catch (error) {
    console.error("[astro-dev-wsl] sync error:", error.message);
  } finally {
    syncing = false;
  }
}

process.on("SIGINT", () => {
  if (astroProcess && !astroProcess.killed) {
    astroProcess.kill("SIGINT");
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  if (astroProcess && !astroProcess.killed) {
    astroProcess.kill("SIGTERM");
  }
  process.exit(0);
});

await syncLoop();
setInterval(() => {
  syncLoop().catch((error) => {
    console.error("[astro-dev-wsl] loop error:", error.message);
  });
}, syncIntervalMs);
