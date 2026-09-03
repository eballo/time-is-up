/** Small DOM helpers shared by the UI classes. */

export function byId(id) {
  return document.getElementById(id);
}

/** Build an element in one call: createElement("span", "name", "Anna"). */
export function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent != null) element.textContent = textContent;
  return element;
}

/** Replace an element's children with a single fragment. */
export function replaceChildren(parent, fragment) {
  parent.innerHTML = "";
  parent.appendChild(fragment);
}

export function prefersReducedMotion() {
  return Boolean(
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function prefersDarkColorScheme() {
  return Boolean(
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Restart a CSS animation that is already applied. Removing the class is not
 * enough on its own — the browser coalesces both changes into one frame unless
 * a layout read forces it to flush in between.
 */
export function restartAnimation(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}
