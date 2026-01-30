/**
 * Initialize collaboration WebSocket
 */
export function initCollaboration(): void;
/**
 * Update collaboration status indicator
 * @param {string} status - Status: 'online', 'connecting', 'offline'
 */
export function updateCollabStatus(status: string): void;
/**
 * Broadcast a change to collaborators
 * @param {string} type - Change type
 * @param {Object} data - Change data
 */
export function broadcastChange(type: string, data: any): void;
/**
 * Check if collaboration is connected
 * @returns {boolean} Connection status
 */
export function isCollabConnected(): boolean;
/**
 * Get collaboration room ID
 * @returns {string|null} Room ID
 */
export function getCollabRoom(): string | null;
//# sourceMappingURL=builder-collab.d.ts.map