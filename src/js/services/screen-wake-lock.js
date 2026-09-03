/**
 * Keeps the screen on for the length of a run — it matters most on the phone
 * or tablet someone props up for the meeting.
 *
 * Every failure mode (no API, insecure context, hidden tab, user denial) ends
 * in the same place: no lock, no error, and a timer that carries on regardless.
 */
export class ScreenWakeLock {
  #sentinel = null;

  get isHeld() {
    return this.#sentinel !== null;
  }

  acquire() {
    if (!navigator.wakeLock || this.#sentinel) return;
    try {
      navigator.wakeLock.request("screen").then(
        (sentinel) => {
          this.#sentinel = sentinel;
          // The browser drops the lock whenever the tab is hidden.
          sentinel.addEventListener("release", () => {
            this.#sentinel = null;
          });
        },
        () => {
          // Denied, hidden tab, or plain http:// — nothing to do.
        }
      );
    } catch {
      // Older engines can throw synchronously.
    }
  }

  release() {
    if (!this.#sentinel) return;
    try {
      this.#sentinel.release();
    } catch {
      // Already gone.
    }
    this.#sentinel = null;
  }
}
