// Minimal, dependency-free toast notifications.
//
// Replaces the notyf library so we never assign dynamic strings (toast
// messages can contain text scraped from the DMV page) through innerHTML.
// Everything here is built with createElement/textContent/createElementNS.

import "./toast.css";

const SVG_NS = "http://www.w3.org/2000/svg";

// Matches notyf's default auto-dismiss duration.
const DEFAULT_DURATION = 2000;

const createSvgElement = (tagName, attributes) => {
  const element = document.createElementNS(SVG_NS, tagName);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
};

const createIconSvg = (paths) => {
  const svg = createSvgElement("svg", {
    viewBox: "0 0 24 24",
    width: "18",
    height: "18",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  svg.classList.add("vtt-toast-icon-svg");
  for (const path of paths) {
    svg.appendChild(path);
  }
  return svg;
};

/**
 * An open eye, used for the "commands visible" toast.
 */
export const buildEyeIcon = () =>
  createIconSvg([
    createSvgElement("path", { d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" }),
    createSvgElement("circle", { cx: "12", cy: "12", r: "3" }),
  ]);

/**
 * An eye with a slash through it, used for the "commands hidden" toast.
 */
export const buildEyeSlashIcon = () =>
  createIconSvg([
    createSvgElement("path", {
      d: "M1 12s4-7 11-7c2 0 3.7.6 5.1 1.4M23 12s-4 7-11 7c-2 0-3.7-.6-5.1-1.4",
    }),
    createSvgElement("path", { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" }),
    createSvgElement("line", { x1: "2", y1: "2", x2: "22", y2: "22" }),
  ]);

/**
 * Creates an independent toast stack anchored to a corner of the screen.
 *
 * `show()` returns a handle that can be passed to `dismiss()`, or ignored;
 * `dismissAll()` removes every toast currently tracked by this toaster.
 */
export const createToaster = ({ position = "bottom-right" } = {}) => {
  const container = document.createElement("div");
  container.classList.add("vtt-toast-container", `vtt-toast-container--${position}`);
  document.body.appendChild(container);

  const active = new Set();

  const show = ({ message, type = "success", duration = DEFAULT_DURATION, dismissible = false, onDismiss, icon }) => {
    const toast = document.createElement("div");
    toast.classList.add("vtt-toast", `vtt-toast--${type}`);

    if (icon) {
      const iconWrapper = document.createElement("span");
      iconWrapper.classList.add("vtt-toast-icon");
      iconWrapper.appendChild(icon());
      toast.appendChild(iconWrapper);
    }

    const messageElement = document.createElement("span");
    messageElement.classList.add("vtt-toast-message");
    messageElement.textContent = message ?? "";
    toast.appendChild(messageElement);

    const handle = {};
    let dismissed = false;
    handle.remove = () => {
      if (dismissed) {
        return;
      }
      dismissed = true;
      active.delete(handle);
      toast.classList.add("vtt-toast--disappear");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
      onDismiss?.();
    };

    if (dismissible) {
      const dismissButton = document.createElement("button");
      dismissButton.type = "button";
      dismissButton.classList.add("vtt-toast-dismiss");
      dismissButton.textContent = "×";
      dismissButton.setAttribute("aria-label", "Dismiss");
      dismissButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handle.remove();
      });
      toast.appendChild(dismissButton);
    }

    container.appendChild(toast);
    active.add(handle);

    if (duration > 0) {
      setTimeout(handle.remove, duration);
    }

    return handle;
  };

  const dismiss = (handle) => handle?.remove();

  const dismissAll = () => {
    for (const handle of [...active]) {
      handle.remove();
    }
  };

  return { show, dismiss, dismissAll };
};
