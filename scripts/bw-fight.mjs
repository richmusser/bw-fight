const SOCKET_NAME = "module.bw-fight";
const FLAG_SCOPE = "bw-fight";
const FLAG_GROUPS = "groups";
const FLAG_REVEALED = "revealed";
const FLAG_READY = "ready";
const FLAG_SCRIPTED = "scripted";

const ACTIONS = ["Strike", "Counter Strike", "Avoid", "Block"];

// ---- Flag Helpers ----

async function saveGroups(combat, groups) {
  await combat.setFlag(FLAG_SCOPE, FLAG_GROUPS, foundry.utils.duplicate(groups));
}

function loadGroups(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_GROUPS);
  return raw ? foundry.utils.duplicate(raw) : [];
}

async function saveRevealed(combat, revealed) {
  await combat.setFlag(FLAG_SCOPE, FLAG_REVEALED, foundry.utils.duplicate(revealed));
}

function loadRevealed(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_REVEALED);
  return raw ? foundry.utils.duplicate(raw) : {};
}

async function saveReady(combat, ready) {
  await combat.setFlag(FLAG_SCOPE, FLAG_READY, foundry.utils.duplicate(ready));
}

function loadReady(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_READY);
  return raw ? foundry.utils.duplicate(raw) : {};
}

async function saveScripted(combat, scripted) {
  await combat.setFlag(FLAG_SCOPE, FLAG_SCRIPTED, foundry.utils.duplicate(scripted));
}

function loadScripted(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_SCRIPTED);
  return raw ? foundry.utils.duplicate(raw) : {};
}

// ---- FightDialog ----

