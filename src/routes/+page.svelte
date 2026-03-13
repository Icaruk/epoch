<script>
  import dayjs from "dayjs";
  import utc from "dayjs/plugin/utc";
  import timezone from "dayjs/plugin/timezone";
  import relativeTime from "dayjs/plugin/relativeTime";
  import "$lib/styles/variables.css";
  import "$lib/styles/components.css";

  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(relativeTime);

  const STORAGE_KEY = "epoch-groups";
  const ISO_FORMAT = "YYYY-MM-DDTHH:mm:ss";

  let groups = $state([createGroup("Group 1")]);
  let saveTimeout;

  function createGroup(name) {
    return {
      id: Date.now() + Math.random(),
      name,
      displayInput: "",
      epochInput: "",
      originalEpochInput: null,
      localIso: "",
      localOffset: "",
      gmtIso: "",
      format: "sec",
      error: null,
    };
  }

  function scheduleSave() {
    if (typeof localStorage === "undefined") return;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
        console.log("Saved to localStorage");
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }, 2000);
  }

  function loadFromStorage() {
    if (typeof localStorage === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          groups = parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  loadFromStorage();

  function addGroup() {
    const num = groups.length + 1;
    groups = [...groups, createGroup(`Group ${num}`)];
    scheduleSave();
  }

  function detectFormat(value) {
    if (!value) return "sec";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "sec";

    if (num > 1e10) return "ms";

    const date = dayjs.unix(num);
    if (date.year() < 1970 || date.year() > 2100) return "ms";

    return "sec";
  }

  function getDateFromEpoch(num, format) {
    return format === "ms" ? dayjs(num) : dayjs.unix(num);
  }

  function updateGroupFromIso(group, isoDate) {
    const timestamp = isoDate.valueOf();
    group.epochInput = timestamp.toString();
    group.displayInput = timestamp.toString();
    group.format = "ms";

    if (!group.originalEpochInput) {
      group.originalEpochInput = group.epochInput;
    }

    const offsetMinutes = isoDate.utcOffset();
    const offsetHours = Math.abs(offsetMinutes / 60);
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";

    group.localIso = isoDate.format(ISO_FORMAT);
    group.localOffset = `GMT${offsetSign}${offsetHours}`;
    group.gmtIso = isoDate.utc().format(ISO_FORMAT);
  }

  function handleInput(group) {
    group.error = null;

    if (!group.displayInput) {
      group.localIso = "";
      group.localOffset = "";
      group.gmtIso = "";
      group.originalEpochInput = null;
      group.error = null;
      scheduleSave();
      return;
    }

    const num = parseInt(group.displayInput, 10);
    const isNumber = !isNaN(num);

    if (isNumber) {
      group.epochInput = group.displayInput;

      if (!group.originalEpochInput) {
        group.originalEpochInput = group.epochInput;
      }

      group.format = detectFormat(group.displayInput);
      const date = getDateFromEpoch(num, group.format);

      const offsetMinutes = date.utcOffset();
      const offsetHours = Math.abs(offsetMinutes / 60);
      const offsetSign = offsetMinutes >= 0 ? "+" : "-";

      group.localIso = date.format(ISO_FORMAT);
      group.localOffset = `GMT${offsetSign}${offsetHours}`;
      group.gmtIso = date.utc().format(ISO_FORMAT);
    } else {
      const isoDate = dayjs(group.displayInput);
      if (isoDate.isValid()) {
        updateGroupFromIso(group, isoDate);
      } else {
        group.localIso = "";
        group.localOffset = "";
        group.gmtIso = "";
        group.originalEpochInput = null;
        group.epochInput = "";
        group.error = "Invalid timestamp";
      }
    }
    scheduleSave();
  }

  function handleBlur(group) {
    if (!group.displayInput) return;

    const isPureNumber = /^-?\d+$/.test(group.displayInput);
    if (!isPureNumber) {
      const isoDate = dayjs(group.displayInput);
      if (isoDate.isValid()) {
        updateGroupFromIso(group, isoDate);
      }
    }
    scheduleSave();
  }

  function handleTimeEdit(group, value) {
    const date = dayjs(value);
    if (!date.isValid()) return;

    const timestamp = date.unix().toString();
    group.epochInput = timestamp;
    group.displayInput = timestamp;
    group.format = "sec";

    const offsetMinutes = date.utcOffset();
    const offsetHours = Math.abs(offsetMinutes / 60);
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";

    group.localIso = date.format(ISO_FORMAT);
    group.localOffset = `GMT${offsetSign}${offsetHours}`;
    group.gmtIso = date.utc().format(ISO_FORMAT);

    scheduleSave();
  }

  function getRelativeTime(timestamp, format) {
    if (!timestamp) return "";
    const num = parseInt(timestamp, 10);
    const date = getDateFromEpoch(num, format);
    const now = dayjs();
    return date.from(now);
  }

  function adjustTime(group, duration) {
    const num = parseInt(group.epochInput, 10);
    const date = getDateFromEpoch(num, group.format);
    const adjusted = date.add(duration.value, duration.unit);
    const newTimestamp = group.format === "ms" ? adjusted.valueOf() : adjusted.unix();

    group.epochInput = newTimestamp.toString();
    group.displayInput = newTimestamp.toString();

    const offsetMinutes = adjusted.utcOffset();
    const offsetHours = Math.abs(offsetMinutes / 60);
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";

    group.localIso = adjusted.format(ISO_FORMAT);
    group.localOffset = `GMT${offsetSign}${offsetHours}`;
    group.gmtIso = adjusted.utc().format(ISO_FORMAT);

    scheduleSave();
  }

  let copiedId = $state(null);

  $effect(() => {
    if (copiedId === null) return;
    const timeout = setTimeout(() => {
      copiedId = null;
    }, 2000);

    return () => clearTimeout(timeout);
  });

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    copiedId = id;
  }

  function restoreOriginal(group) {
    group.epochInput = group.originalEpochInput;
    group.displayInput = group.originalEpochInput;
    handleInput(group);
    scheduleSave();
  }

  function deleteGroup(group) {
    groups = groups.filter(g => g.id !== group.id);
    scheduleSave();
  }

  function setNow(group) {
    const now = dayjs();
    const timestamp = now.valueOf();
    group.epochInput = timestamp.toString();
    group.displayInput = timestamp.toString();
    group.format = "ms";
    group.originalEpochInput = null;
    handleInput(group);
    scheduleSave();
  }
</script>

<div class="container">
  <header>
    <h1>Epoch Timestamp Converter</h1>
    <p class="intro">
      Convert Unix epoch timestamps to human-readable dates and vice versa. Supports milliseconds, seconds, and ISO 8601 date formats with automatic timezone detection.
    </p>
  </header>

  {#each groups as group (group.id)}
    <div class="group">
      <div class="group-header">
        <input
          class="group-name"
          type="text"
          bind:value={group.name}
          oninput={() => scheduleSave()}
        />
        <button
          class="delete-btn"
          onclick={() => deleteGroup(group)}>Delete</button
        >
      </div>

      <div class="input-group">
        <label for="epoch-input" class="sr-only">Enter epoch timestamp or ISO date</label>
        <input
          id="epoch-input"
          type="text"
          class="text-input"
          bind:value={group.displayInput}
          oninput={() => handleInput(group)}
          onblur={() => handleBlur(group)}
          placeholder="Enter epoch timestamp or ISO date"
          aria-label="Epoch timestamp input"
          aria-describedby="format-help"
        />
        {#if !group.displayInput}
          <button
            class="now-btn"
            onclick={() => setNow(group)}>Now</button
          >
        {/if}
        {#if group.displayInput}
          <span class="format-badge">{group.format === "ms" ? "milliseconds" : "seconds"}</span>
        {/if}
      </div>

      {#if group.error}
        <div class="error-message">{group.error}</div>
      {/if}

      {#if group.originalEpochInput && group.displayInput !== group.originalEpochInput}
        <div class="modified-wrapper">
          <span class="modified-text">Timestamp modified</span>
          <button
            class="subtle-button"
            onclick={() => restoreOriginal(group)}
          >
            Restore original
          </button>
        </div>
      {/if}

      {#if group.localIso !== ""}
        <div class="results">
          <div class="result-card">
            <h3>Local Time <span class="local-offset">{group.localOffset}</span></h3>
            <div class="time-wrapper">
              <input
                class="time-input time-input--date"
                type="text"
                value={group.localIso.slice(0, 10)}
                oninput={e => handleTimeEdit(group, e.target.value + "T" + group.localIso.slice(11), "local")}
              />
              <span class="separator">T</span>
              <input
                class="time-input time-input--time"
                type="text"
                value={group.localIso.slice(11)}
                oninput={e => handleTimeEdit(group, group.localIso.slice(0, 10) + "T" + e.target.value, "local")}
              />
              <button
                class="subtle-button copy-btn {copiedId === `${group.id}-local` ? 'copied' : ''}"
                onclick={() => copyToClipboard(group.localIso, `${group.id}-local`)}
              >
                {copiedId === `${group.id}-local` ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="result-card">
            <h3>GMT (UTC)</h3>
            <div class="time-wrapper">
              <input
                class="time-input time-input--date"
                type="text"
                value={group.gmtIso.slice(0, 10)}
                oninput={e => handleTimeEdit(group, e.target.value + "T" + group.gmtIso.slice(11), "gmt")}
              />
              <span class="separator">T</span>
              <input
                class="time-input time-input--time"
                type="text"
                value={group.gmtIso.slice(11)}
                oninput={e => handleTimeEdit(group, group.gmtIso.slice(0, 10) + "T" + e.target.value, "gmt")}
              />
              <button
                class="subtle-button copy-btn {copiedId === `${group.id}-gmt` ? 'copied' : ''}"
                onclick={() => copyToClipboard(group.gmtIso, `${group.id}-gmt`)}
              >
                {copiedId === `${group.id}-gmt` ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <div class="relative-time">{getRelativeTime(group.epochInput, group.format)}</div>
        <div class="quick-adjust">
          <div class="adjust-group">
            <button
              class="adjust-btn"
              onclick={() => adjustTime(group, { value: 1, unit: "h" })}>+1h</button
            >
            <button
              class="adjust-btn"
              onclick={() => adjustTime(group, { value: -1, unit: "h" })}>-1h</button
            >
          </div>
          <div class="adjust-group">
            <button
              class="adjust-btn"
              onclick={() => adjustTime(group, { value: 1, unit: "d" })}>+1d</button
            >
            <button
              class="adjust-btn"
              onclick={() => adjustTime(group, { value: -1, unit: "d" })}>-1d</button
            >
          </div>
        </div>
      {/if}
    </div>
  {/each}

  <button
    class="subtle-button"
    onclick={addGroup}>+ New group</button
  >
</div>
