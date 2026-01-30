/**
 * Bootstrap the WB Behaviors
 * @param {Object} options - Configuration options
 * @returns {Promise<{WB: Object, Views: Object}>} Initialized modules
 */
export function bootstrap(options?: any): Promise<{
    WB: any;
    Views: any;
}>;
export default bootstrap;
import WB from "./wb-lazy.js";
import { initViews } from "./wb-views.js";
export { WB, initViews };
//# sourceMappingURL=wb-bootstrap.d.ts.map