class FightDialog extends Application {
  constructor(combat, options = {}) {
    super(options);
    this.combat = combat;
    // Local (unrevealed) actions: { [groupId]: { [actorId]: [[], [], []] } }
    this.localActions = {};
    // Tracks actors whose Ready has been sent but not yet saved to combat flags.
    // Maps "groupId-actorId" → actions array so we can render locked cards locally.
    this._pendingReadyLocal = {};
    // Local disadvantage overrides received via socket before flags sync.
    // Maps "groupId-actorId" → value
    this._localDisadvantage = {};
    // Tracks which group-volley combos have been revealed, for flip animation.
    // Seed from current flag state so existing reveals don't animate on open.
    this._previouslyRevealed = new Set();
    const existingRevealed = loadRevealed(combat);
    for (const [groupId, volleys] of Object.entries(existingRevealed)) {
      for (const vi of Object.keys(volleys)) {
        this._previouslyRevealed.add(`${groupId}-${vi}`);
      }
    }
    // Pending reveal callbacks
    this._pendingRevealResolvers = {};
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/bw-fight/templates/fight-dialog.hbs",
      classes: ["bw-fight-dialog"],
      width: 720,
      height: "auto",
      resizable: true,
      title: "Fight!",
    });
  }

  get id() {
    return `bw-fight-${this.combat.id}`;
  }

  async _render(...args) {
    await this._ensureDefaultGroup();
    return super._render(...args);
  }

  async _ensureDefaultGroup() {
    const groups = loadGroups(this.combat);
    if (groups.length === 0 && game.user.isGM) {
      groups.push({
        id: foundry.utils.randomID(),
        name: "Group 1",
        actorIds: [],
        exchange: 1,
      });
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
    }
  }

  getData() {
    const groups = loadGroups(this.combat);
    const revealed = loadRevealed(this.combat);
    const ready = loadReady(this.combat);
    const scripted = loadScripted(this.combat);
    const isGM = game.user.isGM;

    const allActorIds = [...new Set(
      this.combat.combatants.map(c => c.actor?.id).filter(Boolean)
    )];

    const assignedSet = new Set();
    for (const group of groups) {
      for (const id of (group.actorIds || [])) assignedSet.add(id);
    }

    const allCombatants = allActorIds.map(actorId => {
      const actor = game.actors.get(actorId);
      return {
        actorId,
        name: actor?.name ?? "Unknown",
        img: actor?.img ?? "icons/svg/mystery-man.svg",
        assigned: assignedSet.has(actorId),
      };
    });

    const groupsData = groups.map(group => {
      const groupRevealed = revealed[group.id] || {};
      const groupReady = ready[group.id] || {};
      const groupScripted = scripted[group.id] || {};
      const actors = (group.actorIds || []).map(actorId => {
        const actor = game.actors.get(actorId);
        const isOwner = actor?.isOwner ?? false;
        const pendingReadyKey = `${group.id}-${actorId}`;
        const pendingReadyActions = this._pendingReadyLocal[pendingReadyKey];
        const isReady = !!groupReady[actorId] || !!pendingReadyActions;
        const localGroupActions = this.localActions[group.id] || {};
        const localActorActions = localGroupActions[actorId] || [[], [], []];
        const scriptedActions = groupScripted[actorId] || [[], [], []];

        // Clear pendingReadyLocal once flags have caught up
        if (groupReady[actorId] && pendingReadyActions) {
          delete this._pendingReadyLocal[pendingReadyKey];
        }

        // Compute max card count across all volleys for uniform hidden card display
        const hasScripted = scriptedActions.some(v => v && v.length > 0);
        const readySource = hasScripted ? scriptedActions : pendingReadyActions;
        const maxReadyCards = isReady && readySource
          ? Math.max(...[0, 1, 2].map(vi => (readySource[vi] || []).length), 1)
          : 1;

        const volleys = [0, 1, 2].map(vi => {
          const volleyRevealed = groupRevealed[vi];
          if (volleyRevealed && volleyRevealed[actorId]) {
            const revealedActions = volleyRevealed[actorId];
            // Pad with "No Action" so all revealed volleys show the same count
            const padded = [...revealedActions];
            while (padded.length < maxReadyCards) padded.push("No Action");
            return {
              volleyIndex: vi,
              cards: padded.map(a => ({
                action: a,
                state: "revealed",
                isHidden: false,
              })),
              canScript: false,
              isRevealed: true,
            };
          }

          // If actor is ready, show uniform hidden cards across all volleys
          if (isReady) {
            return {
              volleyIndex: vi,
              cards: Array.from({ length: maxReadyCards }, () => ({ action: "", state: "hidden", isHidden: true })),
              canScript: false,
              isRevealed: false,
            };
          }

          // Not yet revealed, not ready
          const localCards = localActorActions[vi] || [];
          if (isOwner) {
            return {
              volleyIndex: vi,
              cards: localCards.map(a => ({ action: a, state: "owned", isHidden: false })),
              canScript: true,
              isRevealed: false,
            };
          }
          // Other user's actor — show face-down cards
          return {
            volleyIndex: vi,
            cards: localCards.length > 0
              ? localCards.map(() => ({ action: "", state: "hidden", isHidden: true }))
              : [],
            canScript: false,
            isRevealed: false,
          };
        });

        const localKey = `${group.id}-${actorId}`;
        const localOverride = this._localDisadvantage[localKey];
        const actorDisadvantage = localOverride ?? (group.actorDisadvantage || {})[actorId] ?? 0;
        // Clear local override once flags have caught up
        if (localOverride != null && (group.actorDisadvantage || {})[actorId] === localOverride) {
          delete this._localDisadvantage[localKey];
        }
        const disadvantageOptions = Array.from({ length: 6 }, (_, i) => ({
          value: i,
          label: `+${i} Ob`,
          selected: i === actorDisadvantage,
        }));

        return {
          actorId,
          name: actor?.name ?? "Unknown",
          img: actor?.img ?? "icons/svg/mystery-man.svg",
          woundedDice: actor?.system?.pgts?.woundedDice ?? 0,
          obstaclePenalty: actor?.system?.pgts?.obstaclePenalties ?? 0,
          isOwner,
          isReady,
          volleys,
          disadvantageOptions,
        };
      });

      // Check which volleys are revealed for this group
      const volleyRevealed = [0, 1, 2].map(vi => !!groupRevealed[vi]);

      return {
        id: group.id,
        name: group.name,
        actors,
        hasActors: actors.length > 0,
        volleyRevealed,
        exchange: group.exchange || 1,
      };
    });

    const data = {
      allCombatants,
      groups: groupsData,
      hasGroups: groupsData.length > 0,
      isGM,
    };
    return this._applyRemoteCardCounts(data);
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (game.user.isGM) {
      html.find(".add-group").on("click", this._onAddGroup.bind(this));
      html.find(".show-to-players").on("click", this._onShowToPlayers.bind(this));
      html.find(".remove-from-group").on("click", this._onRemoveFromGroup.bind(this));
      html.find(".remove-group").on("click", this._onRemoveGroup.bind(this));
      html.find(".reveal-volley").on("click", this._onRevealVolley.bind(this));
      html.find(".next-exchange").on("click", this._onNextExchange.bind(this));

      // Drag-and-drop listeners
      html.find(".combatant-draggable:not(.assigned)").on("dragstart", this._onDragStart.bind(this));
      html.find(".combatant-draggable:not(.assigned)").on("dragend", this._onDragEnd.bind(this));

      const groupEls = html.find(".fight-group");
      groupEls.on("dragover", this._onDragOver.bind(this));
      groupEls.on("dragleave", this._onDragLeave.bind(this));
      groupEls.on("drop", this._onDrop.bind(this));

      html.find(".group-drop-zone").on("dragover", (event) => {
        event.preventDefault();
      });
      html.find(".group-drop-zone").on("drop", (event) => {
        event.preventDefault();
        const groupEl = event.currentTarget.closest(".fight-group");
        if (groupEl) {
          const actorId = event.originalEvent.dataTransfer.getData("text/plain");
          const groupId = groupEl.dataset.groupId;
          if (!actorId || !groupId) return;
          this._addActorToGroup(actorId, groupId);
        }
      });
    }

    // Double-click actor image to open character sheet
    html.find(".volley-grid .actor-thumb").on("dblclick", (event) => {
      const actorId = event.currentTarget.closest("tr").querySelector("[data-actor-id]")?.dataset.actorId;
      const actor = game.actors.get(actorId);
      if (actor) actor.sheet.render(true);
    });

    // All users can change disadvantage, click action cards, and ready button
    html.find(".actor-disadvantage-select").on("change", this._onActorDisadvantageChange.bind(this));
    html.find(".action-card.blank").on("click", this._onBlankCardClick.bind(this));
    html.find(".action-card.owned").on("click", this._onOwnedCardClick.bind(this));
    html.find(".ready-btn").on("click", this._onReadyClick.bind(this));

    // Apply flip animation to newly revealed cards
    this._applyFlipAnimation(html);
  }

  _applyFlipAnimation(html) {
    const revealed = loadRevealed(this.combat);
    const currentRevealed = new Set();

    for (const [groupId, volleys] of Object.entries(revealed)) {
      for (const vi of Object.keys(volleys)) {
        currentRevealed.add(`${groupId}-${vi}`);
      }
    }

    // Find newly revealed volleys (in current but not in previous)
    const newlyRevealed = new Set();
    for (const key of currentRevealed) {
      if (!this._previouslyRevealed.has(key)) {
        newlyRevealed.add(key);
      }
    }

    // Add flip-in class to cards in newly revealed volleys
    if (newlyRevealed.size > 0) {
      html.find(".action-card.revealed").each((_, el) => {
        const groupId = el.dataset.groupId;
        const volley = el.dataset.volley;
        if (newlyRevealed.has(`${groupId}-${volley}`)) {
          el.classList.add("flip-in");
        }
      });
    }

    // Update tracking set
    this._previouslyRevealed = currentRevealed;
  }

  async _onShowToPlayers() {
    await this.combat.setFlag(FLAG_SCOPE, "showDialog", Date.now());
  }

  // ---- GM Group Management ----

  async _onAddGroup() {
    const groups = loadGroups(this.combat);
    groups.push({
      id: foundry.utils.randomID(),
      name: `Group ${groups.length + 1}`,
      actorIds: [],
      exchange: 1,
    });
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onActorDisadvantageChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const actorId = event.currentTarget.dataset.actorId;
    const value = parseInt(event.currentTarget.value);

    // Broadcast to all other clients for immediate update
    game.socket.emit(SOCKET_NAME, {
      type: "disadvantageChange",
      combatId: this.combat.id,
      groupId,
      actorId,
      value,
    });

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.actorDisadvantage) group.actorDisadvantage = {};
        group.actorDisadvantage[actorId] = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      // Player can't write combat flags; user flag as fallback for GM to persist
      await game.user.setFlag(FLAG_SCOPE, "pendingDisadvantage", {
        combatId: this.combat.id,
        groupId,
        actorId,
        value,
        t: Date.now(),
      });
    }
  }

  async _addActorToGroup(actorId, groupId) {
    const groups = loadGroups(this.combat);
    // Check not already assigned
    const alreadyAssigned = groups.some(g => (g.actorIds || []).includes(actorId));
    if (alreadyAssigned) return;

    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.actorIds.push(actorId);
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onRemoveFromGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const actorId = event.currentTarget.dataset.actorId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.actorIds = group.actorIds.filter(id => id !== actorId);
      if (group.actorDisadvantage) delete group.actorDisadvantage[actorId];
      await saveGroups(this.combat, groups);
      // Clean local actions
      if (this.localActions[groupId]) delete this.localActions[groupId][actorId];
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onRemoveGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const groups = loadGroups(this.combat).filter(g => g.id !== groupId);
    delete this.localActions[groupId];
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onNextExchange(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;

    // Increment exchange counter in group flags
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.exchange = (group.exchange || 1) + 1;
      await saveGroups(this.combat, groups);
    }

    // Use Foundry's -= deletion syntax to actually remove nested keys.
    // setFlag deep-merges, so `delete obj[key]` + setFlag doesn't remove the key.
    const flagPrefix = `flags.${FLAG_SCOPE}`;
    await this.combat.update({
      [`${flagPrefix}.${FLAG_REVEALED}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_READY}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_SCRIPTED}.-=${groupId}`]: null,
    });

    // Clear local actions for this group
    delete this.localActions[groupId];

    // Clear remote card counts for this group
    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }

    // Reset flip animation tracking so reveals animate again
    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }

    // Tell all clients to clear their local state for this group
    game.socket.emit(SOCKET_NAME, {
      type: "nextExchange",
      combatId: this.combat.id,
      groupId,
    });
    this.render(false);
  }

  // ---- Drag and Drop ----

  _onDragStart(event) {
    const actorId = event.currentTarget.dataset.actorId;
    event.originalEvent.dataTransfer.setData("text/plain", actorId);
    event.currentTarget.classList.add("dragging");
  }

  _onDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
  }

  _onDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  _onDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove("drag-over");
    }
  }

  _onDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    const actorId = event.originalEvent.dataTransfer.getData("text/plain");
    const groupId = event.currentTarget.dataset.groupId;
    if (!actorId || !groupId) return;
    this._addActorToGroup(actorId, groupId);
  }

  // ---- Action Scripting (Cards) ----

  _onBlankCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const actorId = el.dataset.actorId;
    const volleyIndex = parseInt(el.dataset.volley);

    // Only allow scripting for owned actors
    const actor = game.actors.get(actorId);
    if (!actor?.isOwner) return;

    this._showActionPicker(el, groupId, actorId, volleyIndex);
  }

  _onOwnedCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const actorId = el.dataset.actorId;
    const volleyIndex = parseInt(el.dataset.volley);
    const cardIndex = parseInt(el.dataset.cardIndex);

    // Remove the action
    const actor = game.actors.get(actorId);
    if (!actor?.isOwner) return;

    if (!this.localActions[groupId]?.[actorId]?.[volleyIndex]) return;
    this.localActions[groupId][actorId][volleyIndex].splice(cardIndex, 1);
    this._emitLocalActionCount(groupId, actorId, volleyIndex);
    this.render(false);
  }

  _showActionPicker(anchorEl, groupId, actorId, volleyIndex) {
    // Remove any existing picker
    document.querySelectorAll(".bw-action-picker").forEach(el => el.remove());

    const picker = document.createElement("div");
    picker.classList.add("bw-action-picker");

    for (const action of ACTIONS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action;
      btn.classList.add("action-pick-btn");
      btn.addEventListener("click", () => {
        this._scriptAction(groupId, actorId, volleyIndex, action);
        picker.remove();
      });
      picker.appendChild(btn);
    }

    // Position near the clicked element
    document.body.appendChild(picker);
    const rect = anchorEl.getBoundingClientRect();
    picker.style.position = "fixed";
    picker.style.left = `${rect.left}px`;
    picker.style.top = `${rect.bottom + 4}px`;
    picker.style.zIndex = "10000";

    // Close on outside click
    const closeHandler = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener("pointerdown", closeHandler, true);
      }
    };
    setTimeout(() => document.addEventListener("pointerdown", closeHandler, true), 0);
  }

  _scriptAction(groupId, actorId, volleyIndex, action) {
    if (!this.localActions[groupId]) this.localActions[groupId] = {};
    if (!this.localActions[groupId][actorId]) this.localActions[groupId][actorId] = [[], [], []];
    this.localActions[groupId][actorId][volleyIndex].push(action);
    this._emitLocalActionCount(groupId, actorId, volleyIndex);
    this.render(false);
  }

  // ---- Ready Flow ----

  async _onReadyClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const actorId = el.dataset.actorId;

    const actor = game.actors.get(actorId);
    if (!actor?.isOwner) return;

    const localGroupActions = this.localActions[groupId] || {};
    const actions = localGroupActions[actorId] || [[], [], []];

    // Stash actions locally so we can render locked cards while waiting for flags
    const key = `${groupId}-${actorId}`;
    this._pendingReadyLocal[key] = foundry.utils.duplicate(actions);

    // Clear local actions and re-render immediately to show locked state
    if (this.localActions[groupId]) {
      delete this.localActions[groupId][actorId];
    }
    this.render(false);

    if (game.user.isGM) {
      await this._saveReadyState(groupId, actorId, actions);
      delete this._pendingReadyLocal[key];
    } else {
      // Players can't write combat flags, so write to own user flags.
      // The GM picks this up via the updateUser hook.
      await game.user.setFlag(FLAG_SCOPE, "pendingReady", {
        combatId: this.combat.id,
        groupId,
        actorId,
        actions: foundry.utils.duplicate(actions),
        t: Date.now(),
      });
    }
  }

  async _saveReadyState(groupId, actorId, actions) {
    const ready = loadReady(this.combat);
    if (!ready[groupId]) ready[groupId] = {};
    ready[groupId][actorId] = true;
    await saveReady(this.combat, ready);

    const scripted = loadScripted(this.combat);
    if (!scripted[groupId]) scripted[groupId] = {};
    scripted[groupId][actorId] = foundry.utils.duplicate(actions);
    await saveScripted(this.combat, scripted);
  }

  // ---- Reveal Flow ----

  async _onRevealVolley(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;
    const volleyIndex = parseInt(event.currentTarget.dataset.volley);

    // Get all actors in this group so every actor gets a revealed entry
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Initialize collected with empty arrays for all actors in the group
    const collected = {};
    for (const actorId of (group.actorIds || [])) {
      collected[actorId] = [];
    }

    // Fill from scripted (ready) actors — already stored in flags
    const scriptedData = loadScripted(this.combat);
    const groupScripted = scriptedData[groupId] || {};
    for (const [actorId, volleys] of Object.entries(groupScripted)) {
      const actions = Array.isArray(volleys) ? volleys[volleyIndex] : [];
      if (actions && actions.length > 0) collected[actorId] = [...actions];
    }

    // Add GM's own local (non-ready) actions
    const gmGroupActions = this.localActions[groupId] || {};
    for (const [actorId, volleys] of Object.entries(gmGroupActions)) {
      if (collected[actorId]?.length > 0) continue; // Already have from scripted
      const actions = volleys[volleyIndex] || [];
      if (actions.length > 0) collected[actorId] = [...actions];
    }

    // Store pending collection for updateUser handler to fill
    const key = `${groupId}-${volleyIndex}`;
    this._pendingRevealResolvers[key] = { collected };

    // Request actions from players via combat flag (reliable, unlike sockets)
    await this.combat.setFlag(FLAG_SCOPE, "pendingReveal", {
      groupId,
      volleyIndex,
      t: Date.now(),
    });

    // Wait for player submissions via updateUser hook
    await new Promise(resolve => {
      this._pendingRevealResolvers[key].resolve = resolve;
      this._pendingRevealResolvers[key].timer = setTimeout(resolve, 3000);
    });

    delete this._pendingRevealResolvers[key];

    // Save revealed actions
    const revealed = loadRevealed(this.combat);
    if (!revealed[groupId]) revealed[groupId] = {};
    revealed[groupId][volleyIndex] = collected;
    await saveRevealed(this.combat, revealed);

    // Clear local actions for this volley
    if (this.localActions[groupId]) {
      for (const actorId of Object.keys(this.localActions[groupId])) {
        if (this.localActions[groupId][actorId]) {
          this.localActions[groupId][actorId][volleyIndex] = [];
        }
      }
    }

    // All clients (including GM) re-render via updateCombat hook triggered by saveRevealed.
    // Do NOT call this.render(false) here — it would cause a double render that kills
    // the flip animation (the first render from the hook adds flip-in and updates
    // _previouslyRevealed, then the second render replaces the DOM without flip-in).
  }

  // ---- Socket Handlers ----

  _handleSocket(data) {
    if (data.combatId !== this.combat.id) return;

    switch (data.type) {
      case "groupsUpdated":
        this.render(false);
        break;

      case "actionCount":
        this._handleActionCount(data);
        break;

      case "nextExchange":
        this._handleNextExchange(data);
        break;

      case "disadvantageChange":
        this._handleDisadvantageChange(data);
        break;
    }
  }

  _submitActionsForReveal({ groupId, volleyIndex }) {
    const readyData = loadReady(this.combat);
    const groupReady = readyData[groupId] || {};
    const groupActions = this.localActions[groupId] || {};
    const submission = {};
    for (const [actorId, volleys] of Object.entries(groupActions)) {
      if (groupReady[actorId]) continue; // Already submitted via ready
      const actions = volleys[volleyIndex] || [];
      if (actions.length > 0) submission[actorId] = [...actions];
    }

    if (Object.keys(submission).length > 0) {
      game.user.setFlag(FLAG_SCOPE, "pendingRevealSubmission", {
        combatId: this.combat.id,
        groupId,
        volleyIndex,
        actions: submission,
        t: Date.now(),
      });
    }

    // Clear local actions for this volley since they're being revealed
    if (this.localActions[groupId]) {
      for (const actorId of Object.keys(this.localActions[groupId])) {
        if (this.localActions[groupId][actorId]) {
          this.localActions[groupId][actorId][volleyIndex] = [];
        }
      }
    }
  }

  // Notify other clients about how many cards an actor has scripted (for face-down display)
  _emitLocalActionCount(groupId, actorId, volleyIndex) {
    const count = this.localActions[groupId]?.[actorId]?.[volleyIndex]?.length || 0;
    game.socket.emit(SOCKET_NAME, {
      type: "actionCount",
      combatId: this.combat.id,
      groupId,
      actorId,
      volleyIndex,
      count,
      userId: game.user.id,
    });
  }

  _handleActionCount(data) {
    // Update remote card counts for face-down display
    if (data.userId === game.user.id) return;
    const actor = game.actors.get(data.actorId);
    if (actor?.isOwner) return; // We own this actor, ignore remote counts

    if (!this._remoteCardCounts) this._remoteCardCounts = {};
    const key = `${data.groupId}-${data.actorId}-${data.volleyIndex}`;
    this._remoteCardCounts[key] = data.count;
    this.render(false);
  }

  async _handleDisadvantageChange(data) {
    const { groupId, actorId, value } = data;

    // Store locally for immediate display on all clients
    this._localDisadvantage[`${groupId}-${actorId}`] = value;

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.actorDisadvantage) group.actorDisadvantage = {};
        group.actorDisadvantage[actorId] = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  _handleNextExchange(data) {
    const { groupId } = data;
    // Clear local actions for this group
    delete this.localActions[groupId];
    // Clear remote card counts for this group
    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }
    // Reset flip animation tracking so reveals animate again
    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }
    // Defer render slightly so flag sync from updateCombat arrives first
    setTimeout(() => this.render(false), 500);
  }

  _getRemoteCardCount(groupId, actorId, volleyIndex) {
    if (!this._remoteCardCounts) return 0;
    return this._remoteCardCounts[`${groupId}-${actorId}-${volleyIndex}`] || 0;
  }

  _applyRemoteCardCounts(data) {
    for (const group of data.groups) {
      for (const actor of group.actors) {
        for (const volley of actor.volleys) {
          if (!volley.isRevealed && !actor.isOwner) {
            const remoteCount = this._getRemoteCardCount(group.id, actor.actorId, volley.volleyIndex);
            if (remoteCount > 0) {
              volley.cards = Array.from({ length: remoteCount }, () => ({
                action: "",
                state: "hidden",
                isHidden: true,
              }));
            }
          }
        }
      }
    }
    return data;
  }

  // ---- Socket Emitters ----

  _emitGroupsUpdated() {
    game.socket.emit(SOCKET_NAME, {
      type: "groupsUpdated",
      combatId: this.combat.id,
    });
  }
}

