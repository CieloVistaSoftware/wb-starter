(() => {
  let overlayEnabled = false;
  let currentTooltip = null;
  let currentHighlighted = null;

  function createToggleButton() {
    const btn = document.createElement("button");
    btn.className = "x-overlay-toggle";
    btn.innerHTML = `
      <span class="x-overlay-toggle-dot"></span>
      <span>wb-starter overlay</span>
    `;
    btn.addEventListener("click", () => {
      overlayEnabled = !overlayEnabled;
      const dot = btn.querySelector(".x-overlay-toggle-dot");
      if (overlayEnabled) {
        dot.classList.add("active");
        attachHoverListeners();
      } else {
        dot.classList.remove("active");
        detachHoverListeners();
        clearHighlight();
        removeTooltip();
      }
    });
    document.body.appendChild(btn);
  }

  function isWbComponent(el) {
    // Heuristic: custom elements or elements with wb-* attributes/classes
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith("wb-")) return true;
    if ([...el.classList].some((c) => c.startsWith("wb-"))) return true;
    if ([...el.attributes].some((a) => a.name.startsWith("wb-"))) return true;
    return false;
  }

  function getComponentInfo(el) {
    const tag = el.tagName.toLowerCase();

    // Try to read some useful hints from attributes
    const id = el.getAttribute("id") || null;
    const modelPath =
      el.getAttribute("data-x-model-path") ||
      el.getAttribute("x-model-path") ||
      null;

    const props = {};
    [...el.attributes].forEach((attr) => {
      if (
        attr.name.startsWith("data-") ||
        attr.name.startsWith("wb-") ||
        attr.name === "id"
      ) {
        props[attr.name] = attr.value;
      }
    });

    return {
      tag,
      id,
      modelPath,
      props,
    };
  }

  function attachHoverListeners() {
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("mousemove", handleMouseMove, true);
  }

  function detachHoverListeners() {
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("mousemove", handleMouseMove, true);
  }

  function handleMouseOver(e) {
    if (!overlayEnabled) return;
    const el = e.target;
    if (!isWbComponent(el)) return;

    clearHighlight();
    removeTooltip();

    currentHighlighted = el;
    el.classList.add("x-overlay-highlight");

    const info = getComponentInfo(el);
    currentTooltip = createTooltip(info, e.clientX, e.clientY);
    document.body.appendChild(currentTooltip);
  }

  function handleMouseOut(e) {
    if (!overlayEnabled) return;
    if (e.target === currentHighlighted) {
      clearHighlight();
      removeTooltip();
    }
  }

  function handleMouseMove(e) {
    if (!overlayEnabled || !currentTooltip) return;
    positionTooltip(currentTooltip, e.clientX, e.clientY);
  }

  function clearHighlight() {
    if (currentHighlighted) {
      currentHighlighted.classList.remove("x-overlay-highlight");
      currentHighlighted = null;
    }
  }

  function removeTooltip() {
    if (currentTooltip && currentTooltip.parentNode) {
      currentTooltip.parentNode.removeChild(currentTooltip);
    }
    currentTooltip = null;
  }

  function createTooltip(info, x, y) {
    const tooltip = document.createElement("div");
    tooltip.className = "x-overlay-tooltip";

    const propsPreview = Object.entries(info.props)
      .slice(0, 6)
      .map(([k, v]) => `${k}="${v}"`)
      .join("  ");

    tooltip.innerHTML = `
      <div class="x-overlay-tooltip-title">&lt;${info.tag}&gt;</div>
      ${
        info.id
          ? `<div class="x-overlay-tooltip-row">
               <span class="x-overlay-tooltip-label">id:</span>
               <span>${info.id}</span>
             </div>`
          : ""
      }
      ${
        info.modelPath
          ? `<div class="x-overlay-tooltip-row">
               <span class="x-overlay-tooltip-label">model:</span>
               <span>${info.modelPath}</span>
             </div>`
          : ""
      }
      ${
        propsPreview
          ? `<div class="x-overlay-tooltip-row">
               <span class="x-overlay-tooltip-label">props:</span>
               <span>${propsPreview}</span>
             </div>`
          : ""
      }
    `;

    positionTooltip(tooltip, x, y);
    return tooltip;
  }

  function positionTooltip(tooltip, x, y) {
    const padding = 12;
    const { innerWidth, innerHeight } = window;
    const rect = tooltip.getBoundingClientRect();

    let left = x + padding;
    let top = y + padding;

    if (left + rect.width > innerWidth) {
      left = x - rect.width - padding;
    }
    if (top + rect.height > innerHeight) {
      top = y - rect.height - padding;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  // Boot
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    createToggleButton();
  } else {
    document.addEventListener("DOMContentLoaded", createToggleButton);
  }
})();
