import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

/*
 * sw.js precaches the app shell from a hand-kept list, and manifest.webmanifest
 * names icons by path. Neither is checked by anything at runtime: a file
 * missing from the list simply fails offline, and a mistyped icon path is only
 * noticed by whoever tries to install. So the lists are checked here, against
 * the tree as it actually is.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function exists(path) {
  try {
    await access(join(ROOT, path));
    return true;
  } catch {
    return false;
  }
}

/** Every .js file under a directory, as paths relative to the root. */
async function sourceFilesUnder(dir) {
  const entries = await readdir(join(ROOT, dir), { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
    .map((entry) => relative(ROOT, join(entry.parentPath ?? entry.path, entry.name)));
}

describe("sw.js", async () => {
  const source = await readFile(join(ROOT, "sw.js"), "utf8");
  const match = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(match, "APP_SHELL list not found in sw.js");
  const shell = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  test("names the cache after the released version", () => {
    assert.match(source, /import \{ APP_VERSION \} from "\.\/src\/js\/version\.js"/);
    assert.match(source, /APP_VERSION\}`/);
  });

  test("every precached path exists", async () => {
    for (const path of shell) {
      if (path === "./") continue;
      assert.ok(await exists(path), `${path} is precached but does not exist`);
    }
  });

  test("every module the app loads is precached", async () => {
    const modules = [...(await sourceFilesUnder("src/js")), ...(await sourceFilesUnder("src/i18n"))]
      // The template is documentation: nothing imports it.
      .filter((path) => !path.endsWith("/_template.js"));
    for (const path of modules) {
      assert.ok(shell.includes(path), `${path} is not in APP_SHELL and would be missing offline`);
    }
  });

  test("the page, the styles and the manifest are precached", () => {
    for (const path of ["./", "index.html", "src/css/styles.css", "manifest.webmanifest"]) {
      assert.ok(shell.includes(path), `${path} missing from APP_SHELL`);
    }
  });
});

describe("manifest.webmanifest", async () => {
  const manifest = JSON.parse(await readFile(join(ROOT, "manifest.webmanifest"), "utf8"));

  test("is installable: name, start_url, standalone display and an icon of each required size", () => {
    assert.equal(manifest.name, "Time is up");
    assert.equal(manifest.start_url, "./");
    assert.equal(manifest.display, "standalone");
    const sizes = manifest.icons.map((icon) => icon.sizes);
    assert.ok(sizes.includes("192x192"));
    assert.ok(sizes.includes("512x512"));
    assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  });

  test("every icon it names exists and is precached", async () => {
    const source = await readFile(join(ROOT, "sw.js"), "utf8");
    for (const { src } of manifest.icons) {
      assert.ok(await exists(src), `${src} is named in the manifest but does not exist`);
      assert.ok(source.includes(`"${src}"`), `${src} is not precached`);
    }
  });

  test("its colours match the light theme the page opens with", async () => {
    const html = await readFile(join(ROOT, "index.html"), "utf8");
    const themeColor = html.match(/name="theme-color"[^>]*content="([^"]+)"/)[1];
    assert.equal(manifest.theme_color, themeColor);
    assert.equal(manifest.background_color, themeColor);
  });
});
