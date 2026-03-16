<script>
  /**
   * @typedef {import("../epoch-utils.js").TimeType} TimeType
   */

  /**
   * @typedef {Object} TimeInputProps
   * @property {string} iso - ISO formatted datetime string
   * @property {TimeType} type - Type of time input (local or gmt)
   * @property {(value: string) => void} onTimeEdit - Callback when time is edited
   * @property {(id: string | null) => void} onCopy - Callback when copy button is clicked
   * @property {string | null} copiedId - ID of currently copied item
   * @property {number} groupId - Unique group identifier
   */

  /** @type {TimeInputProps} */
  let { iso, type = "local", onTimeEdit, onCopy, copiedId, groupId } = $props();

  /** @type {boolean} */
  const isLocal = $derived(type === "local");

  /**
   * @param {Event} e
   */
  function handleDateBlur(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    onTimeEdit(target.value + "T" + iso.slice(11));
  }

  /**
   * @param {Event} e
   */
  function handleTimeBlur(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    onTimeEdit(iso.slice(0, 10) + "T" + target.value + iso.slice(19));
  }

  /**
   * @param {Event} e
   */
  function handleMsBlur(e) {
    const target = /** @type {HTMLInputElement} */ (e.target);
    onTimeEdit(iso.slice(0, 19) + target.value);
  }

  function handleCopy() {
    onCopy(`${groupId}-${type}`);
    navigator.clipboard.writeText(iso);
  }
</script>

<div class="time-wrapper">
  <input
    class="time-input time-input--date"
    type="text"
    size="10"
    value={iso.slice(0, 10)}
    onblur={handleDateBlur}
  />
  <span class="separator">T</span>
  <input
    class="time-input time-input--time"
    type="text"
    size="8"
    value={iso.slice(11, 19)}
    onblur={handleTimeBlur}
  />
  <input
    class="time-input time-input--ms"
    type="text"
    size="4"
    value={iso.slice(19)}
    onblur={handleMsBlur}
  />
  <button
    class="subtle-button copy-btn {copiedId === `${groupId}-${type}` ? 'copied' : ''}"
    onclick={handleCopy}
  >
    {copiedId === `${groupId}-${type}` ? "Copied!" : "Copy"}
  </button>
</div>
