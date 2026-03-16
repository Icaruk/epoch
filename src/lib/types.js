/**
 * @typedef {'sec' | 'ms'} Format
 * Timestamp format: 'sec' for seconds, 'ms' for milliseconds
 */

/**
 * @typedef {'local' | 'gmt'} TimeType
 * Type of time display: 'local' or 'gmt'
 */

/**
 * @typedef {Object} Group
 * Timestamp group object containing all conversion data
 * @property {number} id - Unique group identifier
 * @property {string} name - Group name
 * @property {string} displayInput - User input value
 * @property {string} epochInput - Epoch timestamp as string
 * @property {string | null} originalEpochInput - Original epoch timestamp for restore functionality
 * @property {string} localIso - ISO formatted local datetime
 * @property {string} localOffset - Timezone offset string (e.g., "GMT+5")
 * @property {string} gmtIso - ISO formatted GMT datetime
 * @property {Format} format - Timestamp format ('sec' or 'ms')
 * @property {string | null} error - Error message if any
 */

/**
 * @typedef {Object} Duration
 * Duration object for time adjustment
 * @property {number} value - Amount to adjust
 * @property {'h' | 'd'} unit - Unit of adjustment ('h' for hours, 'd' for days)
 */
