/*
 * Minimal i18n registry for "Time is up".
 *
 * Every language lives in its own file: src/i18n/<code>.js
 * Each file calls TimeIsUpI18n.register(code, label, strings).
 *
 * The app builds the language picker from whatever is registered here, so:
 *   - Add a language    -> create src/i18n/<code>.js  +  add its <script> tag
 *                          to index.html (next to the others).
 *   - Remove a language -> delete the file  +  delete its <script> tag.
 *
 * No build step, no bundler. Load order in index.html: this file first,
 * then the language files, then src/js/app.js.
 */
(function () {
  "use strict";

  var order = [];   // [{ code, label }] in registration order
  var dicts = {};    // code -> { key: "translated text", ... }

  window.TimeIsUpI18n = {
    /**
     * @param {string} code   short code, e.g. "ca" (used in <html lang> + storage)
     * @param {string} label  name shown in the picker, e.g. "Català"
     * @param {object} dict   flat map of string keys -> translated text
     */
    register: function (code, label, dict) {
      if (!Object.prototype.hasOwnProperty.call(dicts, code)) {
        order.push({ code: code, label: label });
      } else {
        for (var i = 0; i < order.length; i++) {
          if (order[i].code === code) order[i].label = label;
        }
      }
      dicts[code] = dict || {};
    },

    /** @returns {{code:string,label:string}[]} registered languages, in order */
    languages: function () { return order.slice(); },

    /** @returns {boolean} */
    has: function (code) {
      return Object.prototype.hasOwnProperty.call(dicts, code);
    },

    /** @returns {object|null} the string map for a language */
    dict: function (code) { return dicts[code] || null; },

    /** @returns {string|null} first registered language — the ultimate fallback */
    fallback: function () { return order.length ? order[0].code : null; }
  };
})();
