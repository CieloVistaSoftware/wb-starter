// Compatibility shim for dynamic imports that expect `src/wb-viewmodels/statusbar.js`.
// The real implementation lives in `navigation.js` (exports a `statusbar` behavior and default bundle).
// Keep this file minimal and stable so runtime dynamic-imports succeed across versions.
export { statusbar } from './navigation.js';
export { default } from './navigation.js';
// Expose legacy global if older code expects it
import('./navigation.js').then(mod => {
    if (typeof window !== 'undefined' && mod && mod.statusbar) {
        window.wbStatusbar = mod.statusbar;
    }
}).catch(() => { });
//# sourceMappingURL=statusbar.js.map