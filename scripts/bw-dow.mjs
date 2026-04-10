const SOCKET_NAME = "module.bw-fight";
const FLAG_SCOPE = "bw-fight";
const FLAG_GROUPS = "dow-groups";
const FLAG_REVEALED = "dow-revealed";
const FLAG_READY = "dow-ready";
const FLAG_SCRIPTED = "dow-scripted";

const DOW_ACTIONS = [
  { name: "Point",
    description: "**Test:** Point tests your appropriate social skill.\n\n**Effect:** Successes over the obstacle are used to reduce your opponent's body of argument." },
  { name: "Dismiss",
    description: "**Test:** Dismiss tests your Will.\n\n**Effect:** A successful Dismiss allows you to ignore your opponent's argument and recover lost points to your body of argument." },
];

function getDowActionData(name) {
  return DOW_ACTIONS.find(a => a.name === name);
}

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

// ---- DowDialog Registry ----
const _dowDialogs = new Map();

// ---- DowDialog ----

class DowDialog extends Application {
  constructor(combat, options = {}) {
    super(options);
    this.combat = combat;
    _dowDialogs.set(combat.id, this);
    // Local (unrevealed) actions: { [groupId]: { [combatantId]: [[], [], []] } }
    this.localActions = {};
    // Tracks combatants whose Ready has been sent but not yet saved to combat flags.
    this._pendingReadyLocal = {};
    // Tracks which group-volley combos have been revealed, for flip animation.
    this._previouslyRevealed = new Set();
    const existingRevealed = loadRevealed(combat);
    for (const [groupId, volleys] of Object.entries(existingRevealed)) {
      for (const vi of Object.keys(volleys)) {
        this._previouslyRevealed.add(`${groupId}-${vi}`);
      }
    }
    // Pending reveal callbacks
    this._pendingRevealResolvers = {};
    // Local BoA overrides received via socket before flags sync
    this._localBoa = {};
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/bw-fight/templates/dow-dialog.hbs",
      classes: ["bw-dow-dialog"],
      width: 620,
      height: 600,
      resizable: true,
      title: "Duel of Wits",
    });
  }

  get id() {
    return `bw-dow-${this.combat.id}`;
  }

  async close(...args) {
    _dowDialogs.delete(this.combat.id);
    return super.close(...args);
  }

  async _ensureDefaultGroups() {
    const groups = loadGroups(this.combat);
    if (groups.length < 2 && game.user.isGM) {
      while (groups.length < 2) {
        groups.push({
          id: foundry.utils.randomID(),
          name: `Side ${groups.length + 1}`,
          combatantIds: [],
          exchange: 1,
        });
      }
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

    const assignedSet = new Set();
    for (const group of groups) {
      for (const id of (group.combatantIds || [])) assignedSet.add(id);
    }

    const allCombatants = this.combat.combatants.map(c => {
      const actor = c.actor;
      const tokenDoc = c.token;
      return {
        combatantId: c.id,
        name: tokenDoc?.name ?? actor?.name ?? "Unknown",
        img: tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? actor?.img ?? "icons/svg/mystery-man.svg",
        assigned: assignedSet.has(c.id),
      };
    });

    const groupsData = groups.map(group => {
      const groupRevealed = revealed[group.id] || {};
      const groupReady = !!ready[group.id];
      const groupScripted = scripted[group.id] || [[], [], []];
      const pendingReadyActions = this._pendingReadyLocal[group.id];
      const isReady = groupReady || !!pendingReadyActions;

      // Clear pendingReadyLocal once flags have caught up
      if (groupReady && pendingReadyActions) {
        delete this._pendingReadyLocal[group.id];
      }

      // Determine if current user can script for this group
      // (GM or owner of any combatant in the group)
      const isGroupOwner = isGM || (group.combatantIds || []).some(cid => {
        const c = this.combat.combatants.get(cid);
        return c?.isOwner;
      });

      const actors = (group.combatantIds || []).map(combatantId => {
        const combatant = this.combat.combatants.get(combatantId);
        const actor = combatant?.actor;
        const tokenDoc = combatant?.token;
        return {
          combatantId,
          name: tokenDoc?.name ?? actor?.name ?? "Unknown",
          img: tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? actor?.img ?? "icons/svg/mystery-man.svg",
        };
      });

      // Build group-level volley data
      const localGroupActions = this.localActions[group.id] || [[], [], []];
      const volleyRevealed = [0, 1, 2].map(vi => !!groupRevealed[vi]);

      const volleys = [0, 1, 2].map(vi => {
        const revealedData = groupRevealed[vi];
        if (revealedData) {
          const action = revealedData.action || "No Action";
          const ad = getDowActionData(action);
          return {
            volleyIndex: vi,
            cards: [{
              action,
              subtext: ad?.subtext || null,
              description: ad?.description || null,
              state: "revealed",
              isHidden: false,
            }],
            canScript: false,
            isRevealed: true,
          };
        }

        if (isReady) {
          return {
            volleyIndex: vi,
            cards: [{ action: "", state: "hidden", isHidden: true }],
            canScript: false,
            isRevealed: false,
          };
        }

        const localCards = localGroupActions[vi] || [];
        if (isGroupOwner) {
          return {
            volleyIndex: vi,
            cards: localCards.map(a => {
              const ad = getDowActionData(a);
              return {
                action: a,
                subtext: ad?.subtext || null,
                description: ad?.description || null,
                state: "owned",
                isHidden: false,
              };
            }),
            canScript: localCards.length === 0,
            isRevealed: false,
          };
        }
        // Other side — show face-down cards
        return {
          volleyIndex: vi,
          cards: localCards.length > 0
            ? [{ action: "", state: "hidden", isHidden: true }]
            : [],
          canScript: false,
          isRevealed: false,
        };
      });

      const boaKey = `${group.id}`;
      const boaLocal = this._localBoa?.[boaKey];
      const boaFlag = (group.boa != null) ? group.boa : 0;
      const boa = boaLocal ?? boaFlag;
      if (boaLocal != null && boaFlag === boaLocal) {
        delete this._localBoa?.[boaKey];
      }

      return {
        id: group.id,
        name: group.name,
        actors,
        hasActors: actors.length > 0,
        volleys,
        volleyRevealed,
        isReady,
        canReady: isGroupOwner && !isReady,
        exchange: group.exchange || 1,
        boa,
      };
    });

    const terms = this.combat.getFlag(FLAG_SCOPE, "dow-terms") || "";

    const data = {
      allCombatants,
      groups: groupsData,
      hasGroups: groupsData.length > 0,
      isGM,
      terms,
    };
    return this._applyRemoteCardCounts(data);
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (game.user.isGM) {
      html.find(".show-to-players").on("click", this._onShowToPlayers.bind(this));
      html.find(".reset-fight").on("click", this._onResetFight.bind(this));
      html.find(".remove-from-group").on("click", this._onRemoveFromGroup.bind(this));
      html.find(".move-actor-up").on("click", this._onMoveActorUp.bind(this));
      html.find(".move-actor-down").on("click", this._onMoveActorDown.bind(this));
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
          const combatantId = event.originalEvent.dataTransfer.getData("text/plain");
          const groupId = groupEl.dataset.groupId;
          if (!combatantId || !groupId) return;
          this._addCombatantToGroup(combatantId, groupId);
        }
      });
    }

    // Double-click actor image to open character sheet
    html.find(".volley-grid .actor-thumb").on("dblclick", (event) => {
      const combatantId = event.currentTarget.closest("tr").querySelector("[data-combatant-id]")?.dataset.combatantId;
      const combatant = this.combat.combatants.get(combatantId);
      if (combatant?.actor) combatant.actor.sheet.render(true);
    });

    // All users can edit terms, BoA, click action cards, and ready button
    html.find(".dow-terms-input").on("change", this._onTermsChange.bind(this));
    html.find(".dow-boa-input").on("change", this._onBoaChange.bind(this));
    html.find(".dow-boa-inc").on("click", this._onBoaInc.bind(this));
    html.find(".dow-boa-dec").on("click", this._onBoaDec.bind(this));
    html.find(".action-card.blank").on("click", this._onBlankCardClick.bind(this));
    html.find(".action-card.owned").on("click", this._onOwnedCardClick.bind(this));
    html.find(".card-chat-btn").on("click", this._onChatIconClick.bind(this));
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

    const newlyRevealed = new Set();
    for (const key of currentRevealed) {
      if (!this._previouslyRevealed.has(key)) {
        newlyRevealed.add(key);
      }
    }

    if (newlyRevealed.size > 0) {
      html.find(".action-card.revealed").each((_, el) => {
        const groupId = el.dataset.groupId;
        const volley = el.dataset.volley;
        if (newlyRevealed.has(`${groupId}-${volley}`)) {
          el.classList.add("flip-in");
        }
      });
    }

    this._previouslyRevealed = currentRevealed;
  }

  async _onShowToPlayers() {
    await this.combat.setFlag(FLAG_SCOPE, "dow-showDialog", Date.now());
  }

  async _onTermsChange(event) {
    const value = event.currentTarget.value;
    if (game.user.isGM) {
      await this.combat.setFlag(FLAG_SCOPE, "dow-terms", value);
    } else {
      await game.user.setFlag(FLAG_SCOPE, "dow-pendingTerms", {
        combatId: this.combat.id,
        value,
        t: Date.now(),
      });
    }
  }

  async _onBoaChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const value = Math.max(0, parseInt(event.currentTarget.value) || 0);
    await this._setBoa(groupId, value);
  }

  async _onBoaInc(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    const current = this._localBoa?.[groupId] ?? group?.boa ?? 0;
    await this._setBoa(groupId, current + 1);
  }

  async _onBoaDec(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    const current = this._localBoa?.[groupId] ?? group?.boa ?? 0;
    await this._setBoa(groupId, Math.max(0, current - 1));
  }

  async _setBoa(groupId, value) {
    // Immediate local update
    this._localBoa[groupId] = value;

    // Broadcast for instant display on other clients
    game.socket.emit(SOCKET_NAME, {
      type: "dow-boaChange",
      combatId: this.combat.id,
      groupId,
      value,
    });

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.boa = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      await game.user.setFlag(FLAG_SCOPE, "dow-pendingBoa", {
        combatId: this.combat.id,
        groupId,
        value,
        t: Date.now(),
      });
    }
    this.render(false);
  }

  async _onResetFight() {
    if (!game.user.isGM) return;
    const confirm = await Dialog.confirm({
      title: "Reset Duel of Wits",
      content: "<p>Reset the entire Duel of Wits? All sides, scripted actions and revealed data will be lost.</p>",
    });
    if (!confirm) return;

    const flagPrefix = `flags.${FLAG_SCOPE}`;
    await this.combat.update({
      [`${flagPrefix}.-=${FLAG_GROUPS}`]: null,
      [`${flagPrefix}.-=${FLAG_REVEALED}`]: null,
      [`${flagPrefix}.-=${FLAG_READY}`]: null,
      [`${flagPrefix}.-=${FLAG_SCRIPTED}`]: null,
    });

    this.localActions = {};
    this._pendingReadyLocal = {};
    this._localBoa = {};
    this._previouslyRevealed = new Set();
    this._pendingRevealResolvers = {};
    if (this._remoteCardCounts) this._remoteCardCounts = {};

    const groups = [
      { id: foundry.utils.randomID(), name: "Side 1", combatantIds: [], exchange: 1 },
      { id: foundry.utils.randomID(), name: "Side 2", combatantIds: [], exchange: 1 },
    ];
    await saveGroups(this.combat, groups);

    this._emitGroupsUpdated();
    this.render(false);
  }

  // ---- GM Group Management ----

  async _addCombatantToGroup(combatantId, groupId) {
    const groups = loadGroups(this.combat);
    const alreadyAssigned = groups.some(g => (g.combatantIds || []).includes(combatantId));
    if (alreadyAssigned) return;

    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.combatantIds.push(combatantId);
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onRemoveFromGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const combatant = this.combat.combatants.get(combatantId);
    const name = combatant?.token?.name ?? combatant?.actor?.name ?? "this combatant";
    const confirm = await Dialog.confirm({
      title: "Remove Combatant",
      content: `<p>Remove <strong>${name}</strong> from the group?</p>`,
    });
    if (!confirm) return;

    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.combatantIds = group.combatantIds.filter(id => id !== combatantId);
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onMoveActorUp(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const idx = group.combatantIds.indexOf(combatantId);
    if (idx <= 0) return;
    [group.combatantIds[idx - 1], group.combatantIds[idx]] = [group.combatantIds[idx], group.combatantIds[idx - 1]];
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onMoveActorDown(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const idx = group.combatantIds.indexOf(combatantId);
    if (idx < 0 || idx >= group.combatantIds.length - 1) return;
    [group.combatantIds[idx], group.combatantIds[idx + 1]] = [group.combatantIds[idx + 1], group.combatantIds[idx]];
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onNextExchange(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;

    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.exchange = (group.exchange || 1) + 1;
      await saveGroups(this.combat, groups);
    }

    const flagPrefix = `flags.${FLAG_SCOPE}`;
    await this.combat.update({
      [`${flagPrefix}.${FLAG_REVEALED}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_READY}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_SCRIPTED}.-=${groupId}`]: null,
    });

    delete this.localActions[groupId];

    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }

    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }

    game.socket.emit(SOCKET_NAME, {
      type: "dow-nextExchange",
      combatId: this.combat.id,
      groupId,
    });
    this.render(false);
  }

  // ---- Drag and Drop ----

  _onDragStart(event) {
    const combatantId = event.currentTarget.dataset.combatantId;
    event.originalEvent.dataTransfer.setData("text/plain", combatantId);
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
    const combatantId = event.originalEvent.dataTransfer.getData("text/plain");
    const groupId = event.currentTarget.dataset.groupId;
    if (!combatantId || !groupId) return;
    this._addCombatantToGroup(combatantId, groupId);
  }

  // ---- Action Scripting (Cards) ----

  _onBlankCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const volleyIndex = parseInt(el.dataset.volley);

    this._showActionPicker(el, groupId, volleyIndex);
  }

  _onOwnedCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const volleyIndex = parseInt(el.dataset.volley);

    if (!this.localActions[groupId]?.[volleyIndex]) return;
    this.localActions[groupId][volleyIndex] = [];
    this._emitLocalActionCount(groupId, volleyIndex);
    this.render(false);
  }

  _onChatIconClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const card = event.currentTarget.closest(".action-card");
    if (!card) return;
    const actionName = card.querySelector(".card-label")?.textContent?.trim();
    if (!actionName) return;

    const actionData = getDowActionData(actionName);
    let content = `<div style="text-align:left"><strong>${actionName}</strong>`;
    if (actionData?.subtext) content += ` <em>(${actionData.subtext})</em>`;
    if (actionData?.description) {
      const descHtml = actionData.description
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
      content += `<hr>${descHtml}`;
    }
    content += `</div>`;

    ChatMessage.create({ content });
  }

  _showActionPicker(anchorEl, groupId, volleyIndex) {
    const doc = anchorEl.ownerDocument;

    doc.querySelectorAll(".bw-action-picker").forEach(el => el.remove());

    const picker = doc.createElement("div");
    picker.classList.add("bw-action-picker");

    for (const action of DOW_ACTIONS) {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.textContent = action.subtext ? `${action.name} (${action.subtext})` : action.name;
      btn.classList.add("action-pick-btn");
      if (action.description) btn.title = action.description;
      btn.addEventListener("click", () => {
        this._scriptAction(groupId, volleyIndex, action.name);
        picker.remove();
      });
      picker.appendChild(btn);
    }

    doc.body.appendChild(picker);
    const rect = anchorEl.getBoundingClientRect();
    picker.style.position = "fixed";
    picker.style.left = `${rect.left}px`;
    picker.style.top = `${rect.bottom + 4}px`;
    picker.style.zIndex = "10000";

    const closeHandler = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        doc.removeEventListener("pointerdown", closeHandler, true);
      }
    };
    setTimeout(() => doc.addEventListener("pointerdown", closeHandler, true), 0);
  }

  _scriptAction(groupId, volleyIndex, action) {
    if (!this.localActions[groupId]) this.localActions[groupId] = [[], [], []];
    // Single action per volley — replace instead of append
    this.localActions[groupId][volleyIndex] = [action];
    this._emitLocalActionCount(groupId, volleyIndex);
    this.render(false);
  }

  // ---- Ready Flow ----

  async _onReadyClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;

    const actions = this.localActions[groupId] || [[], [], []];

    this._pendingReadyLocal[groupId] = foundry.utils.duplicate(actions);
    delete this.localActions[groupId];
    this.render(false);

    if (game.user.isGM) {
      await this._saveReadyState(groupId, actions);
      delete this._pendingReadyLocal[groupId];
    } else {
      await game.user.setFlag(FLAG_SCOPE, "dow-pendingReady", {
        combatId: this.combat.id,
        groupId,
        actions: foundry.utils.duplicate(actions),
        t: Date.now(),
      });
    }
  }

  async _saveReadyState(groupId, actions) {
    const ready = loadReady(this.combat);
    ready[groupId] = true;
    await saveReady(this.combat, ready);

    const scripted = loadScripted(this.combat);
    scripted[groupId] = foundry.utils.duplicate(actions);
    await saveScripted(this.combat, scripted);
  }

  // ---- Reveal Flow ----

  async _onRevealVolley(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;
    const volleyIndex = parseInt(event.currentTarget.dataset.volley);

    // Check scripted (ready) actions first
    const scriptedData = loadScripted(this.combat);
    const groupScripted = scriptedData[groupId] || [[], [], []];
    let action = (groupScripted[volleyIndex] || [])[0] || null;

    // Fall back to GM's local actions
    if (!action) {
      const gmGroupActions = this.localActions[groupId] || [[], [], []];
      action = (gmGroupActions[volleyIndex] || [])[0] || null;
    }

    // Check if a non-GM player owns this group and hasn't readied
    const readyData = loadReady(this.combat);
    const groupReady = readyData[groupId];
    if (!action && !groupReady) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      const needsPlayerInput = (group?.combatantIds || []).some(cid => {
        const c = this.combat.combatants.get(cid);
        return c && !c.isOwner;
      });

      if (needsPlayerInput) {
        const key = `${groupId}-${volleyIndex}`;
        this._pendingRevealResolvers[key] = { action: null };

        await this.combat.setFlag(FLAG_SCOPE, "dow-pendingReveal", {
          groupId,
          volleyIndex,
          t: Date.now(),
        });

        await new Promise(resolve => {
          this._pendingRevealResolvers[key].resolve = resolve;
          this._pendingRevealResolvers[key].timer = setTimeout(resolve, 30);
        });

        action = this._pendingRevealResolvers[key].action;
        delete this._pendingRevealResolvers[key];
      }
    }

    // Save revealed action
    const revealed = loadRevealed(this.combat);
    if (!revealed[groupId]) revealed[groupId] = {};
    revealed[groupId][volleyIndex] = { action: action || "No Action" };
    await saveRevealed(this.combat, revealed);

    // Clear local actions for this volley
    if (this.localActions[groupId]) {
      this.localActions[groupId][volleyIndex] = [];
    }
  }

  // ---- Socket Handlers ----

  _handleSocket(data) {
    if (data.combatId !== this.combat.id) return;

    switch (data.type) {
      case "dow-groupsUpdated":
        this.render(false);
        break;

      case "dow-actionCount":
        this._handleActionCount(data);
        break;

      case "dow-nextExchange":
        this._handleNextExchange(data);
        break;

      case "dow-boaChange":
        this._handleBoaChange(data);
        break;
    }
  }

  async _handleBoaChange(data) {
    const { groupId, value } = data;
    this._localBoa[groupId] = value;

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.boa = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  _submitActionsForReveal({ groupId, volleyIndex }) {
    const readyData = loadReady(this.combat);
    if (readyData[groupId]) return; // Already submitted via ready
    const groupActions = this.localActions[groupId] || [[], [], []];
    const action = (groupActions[volleyIndex] || [])[0] || null;

    if (action) {
      game.user.setFlag(FLAG_SCOPE, "dow-pendingRevealSubmission", {
        combatId: this.combat.id,
        groupId,
        volleyIndex,
        action,
        t: Date.now(),
      });
    }

    if (this.localActions[groupId]) {
      this.localActions[groupId][volleyIndex] = [];
    }
  }

  _emitLocalActionCount(groupId, volleyIndex) {
    const count = this.localActions[groupId]?.[volleyIndex]?.length || 0;
    game.socket.emit(SOCKET_NAME, {
      type: "dow-actionCount",
      combatId: this.combat.id,
      groupId,
      volleyIndex,
      count,
      userId: game.user.id,
    });
  }

  _handleActionCount(data) {
    if (data.userId === game.user.id) return;

    if (!this._remoteCardCounts) this._remoteCardCounts = {};
    const key = `${data.groupId}-${data.volleyIndex}`;
    this._remoteCardCounts[key] = data.count;
    this.render(false);
  }

  _handleNextExchange(data) {
    const { groupId } = data;
    delete this.localActions[groupId];
    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }
    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }
    setTimeout(() => this.render(false), 500);
  }

  _getRemoteCardCount(groupId, volleyIndex) {
    if (!this._remoteCardCounts) return 0;
    return this._remoteCardCounts[`${groupId}-${volleyIndex}`] || 0;
  }

  _applyRemoteCardCounts(data) {
    for (const group of data.groups) {
      for (const volley of group.volleys) {
        if (!volley.isRevealed && !group.canReady && !group.isReady) {
          const remoteCount = this._getRemoteCardCount(group.id, volley.volleyIndex);
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
    return data;
  }

  // ---- Socket Emitters ----

  _emitGroupsUpdated() {
    game.socket.emit(SOCKET_NAME, {
      type: "dow-groupsUpdated",
      combatId: this.combat.id,
    });
  }
}

// ---- Global Dialog Registry ----

function findDowDialog(combatId) {
  return _dowDialogs.get(combatId) ?? null;
}

// ---- Hooks ----

Hooks.once("ready", () => {
  game.socket.on(SOCKET_NAME, (data) => {
    if (!data.combatId) return;
    if (!data.type?.startsWith("dow-")) return;
    const dialog = findDowDialog(data.combatId);
    if (dialog) dialog._handleSocket(data);
  });
});

Hooks.on("updateCombat", (combat, change) => {
  if (!change?.flags?.[FLAG_SCOPE]) return;

  if (change.flags[FLAG_SCOPE]["dow-showDialog"] && !game.user.isGM) {
    const existing = findDowDialog(combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      // Groups should already exist since GM created them
      new DowDialog(combat).render(true);
    }
    return;
  }

  if (change.flags[FLAG_SCOPE]["dow-pendingReveal"] && !game.user.isGM) {
    const dialog = findDowDialog(combat.id);
    if (dialog) dialog._submitActionsForReveal(change.flags[FLAG_SCOPE]["dow-pendingReveal"]);
  }

  const dialog = findDowDialog(combat.id);
  if (dialog) dialog.render(false);
});

Hooks.on("updateUser", (user, change) => {
  if (!game.user.isGM) return;
  if (user.id === game.user.id) return;

  const hasBwDowChange = change?.flags?.[FLAG_SCOPE]
    || Object.keys(change).some(k => k.startsWith(`flags.${FLAG_SCOPE}`));
  if (!hasBwDowChange) return;

  const pendingReady = user.getFlag(FLAG_SCOPE, "dow-pendingReady");
  if (pendingReady) {
    const { combatId, groupId, actions } = pendingReady;
    const combat = game.combats.get(combatId);
    if (combat) {
      const ready = loadReady(combat);
      ready[groupId] = true;
      saveReady(combat, ready).then(() => {
        const scripted = loadScripted(combat);
        scripted[groupId] = foundry.utils.duplicate(actions);
        return saveScripted(combat, scripted);
      });
    }
  }

  const pendingRevealSubmission = user.getFlag(FLAG_SCOPE, "dow-pendingRevealSubmission");
  if (pendingRevealSubmission) {
    const { combatId, groupId, volleyIndex, action } = pendingRevealSubmission;
    const dialog = findDowDialog(combatId);
    if (dialog) {
      const key = `${groupId}-${volleyIndex}`;
      const pending = dialog._pendingRevealResolvers[key];
      if (pending && !pending.action) {
        pending.action = action;
      }
    }
  }

  const pendingTerms = user.getFlag(FLAG_SCOPE, "dow-pendingTerms");
  if (pendingTerms) {
    const { combatId, value } = pendingTerms;
    const combat = game.combats.get(combatId);
    if (combat) {
      combat.setFlag(FLAG_SCOPE, "dow-terms", value);
    }
  }

  const pendingBoa = user.getFlag(FLAG_SCOPE, "dow-pendingBoa");
  if (pendingBoa) {
    const { combatId, groupId, value } = pendingBoa;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.boa = value;
        saveGroups(combat, groups);
      }
    }
  }
});

Hooks.on("updateActor", () => {
  for (const dialog of _dowDialogs.values()) {
    dialog.render(false);
  }
});

Hooks.on("renderCombatTracker", (app, html, data) => {
  if (!game.combat) return;

  html.find(".bw-dow-btn").remove();

  const button = $(`<a class="combat-button bw-dow-btn" title="Duel of Wits!"><i class="fas fa-comments"></i> Duel of Wits!</a>`);
  button.on("click", async () => {
    const existing = findDowDialog(game.combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      const dialog = new DowDialog(game.combat);
      await dialog._ensureDefaultGroups();
      dialog.render(true);
    }
  });

  // Insert after Fight button if present, otherwise after encounter controls
  const fightBtn = html.find(".bw-fight-btn");
  if (fightBtn.length) {
    fightBtn.after(button);
  } else {
    const controls = html.find(".encounter-controls");
    if (controls.length) {
      controls.after(button);
    }
  }
});
