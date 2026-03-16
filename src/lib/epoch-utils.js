import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const STORAGE_KEY = "epoch-groups";
export const ISO_FORMAT = "YYYY-MM-DDTHH:mm:ss.SSSZ";

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

/**
 * Detect if value is in seconds or milliseconds format
 * @param {string} value - The timestamp value to check
 * @returns {Format} - 'sec' for seconds, 'ms' for milliseconds
 */
export function detectFormat(value) {
  if (!value) return "sec";
  const num = parseInt(value, 10);
  if (isNaN(num)) return "sec";

  if (num > 1e10) return "ms";

  const date = dayjs.unix(num);
  if (date.year() < 1970 || date.year() > 2100) return "ms";

  return "sec";
}

/**
 * Get a dayjs date object from an epoch timestamp
 * @param {number} num - The epoch timestamp
 * @param {Format} format - 'sec' or 'ms'
 * @returns {import("dayjs").Dayjs} - The dayjs date object
 */
export function getDateFromEpoch(num, format) {
  return format === "ms" ? dayjs(num) : dayjs.unix(num);
}

/**
 * Get ISO formatted date string from epoch timestamp
 * @param {string} epoch - The epoch timestamp as string
 * @param {Format} format - 'sec' or 'ms'
 * @returns {string} - ISO formatted date string
 */
export function getIsoFromEpoch(epoch, format) {
  const date = getDateFromEpoch(parseInt(epoch, 10), format);
  return date.format(ISO_FORMAT);
}

/**
 * Get ISO formatted GMT date string from epoch timestamp
 * @param {string} epoch - The epoch timestamp as string
 * @param {Format} format - 'sec' or 'ms'
 * @returns {string} - ISO formatted GMT date string
 */
export function getGmtIsoFromEpoch(epoch, format) {
  const date = getDateFromEpoch(parseInt(epoch, 10), format);
  return date.utc().format(ISO_FORMAT);
}

/**
 * Get timezone offset string from epoch timestamp
 * @param {string} epoch - The epoch timestamp as string
 * @param {Format} format - 'sec' or 'ms'
 * @returns {string} - Timezone offset string (e.g., "GMT+5")
 */
export function getOffsetFromEpoch(epoch, format) {
  const date = getDateFromEpoch(parseInt(epoch, 10), format);
  const offsetMinutes = date.utcOffset();
  const offsetHours = Math.abs(offsetMinutes / 60);
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  return `GMT${offsetSign}${offsetHours}`;
}

/**
 * Get relative time string from epoch timestamp
 * @param {string} timestamp - The epoch timestamp as string
 * @param {Format} format - 'sec' or 'ms'
 * @returns {string} - Relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp, format) {
  if (!timestamp) return "";
  const num = parseInt(timestamp, 10);
  const date = getDateFromEpoch(num, format);
  const now = dayjs();
  return date.from(now);
}

/**
 * Adjust timestamp by a duration
 * @param {string} epoch - The epoch timestamp as string
 * @param {Format} format - 'sec' or 'ms'
 * @param {Duration} duration - Duration object with value and unit
 * @returns {number} - The adjusted timestamp
 */
export function adjustTimestamp(epoch, format, duration) {
  const date = getDateFromEpoch(parseInt(epoch, 10), format);
  const adjusted = date.add(duration.value, duration.unit);
  return format === "ms" ? adjusted.valueOf() : adjusted.unix();
}
