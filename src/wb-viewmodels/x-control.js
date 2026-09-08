/**
 * <div x-control>
 * -----------------------------------------------------------------------------
 * Applies the schema's declared baseClass. That is all it does.
 *
 * This file used to open with `export class WBControl extends HTMLElement`,
 * whose connectedCallback added an 'x-control-btn' class, read an `action`
 * attribute ("move-up", "move-down", ...), wired the matching move.js function,
 * and set role/tabindex plus an Enter/Space handler. Nothing ever called
 * customElements.define() for it — grep the tree, the only match was the word
 * inside that file's own comment — so none of it has ever run and none of it is
 * documented behaviour anyone can be relying on (#1063).
 *
 * So `action="move-up"` is NOT supported here. The move behaviors are reachable
 * on their own: move/moveup/movedown/moveleft/moveright/moveall are all mapped
 * in wb-viewmodels/index.js and dispatch through WB.inject() like everything
 * else. If <div x-control> should ever grow the button treatment again, it goes
 * below, deliberately, with a test.
 * -----------------------------------------------------------------------------
 *
 * Usage: <div x-control>...</div>
 */
export default function control(element) {
    element.classList.add('x-control');
    return () => {};
}
