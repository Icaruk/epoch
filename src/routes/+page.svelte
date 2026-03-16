<script>
  import TimestampGroup from "$lib/components/TimestampGroup.svelte";
  import { STORAGE_KEY } from "$lib/epoch-utils.js";
  import dayjs from "dayjs";
  import {
    detectFormat,
    getIsoFromEpoch,
    getGmtIsoFromEpoch,
    getOffsetFromEpoch,
    ISO_FORMAT
  } from "$lib/epoch-utils.js";
  import "$lib/styles/variables.css";
  import "$lib/styles/utilities.css";
  import "$lib/styles/components.css";

  /**
   * @typedef {import("$lib/epoch-utils.js").Group} Group
   */

  /** @type {Group[]} */
  let groups = $state([]);

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout;

  /** @type {string | null} */
  let copiedId = $state(null);

  /**
   * @param {string} name
   * @returns {Group}
   */
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
    },2000);
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

  /**
   * @param {number} id
   */
  function deleteGroup(id) {
    groups = groups.filter(g => g.id !== id);
    scheduleSave();
  }

  /**
   * @param {number} id
   */
  function clearGroup(id) {
    groups = groups.map(g => {
      if (g.id === id) {
        return {
          ...g,
          displayInput: "",
          epochInput: "",
          localIso: "",
          localOffset: "",
          gmtIso: "",
          originalEpochInput: null,
          error: null,
        };
      }
      return g;
    });
    scheduleSave();
  }

  /**
   * @param {number} id
   */
  function setGroupNow(id) {
    const timestamp = Date.now();

    groups = groups.map(g => {
      if (g.id === id) {
        return {
          ...g,
          displayInput: timestamp.toString(),
          originalEpochInput: null,
          error: null,
        };
      }
      return g;
    });
    scheduleSave();
  }

  /**
   * @param {string | null} id
   */
  function setCopiedId(id) {
    copiedId = id;
    setTimeout(() => {
      copiedId = null;
    },2000);
  }
</script>

<div class="container">
  <header>
    <h1>Epoch Timestamp Converter</h1>
    <p class="intro">
      Convert Unix epoch timestamps to human-readable dates and vice versa. Supports milliseconds, seconds, and ISO 8601 date formats with automatic timezone detection.
    </p>
  </header>

  {#each groups as group, index (group.id)}
    <TimestampGroup
      bind:group={groups[index]}
      onDelete={deleteGroup}
      onClear={clearGroup}
      onSetNow={setGroupNow}
      onCopy={setCopiedId}
      {copiedId}
    />
  {/each}

  <button
    class="subtle-button"
    onclick={addGroup}>+ New group</button
  >
</div>