// ---- Global Dialog Registry ----

function findFightDialog(combatId) {
  return Object.values(ui.windows).find(w => w.id === `bw-fight-${combatId}`);
}

// ---- Hooks ----

Hooks.once("ready", () => {
  game.socket.on(SOCKET_NAME, (data) => {
    if (!data.combatId) return;
    const dialog = findFightDialog(data.combatId);
    if (dialog) dialog._handleSocket(data);
  });
});

// Re-render dialog when combat flags change (ensures revealed data syncs to all clients)
Hooks.on("updateCombat", (combat, change) => {

  console.log("Combat updated", combat.id, change);

  if (!change?.flags?.[FLAG_SCOPE]) return;

  // If showDialog flag changed, open the dialog for non-GM clients
  if (change.flags[FLAG_SCOPE].showDialog && !game.user.isGM) {
    const existing = findFightDialog(combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      new FightDialog(combat).render(true);
    }
    return;
  }

  // If pendingReveal flag changed, players submit their local actions
  if (change.flags[FLAG_SCOPE].pendingReveal && !game.user.isGM) {
    const dialog = findFightDialog(combat.id);
    if (dialog) dialog._submitActionsForReveal(change.flags[FLAG_SCOPE].pendingReveal);
  }

  const dialog = findFightDialog(combat.id);
  if (dialog) dialog.render(false);
});

