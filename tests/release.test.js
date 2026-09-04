import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  nextVersion,
  readVersionFrom,
  bumpVersionSource,
  unreleasedNotes,
  releaseChangelog
} from "../scripts/release.mjs";

describe("nextVersion", () => {
  test("bumps the right part and resets the ones below it", () => {
    assert.equal(nextVersion("1.2.3", "patch"), "1.2.4");
    assert.equal(nextVersion("1.2.3", "minor"), "1.3.0");
    assert.equal(nextVersion("1.2.3", "major"), "2.0.0");
  });

  test("carries past nine without treating versions as decimals", () => {
    assert.equal(nextVersion("1.9.9", "patch"), "1.9.10");
    assert.equal(nextVersion("1.9.0", "minor"), "1.10.0");
  });

  test("refuses input it cannot reason about", () => {
    assert.throws(() => nextVersion("1.2", "patch"), /three-part/);
    assert.throws(() => nextVersion("1.2.x", "patch"), /three-part/);
    assert.throws(() => nextVersion("1.2.3", "huge"), /unknown level/);
  });
});

describe("version.js", () => {
  const source = 'export const APP_VERSION = "1.2.0";\n';

  test("the current version is read back", () => {
    assert.equal(readVersionFrom(source), "1.2.0");
  });

  test("bumping rewrites only the version", () => {
    const bumped = bumpVersionSource(source, "1.3.0");
    assert.equal(readVersionFrom(bumped), "1.3.0");
    assert.equal(bumped, 'export const APP_VERSION = "1.3.0";\n');
  });

  test("a file without the constant is an error, not a silent no-op", () => {
    assert.throws(() => readVersionFrom("export const NOPE = 1;"), /not found/);
  });
});

const CHANGELOG = `# Changelog

## [Unreleased]

### Added

- A thing worth shipping.

## [1.2.0] - 2026-09-04

### Added

- The previous thing.

[Unreleased]: https://github.com/eballo/time-is-up/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/eballo/time-is-up/compare/v1.1.0...v1.2.0
`;

describe("release notes", () => {
  test("are whatever sits under Unreleased", () => {
    const notes = unreleasedNotes(CHANGELOG);
    assert.match(notes, /A thing worth shipping/);
    assert.doesNotMatch(notes, /previous thing/, "must not run into the older section");
    assert.doesNotMatch(notes, /## \[/, "must not include the next heading");
  });

  test("an empty Unreleased yields nothing, so the caller can refuse to release", () => {
    const empty = CHANGELOG.replace("### Added\n\n- A thing worth shipping.\n\n", "");
    assert.equal(unreleasedNotes(empty), "");
  });
});

describe("closing the changelog section", () => {
  const released = releaseChangelog(CHANGELOG, "1.3.0", "1.2.0", "2026-09-05");

  test("dates the new version", () => {
    assert.match(released, /## \[1\.3\.0\] - 2026-09-05/);
  });

  test("leaves a fresh Unreleased section for the next change", () => {
    assert.match(released, /## \[Unreleased\]\n\n## \[1\.3\.0\]/);
  });

  test("keeps the notes under the new version, not under Unreleased", () => {
    assert.equal(unreleasedNotes(released), "", "Unreleased should now be empty");
    assert.match(released, /## \[1\.3\.0\][\s\S]*A thing worth shipping/);
  });

  test("repoints the comparison links", () => {
    assert.match(released, /\[Unreleased\]: \S+\/compare\/v1\.3\.0\.\.\.HEAD/);
    assert.match(released, /\[1\.3\.0\]: \S+\/compare\/v1\.2\.0\.\.\.v1\.3\.0/);
    assert.match(released, /\[1\.2\.0\]: \S+\/compare\/v1\.1\.0\.\.\.v1\.2\.0/, "older links survive");
  });

  test("does not touch the previous version's section", () => {
    assert.match(released, /## \[1\.2\.0\] - 2026-09-04/);
  });

  test("refuses a changelog with nothing to close", () => {
    assert.throws(
      () => releaseChangelog("# Changelog\n", "1.3.0", "1.2.0", "2026-09-05"),
      /no \[Unreleased\]/
    );
  });
});

describe("the real files stay in step", () => {
  test("version.js and the changelog agree on what has shipped", async () => {
    const { readFile } = await import("node:fs/promises");
    const source = await readFile(new URL("../src/js/version.js", import.meta.url), "utf8");
    const changelog = await readFile(new URL("../CHANGELOG.md", import.meta.url), "utf8");
    const version = readVersionFrom(source);

    // Either this version is already released, or it is the one Unreleased will
    // become. Anything else means the two have drifted apart.
    const released = changelog.includes(`## [${version}] -`);
    const pending = changelog.includes("## [Unreleased]");
    assert.ok(released || pending, `version.js says ${version}, which the changelog knows nothing about`);
  });
});
