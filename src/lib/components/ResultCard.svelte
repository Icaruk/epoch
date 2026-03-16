<script>
  import TimeInput from "./TimeInput.svelte";

  /**
   * @typedef {import("../epoch-utils.js").TimeType} TimeType
   */

  /**
   * @typedef {Object} ResultCardProps
   * @property {TimeType} type - Type of result card (local or gmt)
   * @property {string} iso - ISO formatted datetime string
   * @property {string | null} offset - Timezone offset string (e.g., "GMT+5") or null for GMT
   * @property {(value: string) => void} onTimeEdit - Callback when time is edited
   * @property {(id: string | null) => void} onCopy - Callback when copy button is clicked
   * @property {string | null} copiedId - ID of currently copied item
   * @property {number} groupId - Unique group identifier
   */

  /** @type {ResultCardProps} */
  let { type = "local", iso, offset, onTimeEdit, onCopy, copiedId, groupId } = $props();

  /** @type {boolean} */
  const isLocal = $derived(type === "local");
</script>

<div class="result-card result-card--{type}">
  <h3 class={isLocal ? '' : 'gmt-heading'}>
    {isLocal ? "Local Time" : "GMT (UTC)"}
    {#if isLocal && offset}
      <span class="local-offset">{offset}</span>
    {/if}
  </h3>
  <TimeInput
    {iso}
    {type}
    {onTimeEdit}
    {onCopy}
    {copiedId}
    groupId={groupId}
  />
</div>
