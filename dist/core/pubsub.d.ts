/**
 * WB PubSub - Event Bus System
 * ============================
 * Lightweight publish/subscribe pattern for decoupled communication.
 */
export class PubSub {
    events: Map<any, any>;
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event: string, callback: Function): Function;
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    unsubscribe(event: string, callback: Function): void;
    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    publish(event: string, data: any): void;
    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event: string, callback: Function): Function;
    /**
     * Clear all subscriptions
     */
    clear(): void;
}
export const pubsub: PubSub;
export default pubsub;
//# sourceMappingURL=pubsub.d.ts.map