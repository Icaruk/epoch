<script>
  import dayjs from "dayjs";
  import ResultCard from "./ResultCard.svelte";
  import { detectFormat, getIsoFromEpoch, getGmtIsoFromEpoch, getOffsetFromEpoch, getRelativeTime, adjustTimestamp, ISO_FORMAT } from "../epoch-utils.js";

  /**
   * @typedef {import("../epoch-utils.js").Group} Group
   */

  /**
   * @typedef {import("../epoch-utils.js").Format} Format
   */

  /**
   * @typedef {Object} ParsedInput
   * @property {string} epochInput
   * @property {Format} format
   * @property {import("dayjs").Dayjs} [isoDate]
   */

  /**
   * @typedef {Object} TimestampGroupProps
   * @property {Group} group - The timestamp group object (bindable)
   * @property {(id: number) => void} onDelete - Callback to delete group
   * @property {(id: number) => void} onClear - Callback to clear group input
   * @property {(id: number) => void} onSetNow - Callback to set current time
   * @property {(id: string | null) => void} onCopy - Callback when copy button is clicked
   * @property {string | null} copiedId - ID of currently copied item
   */

  /** @type {TimestampGroupProps} */
  let { group = $bindable(), onDelete, onClear, onSetNow, onCopy, copiedId } = $props();

  /** @type {ParsedInput | null} */
  const parsedInput = $derived.by(() => {
    if (!group.displayInput) return null;

    const num = parseInt(group.displayInput, 10);

    if (!isNaN(num)) {
      return {
        epochInput: group.displayInput,
        format: detectFormat(group.displayInput)
      };
    }

    const isoDate = dayjs(group.displayInput);
    if (isoDate.isValid()) {
      return {
        epochInput: isoDate.valueOf().toString(),
        format: /** @type {const} */ ("ms"),
        isoDate
      };
    }

    return null;
  });

  const epochInput = $derived(parsedInput?.epochInput ?? "");
  const format = $derived(parsedInput?.format ?? "sec");
  const error = $derived(group.displayInput && !parsedInput ? "Invalid timestamp" : null);
  const localIso = $derived.by(() => {
    if (!parsedInput) return "";
    if (parsedInput.isoDate) return parsedInput.isoDate.format(ISO_FORMAT);
    return getIsoFromEpoch(parsedInput.epochInput, parsedInput.format);
  });
  const gmtIso = $derived.by(() => {
    if (!parsedInput) return "";
    if (parsedInput.isoDate) return parsedInput.isoDate.utc().format(ISO_FORMAT);
    return getGmtIsoFromEpoch(parsedInput.epochInput, parsedInput.format);
  });
  const localOffset = $derived(parsedInput ? getOffsetFromEpoch(parsedInput.epochInput, parsedInput.format) : "");

  $effect(() => {
    if (!group.displayInput) {
      onCopy(null);
    } else if (!group.originalEpochInput && parsedInput) {
      group.originalEpochInput = parsedInput.epochInput;
    }
  });

  function handleBlur() {
    if (!group.displayInput) return;

    const isPureNumber = /^-?\d+$/.test(group.displayInput);
    if (!isPureNumber) {
      const isoDate = dayjs(group.displayInput);
      if (isoDate.isValid()) {
        group.displayInput = isoDate.valueOf().toString();
      }
    }
  }

  /**
   * @param {string} value
   */
  function handleTimeEdit(value) {
    const date = dayjs(value);
    if (!date.isValid()) return;

    const timestamp = group.format === "ms" ? date.valueOf().toString() : date.unix().toString();
    group.displayInput = timestamp;
  }

  function setNow() {
    onSetNow(group.id);
    const input = document.getElementById('epoch-input');
    if (input) {
      input.blur();
    }
  }

  function clearInput() {
    onClear(group.id);
  }

  function restoreOriginal() {
    group.displayInput = group.originalEpochInput ?? "";
  }

  function setAsOriginal() {
    group.originalEpochInput = group.displayInput;
  }

  /**
   * @param {import("../epoch-utils.js").Duration} duration
   */
  function adjustTime(duration) {
    const newTimestamp = adjustTimestamp(epochInput, format, duration);
    group.displayInput = newTimestamp.toString();
  }
</script>

<div class="group">
  <div class="group-header">
    <input
      class="group-name"
      type="text"
      bind:value={group.name}
    />
    <button
      class="delete-btn"
      onclick={() => onDelete(group.id)}>Delete</button
    >
  </div>

  <div class="input-group">
    <label
      for="epoch-input"
      class="sr-only">Enter epoch timestamp or ISO date</label
    >
    <input
      id="epoch-input"
      type="text"
      class="text-input"
      bind:value={group.displayInput}
      onblur={handleBlur}
      placeholder="Enter epoch timestamp or ISO date"
      aria-label="Epoch timestamp input"
      aria-describedby="format-help"
    />
    {#if !group.displayInput}
      <button
        class="now-btn"
        onclick={setNow}>Now</button
      >
    {/if}
    {#if group.displayInput}
      <div class="input-actions">
        <span class="format-badge">{format === "ms" ? "milliseconds" : "seconds"}</span>
        <button
          class="clear-btn"
          onclick={clearInput}
          aria-label="Clear input">X</button
        >
      </div>
    {/if}
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if group.originalEpochInput && group.displayInput !== group.originalEpochInput}
    <div class="modified-wrapper">
      <span class="modified-text">Timestamp modified</span>
      <button
        class="subtle-button"
        onclick={restoreOriginal}
      >
        Restore original
      </button>
      <button
        class="transparent-button"
        onclick={setAsOriginal}
      >
        Set as original
      </button>
    </div>
  {/if}

  {#if localIso !== ""}
    <div class="results">
      <ResultCard
        type="local"
        iso={localIso}
        offset={localOffset}
        onTimeEdit={handleTimeEdit}
        {onCopy}
        {copiedId}
        groupId={group.id}
      />
      <ResultCard
        type="gmt"
        iso={gmtIso}
        offset={null}
        onTimeEdit={handleTimeEdit}
        {onCopy}
        {copiedId}
        groupId={group.id}
      />
    </div>
    <div class="relative-time">{getRelativeTime(epochInput, format)}</div>
    <div class="quick-adjust">
      <div class="adjust-group">
        <button
          class="adjust-btn"
          onclick={() => adjustTime({ value: 1, unit: "h" })}>+1h</button
        >
        <button
          class="adjust-btn"
          onclick={() => adjustTime({ value: -1, unit: "h" })}>-1h</button
        >
      </div>
      <div class="adjust-group">
        <button
          class="adjust-btn"
          onclick={() => adjustTime({ value: 1, unit: "d" })}>+1d</button
        >
        <button
          class="adjust-btn"
          onclick={() => adjustTime({ value: -1, unit: "d" })}>-1d</button
        >
      </div>
    </div>
  {/if}
</div>
