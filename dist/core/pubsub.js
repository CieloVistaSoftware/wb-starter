/**
 * WB PubSub - Event Bus System
 * ============================
 * Lightweight publish/subscribe pattern for decoupled communication.
 */
export class PubSub {
    constructor() {
        this.events = new Map();
    }
    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);
        // Return unsubscribe function
        return () => this.unsubscribe(event, callback);
    }
    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    unsubscribe(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                this.events.delete(event);
            }
        }
    }
    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    publish(event, data) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error(`[PubSub] Error in subscriber for ${event}:`, error);
                }
            });
        }
    }
    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const unsubscribe = this.subscribe(event, (data) => {
            unsubscribe();
            callback(data);
        });
        return unsubscribe;
    }
    /**
     * Clear all subscriptions
     */
    clear() {
        this.events.clear();
    }
}
// Export singleton instance
export const pubsub = new PubSub();
export default pubsub;
//# sourceMappingURL=pubsub.js.map