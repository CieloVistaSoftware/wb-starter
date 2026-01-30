/**
 * Draggable Behavior
 * Helper Attribute: [x-draggable]
 */
export function draggable(element, options = {}) {
    const config = {
        handle: options.handle || element.dataset.handle,
        axis: (options.axis || element.dataset.axis || "both"),
        bounds: options.bounds || element.dataset.bounds,
        grid: parseInt(String(options.grid || element.dataset.grid || "0"), 10),
        ...options
    };
    element.classList.add("wb-draggable");
    const handle = config.handle ? element.querySelector(config.handle) : element;
    if (!handle) {
        console.warn("[WB] Draggable: Handle not found");
        return () => { };
    }
    handle.classList.add("wb-draggable__handle");
    handle.style.cursor = "grab";
    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    const cs = window.getComputedStyle(element);
    if (cs.position === "static") {
        element.style.position = "relative";
        element.style.left = "0px";
        element.style.top = "0px";
    }
    const getBounds = () => {
        if (!config.bounds)
            return null;
        if (config.bounds === "viewport") {
            return { left: 0, top: 0, right: window.innerWidth - element.offsetWidth, bottom: window.innerHeight - element.offsetHeight };
        }
        if (config.bounds === "parent") {
            const parent = element.parentElement;
            if (!parent)
                return null;
            return { left: 0, top: 0, right: parent.clientWidth - element.offsetWidth, bottom: parent.clientHeight - element.offsetHeight };
        }
        const boundsEl = document.querySelector(config.bounds);
        if (boundsEl) {
            const br = boundsEl.getBoundingClientRect();
            const er = element.getBoundingClientRect();
            return { left: br.left - er.left + element.offsetLeft, top: br.top - er.top + element.offsetTop, right: br.right - er.left - element.offsetWidth + element.offsetLeft, bottom: br.bottom - er.top - element.offsetHeight + element.offsetTop };
        }
        return null;
    };
    const constrain = (x, y) => {
        const bounds = getBounds();
        if (!bounds)
            return { x, y };
        return { x: Math.max(bounds.left, Math.min(bounds.right, x)), y: Math.max(bounds.top, Math.min(bounds.bottom, y)) };
    };
    const snapToGrid = (value) => {
        if (!config.grid)
            return value;
        return Math.round(value / config.grid) * config.grid;
    };
    const onMouseDown = (e) => {
        if (e.button !== 0)
            return;
        e.preventDefault();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = element.offsetLeft;
        initialTop = element.offsetTop;
        element.classList.add("wb-draggable--dragging");
        handle.style.cursor = "grabbing";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        element.dispatchEvent(new CustomEvent("wb:drag:start", { bubbles: true, detail: { x: initialLeft, y: initialTop } }));
    };
    const onMouseMove = (e) => {
        if (!isDragging)
            return;
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;
        if (config.axis === "x")
            newTop = initialTop;
        else if (config.axis === "y")
            newLeft = initialLeft;
        newLeft = snapToGrid(newLeft);
        newTop = snapToGrid(newTop);
        const constrained = constrain(newLeft, newTop);
        element.style.left = constrained.x + "px";
        element.style.top = constrained.y + "px";
        element.dispatchEvent(new CustomEvent("wb:drag:move", { bubbles: true, detail: { x: constrained.x, y: constrained.y } }));
    };
    const onMouseUp = () => {
        if (!isDragging)
            return;
        isDragging = false;
        element.classList.remove("wb-draggable--dragging");
        handle.style.cursor = "grab";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        element.dispatchEvent(new CustomEvent("wb:drag:end", { bubbles: true, detail: { x: element.offsetLeft, y: element.offsetTop } }));
    };
    handle.addEventListener("mousedown", onMouseDown);
    const onTouchStart = (e) => {
        const touch = e.touches[0];
        onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0, preventDefault: () => { } });
    };
    const onTouchMove = (e) => {
        if (!isDragging)
            return;
        e.preventDefault();
        const touch = e.touches[0];
        onMouseMove({ clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => { } });
    };
    handle.addEventListener("touchstart", onTouchStart, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onMouseUp);
    element.wbDraggable = {
        setPosition: (x, y) => {
            element.style.left = x + "px";
            element.style.top = y + "px";
        },
        getPosition: () => ({
            x: element.offsetLeft,
            y: element.offsetTop
        })
    };
    element.dataset.wbReady = (element.dataset.wbReady || "") + " draggable";
    return () => {
        element.classList.remove("wb-draggable", "wb-draggable--dragging");
        handle.classList.remove("wb-draggable__handle");
        handle.style.cursor = "";
        handle.removeEventListener("mousedown", onMouseDown);
        handle.removeEventListener("touchstart", onTouchStart);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onMouseUp);
        delete element.wbDraggable;
    };
}
export default draggable;
//# sourceMappingURL=draggable.js.map