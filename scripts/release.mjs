/*
 * Cuts a release: bumps the version, closes the changelog section, and writes
 * out the notes for the GitHub release.
 *
 * The README names three things that have to agree — APP_VERSION, the CHANGELOG
 * heading and the git tag — and warns that nothing checks them. This is what
 * stops them drifting: one command sets all three from a single input.
 *
 *   node scripts/release.mjs minor [--dry-run]
 *
 * The level is a human decision and stays one; everything downstream of it is
 * mechanical, which is the part worth automating.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION_FILE = join(ROOT, "src/js/version.js");
const CHANGELOG_FILE = join(ROOT, "CHANGELOG.md");
const REPO = "https://github.com/eballo/time-is-up";

export const LEVELS = ["major", "minor", "patch"];

/** @param {string} current e.g. "1.2.0" @param {"major"|"minor"|"patch"} level */
export function nextVersion(current, level) {
  const parts = current.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`"${current}" is not a three-part version`);
  }
  const [major, minor, patch] = parts;
  if (level === "major") return `${major + 1}.0.0`;
  if (level === "minor") return `${major}.${minor + 1}.0`;
  if (level === "patch") return `${major}.${minor}.${patch + 1}`;
  throw new Error(`unknown level "${level}", expected one of ${LEVELS.join(", ")}`);
}

export function readVersionFrom(source) {
  const match = source.match(/APP_VERSION\s*=\s*"([^"]+)"/);
  if (!match) throw new Error("APP_VERSION not found in version.js");
  return match[1];
}

export function bumpVersionSource(source, version) {
  return source.replace(/(APP_VERSION\s*=\s*")[^"]+(")/, `$1${version}$2`);
}

/** Everything under "## [Unreleased]", which becomes the release notes. */
export function unreleasedNotes(changelog) {
  const match = changelog.match(/## \[Unreleased\]\n([\s\S]*?)(?=\n## \[)/);
  return (match?.[1] ?? "").trim();
}

/**
 * Closes the Unreleased section under the new version, opens a fresh empty one,
 * and repoints the compare links.
 */
export function releaseChangelog(changelog, version, previousVersion, date) {
  if (!changelog.includes("## [Unreleased]")) {
    throw new Error("CHANGELOG.md has no [Unreleased] section");
  }
  let next = changelog.replace(
    "## [Unreleased]\n",
    `## [Unreleased]\n\n## [${version}] - ${date}\n`
  );
  next = next.replace(
    new RegExp(`\\[Unreleased\\]: ${REPO}/compare/v[^.]+\\.[^.]+\\.[^.]+\\.\\.\\.HEAD`),
    `[Unreleased]: ${REPO}/compare/v${version}...HEAD\n` +
      `[${version}]: ${REPO}/compare/v${previousVersion}...v${version}`
  );
  return next;
}

async function main() {
  const [level, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes("--dry-run");

  if (!LEVELS.includes(level)) {
    console.error(`usage: node scripts/release.mjs <${LEVELS.join("|")}> [--dry-run]`);
    process.exit(1);
  }

  const versionSource = await readFile(VERSION_FILE, "utf8");
  const previousVersion = readVersionFrom(versionSource);
  const version = nextVersion(previousVersion, level);

  const changelog = await readFile(CHANGELOG_FILE, "utf8");
  const notes = unreleasedNotes(changelog);
  if (!notes) {
    console.error("Nothing under [Unreleased] — there is no release to cut.");
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const nextChangelog = releaseChangelog(changelog, version, previousVersion, date);

  console.log(`${previousVersion} -> ${version}  (${level}, ${date})`);
  if (dryRun) {
    console.log("\n--- release notes ---\n" + notes);
    console.log("\n(dry run: nothing written)");
    return;
  }

  await writeFile(VERSION_FILE, bumpVersionSource(versionSource, version));
  await writeFile(CHANGELOG_FILE, nextChangelog);
  await writeFile(join(ROOT, "RELEASE_NOTES.md"), notes + "\n");

  // Picked up by the workflow to tag and to title the GitHub release.
  if (process.env.GITHUB_OUTPUT) {
    const { appendFile } = await import("node:fs/promises");
    await appendFile(process.env.GITHUB_OUTPUT, `version=${version}\n`);
  }
  console.log("version.js and CHANGELOG.md updated; notes in RELEASE_NOTES.md");
}

// Only run when invoked directly, so the tests can import the pure parts.
if (process.argv[1] && process.argv[1].endsWith("release.mjs")) {
  await main();
}
