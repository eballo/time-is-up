/*
 * The last released version, shown in the colophon.
 *
 * It is the version that was last tagged — not the one in progress. Between
 * releases the deployed site is therefore "this version plus whatever came
 * after", which is the honest reading of a continuously deployed main.
 *
 * Do not edit by hand: `node scripts/release.mjs <patch|minor|major>` sets this,
 * the CHANGELOG heading and the git tag together, which is the only way the
 * three stay in step.
 */
export const APP_VERSION = "1.1.0";