// GM picks up player ready requests and reveal submissions written to user flags.
// Read directly from the user document rather than relying on the change diff,
// since Foundry may deliver the diff in dot-notation or nested form.
Hooks.on("updateUser", (user, change) => {
  if (!game.user.isGM) return;
  if (user.id === game.user.id) return; // Ignore GM's own user updates

  // Check if bw-fight flags were part of this update
  const hasBwFightChange = change?.flags?.[FLAG_SCOPE]
    || Object.keys(change).some(k => k.startsWith(`flags.${FLAG_SCOPE}`));
  if (!hasBwFightChange) return;

  const pendingReady = user.getFlag(FLAG_SCOPE, "pendingReady");
  if (pendingReady) {
    const { combatId, groupId, actorId, actions } = pendingReady;
    const combat = game.combats.get(combatId);
    if (combat) {
      const ready = loadReady(combat);
      if (!ready[groupId]) ready[groupId] = {};
      ready[groupId][actorId] = true;
      saveReady(combat, ready).then(() => {
        const scripted = loadScripted(combat);
        if (!scripted[groupId]) scripted[groupId] = {};
        scripted[groupId][actorId] = foundry.utils.duplicate(actions);
        return saveScripted(combat, scripted);
      });
    }
  }

  const pendingRevealSubmission = user.getFlag(FLAG_SCOPE, "pendingRevealSubmission");
  if (pendingRevealSubmission) {
    const { combatId, groupId, volleyIndex, actions } = pendingRevealSubmission;
    const dialog = findFightDialog(combatId);
    if (dialog) {
      const key = `${groupId}-${volleyIndex}`;
      const pending = dialog._pendingRevealResolvers[key];
      if (pending) {
        for (const [actorId, actorActions] of Object.entries(actions)) {
          if (!pending.collected[actorId]?.length) {
            pending.collected[actorId] = actorActions;
          }
        }
      }
    }
  }

  const pendingDisadvantage = user.getFlag(FLAG_SCOPE, "pendingDisadvantage");
  if (pendingDisadvantage) {
    const { combatId, groupId, actorId, value } = pendingDisadvantage;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.actorDisadvantage) group.actorDisadvantage = {};
        group.actorDisadvantage[actorId] = value;
        saveGroups(combat, groups);
      }
    }
  }
});

// Re-render dialog when actor data changes (e.g. wound penalties)
Hooks.on("updateActor", () => {
  for (const win of Object.values(ui.windows)) {
    if (win instanceof FightDialog) win.render(false);
  }
});

Hooks.on("renderCombatTracker", (app, html, data) => {
  if (!game.combat) return;

  html.find(".bw-fight-btn").remove();

  const button = $(`<a class="combat-button bw-fight-btn" title="Fight!"><i class="fas fa-fist-raised"></i> Fight!</a>`);
  button.on("click", () => {
    const existing = findFightDialog(game.combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      new FightDialog(game.combat).render(true);
    }
  });

  const controls = html.find(".encounter-controls");
  if (controls.length) {
    controls.after(button);
  }
});
