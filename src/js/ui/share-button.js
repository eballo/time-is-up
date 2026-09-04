/**
 * One button rather than a row of network logos.
 *
 * On a phone the native share sheet already lists whatever the person actually
 * uses — WhatsApp, Telegram, Signal, mail — so hard-coding four networks would
 * be both more clutter and a narrower choice. Where that API does not exist,
 * copying the link does the same job in one step.
 */
const CONFIRMATION_MS = 2000;

export class ShareButton {
  #button;
  #translator;
  #resetTimer = null;

  constructor({ button, translator }) {
    this.#button = button;
    this.#translator = translator;
    button.addEventListener("click", () => this.#share());
  }

  renderText() {
    // Not while a confirmation is showing, or it would wipe the feedback.
    if (this.#resetTimer === null) this.#showLabel();
  }

  #showLabel() {
    this.#button.textContent = this.#translator.translate("share");
  }

  async #share() {
    const url = location.href;
    const payload = {
      title: this.#translator.translate("tagline"),
      text: this.#translator.translate("helpTitle"),
      url
    };

    try {
      if (navigator.share) {
        await navigator.share(payload);
        return; // the sheet is its own confirmation
      }
    } catch {
      // Dismissing the sheet rejects; fall through to copying instead.
    }

    try {
      await navigator.clipboard.writeText(url);
      this.#confirm();
    } catch {
      // No clipboard permission and no share sheet: leave the label alone
      // rather than claiming something happened.
    }
  }

  #confirm() {
    this.#button.textContent = this.#translator.translate("shareCopied");
    clearTimeout(this.#resetTimer);
    this.#resetTimer = setTimeout(() => {
      this.#resetTimer = null;
      this.#showLabel();
    }, CONFIRMATION_MS);
  }
}
