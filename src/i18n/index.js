/*
 * The languages the app offers, in the order they appear in the picker.
 *
 * To add one: copy _template.js to <code>.js, translate it, then import it
 * here and add it to the array. To remove one: delete the file and both lines.
 * Nothing else needs to change — the picker is built from this list.
 */
import ca from "./ca.js";
import es from "./es.js";
import en from "./en.js";
import fr from "./fr.js";
import nl from "./nl.js";

export const languages = [ca, es, en, fr, nl];

/** Used when a language file is missing a key, or the saved language is gone. */
export const FALLBACK_LANGUAGE = "en";
