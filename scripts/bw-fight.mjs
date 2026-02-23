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
        const isReady = !!groupReady[actorId];
        const localGroupActions = this.localActions[group.id] || {};
        const localActorActions = localGroupActions[actorId] || [[], [], []];
        const scriptedActions = groupScripted[actorId] || [[], [], []];

        const volleys = [0, 1, 2].map(vi => {
          const volleyRevealed = groupRevealed[vi];
          if (volleyRevealed && volleyRevealed[actorId]) {
            return {
              volleyIndex: vi,
              cards: volleyRevealed[actorId].map(a => ({
                action: a,
                state: "revealed",
                isHidden: false,
              })),
              canScript: false,
              isRevealed: true,
            };
          }

          // If actor is ready, show locked cards
          if (isReady) {
            const readyCards = scriptedActions[vi] || [];
            if (isOwner) {
              // Owner sees their own locked actions
              return {
                volleyIndex: vi,
                cards: readyCards.map(a => ({ action: a, state: "locked", isHidden: false })),
                canScript: false,
                isRevealed: false,
              };
            }
            // Others see face-down cards for the ready count
            return {
              volleyIndex: vi,
              cards: readyCards.map(() => ({ action: "", state: "hidden", isHidden: true })),
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

        return {
          actorId,
          name: actor?.name ?? "Unknown",
          img: actor?.img ?? "icons/svg/mystery-man.svg",
          isOwner,
          isReady,
          volleys,
        };
      });

      const advantageOptions = (group.actorIds || []).map(actorId => {
        const actor = game.actors.get(actorId);
        return {
          actorId,
          name: actor?.name ?? "Unknown",
          selected: actorId === group.advantageActorId,
        };
      });

      const disadvantageOptions = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        label: `+${i + 1}Ob`,
        selected: (i + 1) === group.disadvantage,
      }));

      // Check which volleys are revealed for this group
      const volleyRevealed = [0, 1, 2].map(vi => !!groupRevealed[vi]);

      return {
        id: group.id,
        name: group.name,
        actors,
        hasActors: actors.length > 0,
        advantageOptions,
        disadvantageOptions,
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
      html.find(".advantage-select").on("change", this._onAdvantageChange.bind(this));
      html.find(".disadvantage-select").on("change", this._onDisadvantageChange.bind(this));
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

    // All users can click action cards and ready button
    html.find(".action-card.blank").on("click", this._onBlankCardClick.bind(this));
    html.find(".action-card.owned").on("click", this._onOwnedCardClick.bind(this));
    html.find(".ready-btn").on("click", this._onReadyClick.bind(this));
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
      advantageActorId: null,
      disadvantage: 1,
      actorIds: [],
      exchange: 1,
    });
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onAdvantageChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const actorId = event.currentTarget.value;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.advantageActorId = actorId || null;
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
    }
  }

  async _onDisadvantageChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const value = parseInt(event.currentTarget.value);
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.disadvantage = value;
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
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
      if (group.advantageActorId === actorId) group.advantageActorId = null;
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

  _onReadyClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const actorId = el.dataset.actorId;

    const actor = game.actors.get(actorId);
    if (!actor?.isOwner) return;

    const localGroupActions = this.localActions[groupId] || {};
    const actions = localGroupActions[actorId] || [[], [], []];

    if (game.user.isGM) {
      this._saveReadyState(groupId, actorId, actions).then(() => {});
    } else {
      // Players can't write combat flags, so write to own user flags.
      // The GM picks this up via the updateUser hook.
      game.user.setFlag(FLAG_SCOPE, "pendingReady", {
        combatId: this.combat.id,
        groupId,
        actorId,
        actions: foundry.utils.duplicate(actions),
        t: Date.now(),
      });
    }

    // Clear local actions since they're now stored server-side
    if (this.localActions[groupId]) {
      delete this.localActions[groupId][actorId];
    }
    this.render(false);
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

    // Request actions from non-ready players
    game.socket.emit(SOCKET_NAME, {
      type: "requestReveal",
      combatId: this.combat.id,
      groupId,
      volleyIndex,
    });

    // Wait for client submissions
    await new Promise(resolve => {
      this._pendingRevealResolvers[`${groupId}-${volleyIndex}`] = {
        collected,
        resolve,
        timer: setTimeout(resolve, 3000),
      };
    });

    delete this._pendingRevealResolvers[`${groupId}-${volleyIndex}`];

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

    // GM re-renders immediately; other clients re-render via updateCombat hook
    this.render(false);
  }

  // ---- Socket Handlers ----

  _handleSocket(data) {
    if (data.combatId !== this.combat.id) return;

    switch (data.type) {
      case "groupsUpdated":
        this.render(false);
        break;

      case "requestReveal":
        this._handleRevealRequest(data);
        break;

      case "submitActions":
        this._handleSubmitActions(data);
        break;

      case "actionCount":
        this._handleActionCount(data);
        break;

      case "nextExchange":
        this._handleNextExchange(data);
        break;
    }
  }

  _handleRevealRequest(data) {
    if (game.user.isGM) return; // GM handles its own
    const { groupId, volleyIndex } = data;
    const readyData = loadReady(this.combat);
    const groupReady = readyData[groupId] || {};
    const groupActions = this.localActions[groupId] || {};
    const submission = {};
    for (const [actorId, volleys] of Object.entries(groupActions)) {
      if (groupReady[actorId]) continue; // Already submitted via ready
      const actions = volleys[volleyIndex] || [];
      if (actions.length > 0) submission[actorId] = [...actions];
    }

    game.socket.emit(SOCKET_NAME, {
      type: "submitActions",
      combatId: this.combat.id,
      groupId,
      volleyIndex,
      actions: submission,
      userId: game.user.id,
    });

    // Clear local actions for this volley since they're being revealed
    if (this.localActions[groupId]) {
      for (const actorId of Object.keys(this.localActions[groupId])) {
        if (this.localActions[groupId][actorId]) {
          this.localActions[groupId][actorId][volleyIndex] = [];
        }
      }
    }
  }

  _handleSubmitActions(data) {
    if (!game.user.isGM) return; // Only GM collects
    const key = `${data.groupId}-${data.volleyIndex}`;
    const pending = this._pendingRevealResolvers[key];
    if (!pending) return;

    for (const [actorId, actions] of Object.entries(data.actions)) {
      if (!pending.collected[actorId]?.length) {
        pending.collected[actorId] = actions;
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

  const dialog = findFightDialog(combat.id);
  if (dialog) dialog.render(false);
});

// GM picks up player ready requests written to user flags
Hooks.on("updateUser", (user, change) => {
  if (!game.user.isGM) return;
  const pending = change?.flags?.[FLAG_SCOPE]?.pendingReady;
  if (!pending) return;

  const { combatId, groupId, actorId, actions } = pending;
  const combat = game.combats.get(combatId);
  if (!combat) return;

  const dialog = findFightDialog(combatId);
  if (dialog) {
    dialog._saveReadyState(groupId, actorId, actions);
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
