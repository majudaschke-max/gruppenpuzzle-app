"use strict";

const STORAGE_KEY = "gruppenpuzzle-app-v1";

const PHASES = [
  {
    name: "Stammgruppen bilden",
    minutes: 3,
    task: "Findet euch in euren Stammgruppen zusammen. Jede Person übernimmt ein Expertenthema.",
    advice: "Erkläre vor dem Wechsel, dass die Gruppe später auf jede einzelne Person angewiesen ist.",
    questions: []
  },
  {
    name: "Einzelarbeit",
    minutes: 5,
    task: "Verschaffe dir zunächst selbst einen Überblick über dein Material. Markiere wichtige Aussagen und notiere offene Fragen.",
    advice: "Plane zunächst eine kurze individuelle Erarbeitung ein. Dadurch hat jede Person eine eigene Grundlage für die Expertenarbeit.",
    questions: []
  },
  {
    name: "Expertengruppen",
    minutes: 10,
    task: "Klärt gemeinsam die Inhalte und bereitet eine verständliche Erklärung für eure Stammgruppe vor.",
    advice: "Achte darauf, dass nicht nur eine Person die Aufgabe übernimmt. Jedes Gruppenmitglied sollte die Erklärung später selbst geben können.",
    questions: [
      "Was müssen die anderen unbedingt wissen?",
      "Wie können wir den Inhalt einfach erklären?",
      "Welches Beispiel hilft beim Verständnis?",
      "Mit welcher Frage prüfen wir, ob unsere Erklärung verstanden wurde?"
    ]
  },
  {
    name: "Austausch in den Stammgruppen",
    minutes: 12,
    task: "Erklärt eure Expertenthemen nacheinander. Hört aufmerksam zu, stellt Rückfragen und haltet die wichtigsten Aussagen fest.",
    advice: "Die Ergebnisse sollen nicht nur vorgelesen werden. Die Expertinnen und Experten erklären, geben ein Beispiel und stellen eine Verständnisfrage.",
    questions: []
  },
  {
    name: "Gemeinsame Aufgabe",
    minutes: 8,
    task: "Bearbeitet gemeinsam eine Aufgabe, für die ihr die Ergebnisse aller Expertenthemen benötigt.",
    advice: "Die Aufgabe sollte nur lösbar sein, wenn die Informationen aller Expertenthemen zusammengeführt werden.",
    questions: []
  },
  {
    name: "Individuelle Sicherung",
    minutes: 5,
    task: "Halte für dich fest, was du aus allen Teilthemen gelernt hast, und bearbeite die abschließende Sicherungsaufgabe.",
    advice: "Prüfe nicht nur das eigene Expertenthema. Alle Lernenden sollten auch die Inhalte der anderen Gruppenmitglieder verstanden haben.",
    questions: []
  }
];

const DEFAULT_STATE = {
  entryMode: "range",
  highestNumber: 28,
  absentNumbers: "",
  presentNumbers: "",
  topicCount: 4,
  availableTime: "",
  quality: {
    balanced: false,
    synthesis: false,
    independent: false,
    individual: false
  },
  phaseMinutes: PHASES.map((phase) => phase.minutes),
  autoAdvance: false,
  lottery: null,
  lotterySignature: null
};

let state = loadState();
let audioContext = null;

const timer = {
  phaseIndex: 0,
  remainingMs: 0,
  phaseDurationMs: 0,
  deadline: null,
  intervalId: null,
  running: false,
  finished: false,
  warned: false,
  lastSecond: null
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const elements = {
  highestNumber: $("#highestNumber"),
  absentNumbers: $("#absentNumbers"),
  presentNumbers: $("#presentNumbers"),
  topicCount: $("#topicCount"),
  availableTime: $("#availableTime"),
  attendanceBadge: $("#attendanceBadge"),
  inputMessage: $("#inputMessage"),
  homeGroupCount: $("#homeGroupCount"),
  recommendationDetails: $("#recommendationDetails"),
  groupRecommendation: $("#groupRecommendation"),
  qualityScore: $("#qualityScore"),
  qualityFeedback: $("#qualityFeedback"),
  lotterySection: $("#lotterySection"),
  lotteryStatus: $("#lotteryStatus"),
  lotterySummary: $("#lotterySummary"),
  homeGroupsPanel: $("#homeGroupsPanel"),
  expertGroupsPanel: $("#expertGroupsPanel"),
  lotteryNotes: $("#lotteryNotes"),
  phaseList: $("#phaseList"),
  totalMinutes: $("#totalMinutes"),
  timeBalance: $("#timeBalance"),
  timerView: $("#timerView"),
  timerPhaseCount: $("#timerPhaseCount"),
  timerPhaseName: $("#timerPhaseName"),
  timerClock: $("#timerClock"),
  timerTask: $("#timerTask"),
  timerNext: $("#timerNext"),
  timerStatus: $("#timerStatus"),
  timerAdvice: $("#timerAdvice"),
  timerQuestions: $("#timerQuestions"),
  timerProgressBar: $("#timerProgressBar"),
  toggleTimer: $("#toggleTimer"),
  previousPhase: $("#previousPhase"),
  nextPhase: $("#nextPhase"),
  autoAdvance: $("#autoAdvance"),
  showGroups: $("#showGroups"),
  groupsDialog: $("#groupsDialog"),
  timerGroupsContent: $("#timerGroupsContent")
};

init();

function init() {
  hydrateInputs();
  renderPhaseSettings();
  bindEvents();
  updateModePanels();
  updateRecommendation();
  updateQualityFeedback();
  updateTotalTime();
  renderLottery();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return structuredClone(DEFAULT_STATE);

    return {
      ...structuredClone(DEFAULT_STATE),
      ...saved,
      quality: { ...DEFAULT_STATE.quality, ...(saved.quality || {}) },
      phaseMinutes: Array.isArray(saved.phaseMinutes) && saved.phaseMinutes.length === PHASES.length
        ? saved.phaseMinutes.map((value, index) => clamp(Number(value) || PHASES[index].minutes, 1, 60))
        : [...DEFAULT_STATE.phaseMinutes]
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Die App bleibt auch bei deaktiviertem localStorage vollständig nutzbar.
  }
}

function hydrateInputs() {
  elements.highestNumber.value = state.highestNumber;
  elements.absentNumbers.value = state.absentNumbers;
  elements.presentNumbers.value = state.presentNumbers;
  elements.topicCount.value = state.topicCount;
  elements.availableTime.value = state.availableTime;
  elements.autoAdvance.checked = Boolean(state.autoAdvance);

  const selectedMode = $(`input[name="entryMode"][value="${state.entryMode}"]`);
  if (selectedMode) selectedMode.checked = true;

  $$('[data-quality]').forEach((input) => {
    input.checked = Boolean(state.quality[input.dataset.quality]);
  });
}

function bindEvents() {
  $$('input[name="entryMode"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.entryMode = input.value;
      updateModePanels();
      handleStructureChange();
    });
  });

  [elements.highestNumber, elements.absentNumbers, elements.presentNumbers].forEach((input) => {
    input.addEventListener("input", () => {
      state.highestNumber = Number(elements.highestNumber.value) || "";
      state.absentNumbers = elements.absentNumbers.value;
      state.presentNumbers = elements.presentNumbers.value;
      handleStructureChange();
    });
  });

  elements.topicCount.addEventListener("change", () => {
    state.topicCount = Number(elements.topicCount.value);
    handleStructureChange();
  });

  elements.availableTime.addEventListener("input", () => {
    state.availableTime = elements.availableTime.value;
    saveState();
    updateTotalTime();
  });

  $("#recalculate").addEventListener("click", updateRecommendation);
  $("#drawGroups").addEventListener("click", drawGroups);
  $("#redrawGroups").addEventListener("click", drawGroups);
  $("#copyGroups").addEventListener("click", copyLottery);
  $("#printGroups").addEventListener("click", () => window.print());

  $$('[data-quality]').forEach((input) => {
    input.addEventListener("change", () => {
      state.quality[input.dataset.quality] = input.checked;
      saveState();
      updateQualityFeedback();
    });
  });

  bindTabPair("#homeGroupsTab", "#expertGroupsTab", elements.homeGroupsPanel, elements.expertGroupsPanel);

  $("#startSequence").addEventListener("click", startSequence);
  elements.toggleTimer.addEventListener("click", toggleTimer);
  elements.previousPhase.addEventListener("click", () => changeTimerPhase(timer.phaseIndex - 1));
  elements.nextPhase.addEventListener("click", () => changeTimerPhase(timer.phaseIndex + 1));
  $("#restartPhase").addEventListener("click", restartPhase);
  $("#addMinute").addEventListener("click", () => adjustTimer(1));
  $("#subtractMinute").addEventListener("click", () => adjustTimer(-1));
  $("#endSequence").addEventListener("click", endSequence);
  $("#toggleFullscreen").addEventListener("click", toggleFullscreen);
  elements.autoAdvance.addEventListener("change", () => {
    state.autoAdvance = elements.autoAdvance.checked;
    saveState();
  });

  elements.showGroups.addEventListener("click", openGroupsDialog);
  $("#closeGroups").addEventListener("click", () => elements.groupsDialog.close());
  elements.groupsDialog.addEventListener("click", (event) => {
    if (event.target === elements.groupsDialog) elements.groupsDialog.close();
  });
  $$('[data-timer-group-view]').forEach((button) => {
    button.addEventListener("click", () => setTimerGroupView(button.dataset.timerGroupView));
  });

  $("#copyMethod").addEventListener("click", copyMethod);
  $("#resetSettings").addEventListener("click", resetSettings);
  document.addEventListener("fullscreenchange", updateFullscreenLabel);
}

function bindTabPair(firstSelector, secondSelector, firstPanel, secondPanel) {
  const first = $(firstSelector);
  const second = $(secondSelector);

  first.addEventListener("click", () => selectTab(first, second, firstPanel, secondPanel));
  second.addEventListener("click", () => selectTab(second, first, secondPanel, firstPanel));
}

function selectTab(activeTab, inactiveTab, activePanel, inactivePanel) {
  activeTab.setAttribute("aria-selected", "true");
  inactiveTab.setAttribute("aria-selected", "false");
  activePanel.hidden = false;
  inactivePanel.hidden = true;
}

function updateModePanels() {
  $$('[data-mode-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.modePanel !== state.entryMode;
  });
}

function handleStructureChange() {
  saveState();
  updateRecommendation();

  if (!state.lottery) return;
  const result = getParticipants();
  const signature = result.valid ? createSignature(result.participants, Number(state.topicCount)) : null;

  if (signature !== state.lotterySignature) {
    elements.lotteryStatus.textContent = "Neu auslosen";
    elements.lotteryStatus.className = "status-badge status-warning";
    elements.lotterySummary.textContent = "Die Anwesenheit oder die Zahl der Expertenthemen wurde geändert. Bitte lose die Gruppen erneut aus.";
    elements.showGroups.hidden = true;
  } else {
    renderLottery();
  }
}

function parseNumberList(raw) {
  const cleaned = String(raw || "").trim();
  if (!cleaned) return { numbers: [], duplicates: [], invalid: [] };

  const tokens = cleaned.split(/[\s,;]+/).filter(Boolean);
  const numbers = [];
  const duplicates = [];
  const invalid = [];
  const seen = new Set();

  tokens.forEach((token) => {
    if (!/^\d+$/.test(token)) {
      invalid.push(token);
      return;
    }

    const value = Number(token);
    if (!Number.isInteger(value) || value < 1 || value > 999) {
      invalid.push(token);
    } else if (seen.has(value)) {
      duplicates.push(value);
    } else {
      seen.add(value);
      numbers.push(value);
    }
  });

  return { numbers, duplicates, invalid };
}

function getParticipants() {
  const errors = [];
  let participants = [];

  if (state.entryMode === "range") {
    const highest = Number(state.highestNumber);
    if (!Number.isInteger(highest) || highest < 1 || highest > 99) {
      errors.push("Gib eine höchste Klassenlisten-Nummer zwischen 1 und 99 ein.");
    } else {
      const absent = parseNumberList(state.absentNumbers);
      if (absent.invalid.length) errors.push(`Ungültige Eingabe: ${absent.invalid.join(", ")}.`);
      if (absent.duplicates.length) errors.push(`Doppelt eingegeben: ${absent.duplicates.join(", ")}.`);

      const outside = absent.numbers.filter((number) => number > highest);
      if (outside.length) errors.push(`Außerhalb der Klassenliste: ${outside.join(", ")}.`);

      const absentSet = new Set(absent.numbers.filter((number) => number <= highest));
      participants = Array.from({ length: highest }, (_, index) => index + 1)
        .filter((number) => !absentSet.has(number));
    }
  } else {
    const present = parseNumberList(state.presentNumbers);
    if (!String(state.presentNumbers).trim()) errors.push("Gib mindestens zwei anwesende Klassenlisten-Nummern ein.");
    if (present.invalid.length) errors.push(`Ungültige Eingabe: ${present.invalid.join(", ")}.`);
    if (present.duplicates.length) errors.push(`Doppelt eingegeben: ${present.duplicates.join(", ")}.`);
    participants = present.numbers.sort((a, b) => a - b);
  }

  if (participants.length < 2 && !errors.length) errors.push("Für Gruppenarbeit werden mindestens zwei anwesende Personen benötigt.");

  return { valid: errors.length === 0, participants, errors };
}

function calculatePlan(participantCount, topicCount) {
  const groupCount = participantCount < 2 ? 1 : Math.max(2, Math.round(participantCount / topicCount));
  const baseSize = Math.floor(participantCount / groupCount);
  const largerGroups = participantCount % groupCount;
  const groupSizes = Array.from({ length: groupCount }, (_, index) => baseSize + (index < largerGroups ? 1 : 0));

  return {
    groupCount,
    groupSizes,
    smallest: Math.min(...groupSizes),
    largest: Math.max(...groupSizes),
    expertApprox: participantCount / topicCount
  };
}

function updateRecommendation() {
  const result = getParticipants();
  const participantCount = result.participants.length;
  const topicCount = Number(state.topicCount);
  elements.attendanceBadge.textContent = `${participantCount} anwesend`;
  elements.inputMessage.textContent = result.errors.join(" ");

  if (!participantCount) {
    elements.homeGroupCount.textContent = "–";
    elements.recommendationDetails.textContent = "Sobald gültige Nummern vorliegen, erscheint hier eine Empfehlung.";
    return;
  }

  const plan = calculatePlan(participantCount, topicCount);
  const sizeText = plan.smallest === plan.largest
    ? `je ${plan.smallest} Personen`
    : `mit ${plan.smallest} bis ${plan.largest} Personen`;
  const expertMin = Math.floor(plan.expertApprox);
  const expertMax = Math.ceil(plan.expertApprox);
  const expertText = expertMin === expertMax ? `je ${expertMin} Personen` : `mit ${expertMin} bis ${expertMax} Personen`;

  const notes = [];
  if (participantCount < topicCount) {
    notes.push("Es sind weniger Lernende als Expertenthemen anwesend; mehrere Themen bleiben unbesetzt.");
  } else if (participantCount < topicCount * 2) {
    notes.push("Für zwei vollständig besetzte Stammgruppen reicht die Klasse nicht; plane Materialkarten für fehlende Themen ein.");
  } else if (plan.smallest < topicCount) {
    notes.push("In mindestens einer Stammgruppe bleibt ein Expertenthema unbesetzt.");
  } else if (plan.largest > topicCount) {
    notes.push("In mindestens einer Stammgruppe wird ein Expertenthema doppelt besetzt.");
  }
  if (plan.expertApprox > 8) notes.push("Die Expertengruppen werden groß. Teile sie bei Bedarf in Parallelgruppen.");

  elements.homeGroupCount.textContent = plan.groupCount;
  elements.recommendationDetails.innerHTML = `
    <strong>${participantCount} Lernende · ${topicCount} Expertenthemen</strong>
    ${plan.groupCount} Stammgruppen ${sizeText}; ${topicCount} Expertengruppen ${expertText}.
    ${notes.length ? `<br>${notes.join(" ")}` : ""}
  `;
}

function drawGroups() {
  const result = getParticipants();
  elements.inputMessage.textContent = result.errors.join(" ");
  if (!result.valid) {
    elements.groupRecommendation.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const participants = fisherYates([...result.participants]);
  const topicCount = Number(state.topicCount);
  const plan = calculatePlan(participants.length, topicCount);
  const topicCounts = Array(topicCount).fill(0);
  let offset = 0;

  const groups = plan.groupSizes.map((size) => {
    const members = participants.slice(offset, offset + size);
    offset += size;
    const usedTopics = new Set();

    return members.map((number, memberIndex) => {
      let candidates = Array.from({ length: topicCount }, (_, index) => index);
      if (memberIndex < topicCount) candidates = candidates.filter((topic) => !usedTopics.has(topic));
      const minimum = Math.min(...candidates.map((topic) => topicCounts[topic]));
      const leastUsed = candidates.filter((topic) => topicCounts[topic] === minimum);
      const topic = leastUsed[Math.floor(Math.random() * leastUsed.length)];
      usedTopics.add(topic);
      topicCounts[topic] += 1;
      return { number, topic };
    });
  });

  state.lottery = {
    participants: [...result.participants].sort((a, b) => a - b),
    topicCount,
    groups,
    createdAt: new Date().toISOString()
  };
  state.lotterySignature = createSignature(result.participants, topicCount);
  saveState();
  renderLottery();
  elements.lotterySection.hidden = false;
  elements.lotterySection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createSignature(participants, topicCount) {
  return `${[...participants].sort((a, b) => a - b).join(",")}|${topicCount}`;
}

function fisherYates(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function renderLottery() {
  if (!state.lottery) {
    elements.lotterySection.hidden = true;
    elements.showGroups.hidden = true;
    return;
  }

  elements.lotterySection.hidden = false;
  const currentResult = getParticipants();
  const currentSignature = currentResult.valid
    ? createSignature(currentResult.participants, Number(state.topicCount))
    : null;
  const isCurrent = currentSignature === state.lotterySignature;

  elements.lotteryStatus.textContent = isCurrent ? "Aktuell" : "Neu auslosen";
  elements.lotteryStatus.className = `status-badge ${isCurrent ? "status-success" : "status-warning"}`;
  elements.showGroups.hidden = !isCurrent;

  if (!isCurrent) {
    elements.lotterySummary.textContent = "Die Anwesenheit oder die Zahl der Expertenthemen wurde geändert. Bitte lose die Gruppen erneut aus.";
  } else {
    elements.lotterySummary.textContent = `${state.lottery.participants.length} Lernende wurden zufällig auf ${state.lottery.groups.length} Stammgruppen verteilt. Innerhalb der Gruppen sind die Expertenthemen möglichst gleichmäßig besetzt.`;
  }

  elements.homeGroupsPanel.innerHTML = buildHomeGroupsTable(state.lottery);
  elements.expertGroupsPanel.innerHTML = buildExpertGroupsTable(state.lottery);
  elements.lotteryNotes.innerHTML = buildLotteryNotes(state.lottery)
    .map((note) => `<p class="lottery-note">${note}</p>`)
    .join("");
}

function buildHomeGroupsTable(lottery) {
  const headers = Array.from({ length: lottery.topicCount }, (_, index) => `<th scope="col">Thema ${topicLetter(index)}</th>`).join("");
  const rows = lottery.groups.map((group, groupIndex) => {
    const cells = Array.from({ length: lottery.topicCount }, (_, topic) => {
      const members = group.filter((member) => member.topic === topic).map((member) => `Nr. ${member.number}`);
      return `<td>${members.length ? members.join(", ") : "<span aria-label=\"nicht besetzt\">—</span>"}</td>`;
    }).join("");
    return `<tr><th scope="row">Stammgruppe ${groupIndex + 1}</th>${cells}</tr>`;
  }).join("");

  return `<div class="table-wrap"><table class="group-table"><thead><tr><th scope="col">Gruppe</th>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function buildExpertGroupsTable(lottery) {
  const rows = Array.from({ length: lottery.topicCount }, (_, topic) => {
    const members = lottery.groups
      .flat()
      .filter((member) => member.topic === topic)
      .map((member) => member.number)
      .sort((a, b) => a - b);
    return `<tr><th scope="row"><span class="topic-pill">${topicLetter(topic)}</span> Thema ${topicLetter(topic)}</th><td>${members.map((number) => `Nr. ${number}`).join(", ") || "—"}</td><td>${members.length}</td></tr>`;
  }).join("");

  return `<div class="table-wrap"><table class="group-table"><thead><tr><th scope="col">Expertengruppe</th><th scope="col">Klassenlisten-Nummern</th><th scope="col">Größe</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function buildLotteryNotes(lottery) {
  const notes = [];
  lottery.groups.forEach((group, groupIndex) => {
    const counts = Array(lottery.topicCount).fill(0);
    group.forEach((member) => { counts[member.topic] += 1; });
    const missing = counts.map((count, topic) => count === 0 ? topicLetter(topic) : null).filter(Boolean);
    const doubled = counts.map((count, topic) => count > 1 ? topicLetter(topic) : null).filter(Boolean);

    if (missing.length) {
      notes.push(`Stammgruppe ${groupIndex + 1}: Thema ${missing.join(" und ")} ${missing.length === 1 ? "ist" : "sind"} nicht besetzt. Nutze eine Materialkarte oder lass die Erklärung durch eine andere Gruppe ergänzen.`);
    }
    if (doubled.length) {
      notes.push(`Stammgruppe ${groupIndex + 1}: Thema ${doubled.join(" und ")} ${doubled.length === 1 ? "ist" : "sind"} doppelt besetzt.`);
    }
  });
  return notes;
}

function topicLetter(index) {
  return String.fromCharCode(65 + index);
}

function lotteryAsText(lottery) {
  const home = lottery.groups.map((group, groupIndex) => {
    const members = [...group]
      .sort((a, b) => a.topic - b.topic)
      .map((member) => `Nr. ${member.number}: Thema ${topicLetter(member.topic)}`)
      .join(" · ");
    return `Stammgruppe ${groupIndex + 1}: ${members}`;
  }).join("\n");

  const expert = Array.from({ length: lottery.topicCount }, (_, topic) => {
    const numbers = lottery.groups.flat()
      .filter((member) => member.topic === topic)
      .map((member) => member.number)
      .sort((a, b) => a - b)
      .join(", ");
    return `Thema ${topicLetter(topic)}: Nr. ${numbers}`;
  }).join("\n");

  return `GRUPPENPUZZLE – AUSLOSUNG\n\nSTAMMGRUPPEN\n${home}\n\nEXPERTENGRUPPEN\n${expert}`;
}

async function copyLottery() {
  if (!state.lottery) return;
  const success = await copyText(lotteryAsText(state.lottery));
  $("#copyGroupsFeedback").textContent = success
    ? "Die Auslosung wurde kopiert."
    : "Kopieren war nicht möglich. Die Tabellen bleiben zum manuellen Kopieren markierbar.";
}

function renderPhaseSettings() {
  elements.phaseList.innerHTML = "";
  const template = $("#phaseTemplate");

  PHASES.forEach((phase, index) => {
    const fragment = template.content.cloneNode(true);
    const item = $(".phase-item", fragment);
    $(".phase-number", fragment).textContent = index + 1;
    $("h3", fragment).textContent = phase.name;
    $(".phase-task", fragment).textContent = phase.task;
    $(".phase-advice", fragment).textContent = phase.advice;
    $(".phase-questions", fragment).innerHTML = phase.questions.map((question) => `<li>${question}</li>`).join("");
    $(".phase-questions", fragment).hidden = phase.questions.length === 0;

    const output = $("output", fragment);
    output.textContent = `${state.phaseMinutes[index]} Min.`;
    output.setAttribute("aria-live", "polite");

    $$('button[data-action]', fragment).forEach((button) => {
      button.dataset.phaseIndex = index;
      button.addEventListener("click", () => {
        const delta = button.dataset.action === "increase" ? 1 : -1;
        state.phaseMinutes[index] = clamp(state.phaseMinutes[index] + delta, 1, 60);
        output.textContent = `${state.phaseMinutes[index]} Min.`;
        saveState();
        updateTotalTime();
      });
    });

    item.style.setProperty("--phase-index", index);
    elements.phaseList.append(fragment);
  });
}

function updateTotalTime() {
  const total = state.phaseMinutes.reduce((sum, minutes) => sum + Number(minutes), 0);
  elements.totalMinutes.textContent = total;
  const available = Number(state.availableTime);

  elements.timeBalance.classList.remove("over");
  if (!state.availableTime || !Number.isFinite(available) || available <= 0) {
    elements.timeBalance.textContent = `Geplante Dauer: ${total} Minuten. Optional kannst du oben eine verfügbare Gesamtzeit eintragen.`;
    return;
  }

  const difference = available - total;
  if (difference >= 0) {
    elements.timeBalance.textContent = `Geplante Dauer: ${total} Minuten · Verfügbar: ${available} Minuten · Reserve: ${difference} Minuten.`;
  } else {
    elements.timeBalance.textContent = `Geplante Dauer: ${total} Minuten · Die Planung überschreitet die verfügbare Zeit um ${Math.abs(difference)} Minuten.`;
    elements.timeBalance.classList.add("over");
  }
}

function updateQualityFeedback() {
  const selected = Object.values(state.quality).filter(Boolean).length;
  elements.qualityScore.textContent = `${selected}/4`;
  elements.qualityScore.setAttribute("aria-label", `${selected} von 4 Kriterien erfüllt`);
  elements.qualityFeedback.classList.toggle("success", selected === 4);

  const messages = [];
  if (selected === 4) messages.push("Das Gruppenpuzzle ist sinnvoll vorbereitet.");
  else if (selected === 3) messages.push("Die Grundstruktur passt. Prüfe noch den offenen Punkt.");
  else messages.push("Die Methode ist noch nicht ausreichend abgesichert. Überarbeite besonders die offenen Punkte.");

  if (!state.quality.synthesis) messages.push("Plane eine gemeinsame Aufgabe, für die alle Ergebnisse gebraucht werden.");
  if (!state.quality.individual) messages.push("Ergänze eine kurze individuelle Sicherung für die fremden Teilthemen.");
  elements.qualityFeedback.textContent = messages.join(" ");
}

function startSequence() {
  timer.phaseIndex = 0;
  setTimerForCurrentPhase();
  elements.timerView.hidden = false;
  document.body.style.overflow = "hidden";
  renderTimerPhase();
  elements.toggleTimer.focus();
}

function setTimerForCurrentPhase() {
  pauseTimer();
  timer.phaseDurationMs = state.phaseMinutes[timer.phaseIndex] * 60_000;
  timer.remainingMs = timer.phaseDurationMs;
  timer.finished = false;
  timer.warned = false;
  timer.lastSecond = null;
  elements.toggleTimer.textContent = "Start";
  elements.timerStatus.textContent = "Bereit";
}

function renderTimerPhase() {
  const phase = PHASES[timer.phaseIndex];
  elements.timerPhaseCount.textContent = `Phase ${timer.phaseIndex + 1} von ${PHASES.length}`;
  elements.timerPhaseName.textContent = phase.name;
  elements.timerTask.textContent = phase.task;
  elements.timerAdvice.textContent = phase.advice;
  elements.timerQuestions.innerHTML = phase.questions.map((question) => `<li>${question}</li>`).join("");
  elements.timerQuestions.hidden = phase.questions.length === 0;
  elements.timerNext.textContent = timer.phaseIndex < PHASES.length - 1
    ? `Als Nächstes: ${PHASES[timer.phaseIndex + 1].name}`
    : "Letzte Phase des Ablaufs";
  elements.previousPhase.disabled = timer.phaseIndex === 0;
  elements.nextPhase.disabled = timer.phaseIndex === PHASES.length - 1;
  elements.autoAdvance.checked = Boolean(state.autoAdvance);
  $("#timerHelp").open = false;

  const hasCurrentLottery = Boolean(state.lottery && state.lotterySignature === currentSignature());
  elements.showGroups.hidden = !hasCurrentLottery;
  renderTimerClock(true);
  updateTimerAppearance();
}

function currentSignature() {
  const result = getParticipants();
  return result.valid ? createSignature(result.participants, Number(state.topicCount)) : null;
}

function toggleTimer() {
  if (timer.running) pauseTimer();
  else startTimer();
}

function startTimer() {
  if (timer.finished || timer.remainingMs <= 0) restartPhase();
  ensureAudioContext();
  timer.running = true;
  timer.deadline = Date.now() + timer.remainingMs;
  elements.toggleTimer.textContent = "Pause";
  elements.timerStatus.textContent = "Läuft";
  clearInterval(timer.intervalId);
  timer.intervalId = window.setInterval(tickTimer, 250);
  tickTimer();
}

function pauseTimer() {
  if (timer.running && timer.deadline) timer.remainingMs = Math.max(0, timer.deadline - Date.now());
  timer.running = false;
  timer.deadline = null;
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  if (elements.toggleTimer) elements.toggleTimer.textContent = timer.finished ? "Neu starten" : "Fortsetzen";
  if (elements.timerStatus && !timer.finished) elements.timerStatus.textContent = "Pausiert";
  renderTimerClock(true);
}

function tickTimer() {
  timer.remainingMs = Math.max(0, timer.deadline - Date.now());
  renderTimerClock();

  if (timer.remainingMs <= 60_000 && timer.remainingMs > 0 && !timer.warned) {
    timer.warned = true;
    updateTimerAppearance();
  }

  if (timer.remainingMs <= 0) finishPhase();
}

function finishPhase() {
  clearInterval(timer.intervalId);
  timer.intervalId = null;
  timer.running = false;
  timer.finished = true;
  timer.remainingMs = 0;
  elements.toggleTimer.textContent = timer.phaseIndex < PHASES.length - 1 ? "Phase wiederholen" : "Neu starten";
  elements.timerStatus.textContent = "Zeit abgelaufen";
  playEndSignal();
  renderTimerClock(true);
  updateTimerAppearance();

  if (state.autoAdvance && timer.phaseIndex < PHASES.length - 1) {
    window.setTimeout(() => {
      if (!timer.finished || !state.autoAdvance) return;
      changeTimerPhase(timer.phaseIndex + 1);
      startTimer();
    }, 1000);
  }
}

function renderTimerClock(force = false) {
  const totalSeconds = Math.max(0, Math.ceil(timer.remainingMs / 1000));
  if (!force && totalSeconds === timer.lastSecond) return;
  timer.lastSecond = totalSeconds;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  elements.timerClock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  elements.timerClock.dateTime = `PT${minutes}M${seconds}S`;

  const elapsedRatio = timer.phaseDurationMs > 0 ? 1 - (timer.remainingMs / timer.phaseDurationMs) : 1;
  const fullProgress = ((timer.phaseIndex + clamp(elapsedRatio, 0, 1)) / PHASES.length) * 100;
  elements.timerProgressBar.style.width = `${fullProgress}%`;
  updateTimerAppearance();
}

function updateTimerAppearance() {
  const isWarning = !timer.finished && timer.remainingMs <= 60_000 && timer.remainingMs > 0;
  elements.timerView.classList.toggle("warning", isWarning);
  elements.timerView.classList.toggle("finished", timer.finished);
  if (isWarning && timer.running) elements.timerStatus.textContent = "Noch eine Minute";
  else if (!timer.finished && timer.running) elements.timerStatus.textContent = "Läuft";
}

function restartPhase() {
  setTimerForCurrentPhase();
  renderTimerPhase();
}

function adjustTimer(minutes) {
  const delta = minutes * 60_000;
  const newRemaining = Math.max(0, timer.remainingMs + delta);
  timer.phaseDurationMs = Math.max(60_000, timer.phaseDurationMs + delta);
  timer.remainingMs = newRemaining;
  timer.finished = false;
  timer.warned = timer.remainingMs <= 60_000;
  timer.lastSecond = null;
  if (timer.running) timer.deadline = Date.now() + timer.remainingMs;

  if (timer.remainingMs === 0) finishPhase();
  else {
    elements.toggleTimer.textContent = timer.running ? "Pause" : "Fortsetzen";
    renderTimerClock(true);
    updateTimerAppearance();
  }
}

function changeTimerPhase(nextIndex) {
  if (nextIndex < 0 || nextIndex >= PHASES.length) return;
  timer.phaseIndex = nextIndex;
  setTimerForCurrentPhase();
  renderTimerPhase();
  if (state.lottery && state.lotterySignature === currentSignature() && (nextIndex === 0 || nextIndex === 2)) {
    setTimerGroupView(nextIndex === 0 ? "home" : "expert");
  }
}

function endSequence() {
  if (!window.confirm("Möchtest du den laufenden Ablauf wirklich beenden?")) return;
  pauseTimer();
  elements.timerView.hidden = true;
  document.body.style.overflow = "";
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  $("#startSequence").focus();
}

function ensureAudioContext() {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  } catch {
    audioContext = null;
  }
}

function playEndSignal() {
  if (!audioContext) return;
  try {
    const now = audioContext.currentTime;
    [0, 0.22].forEach((offset, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index === 0 ? 660 : 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.16, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.2);
    });
  } catch {
    // Das visuelle Signal bleibt erhalten, falls Audio blockiert wird.
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  } else if (elements.timerView.requestFullscreen) {
    elements.timerView.requestFullscreen().catch(() => {});
  }
}

function updateFullscreenLabel() {
  $("#toggleFullscreen").textContent = document.fullscreenElement ? "Vollbild verlassen" : "Vollbild";
}

function openGroupsDialog() {
  if (!state.lottery) return;
  setTimerGroupView(timer.phaseIndex === 2 ? "expert" : "home");
  if (typeof elements.groupsDialog.showModal === "function") elements.groupsDialog.showModal();
  else elements.groupsDialog.setAttribute("open", "");
}

function setTimerGroupView(view) {
  $$('[data-timer-group-view]').forEach((button) => {
    button.setAttribute("aria-selected", String(button.dataset.timerGroupView === view));
  });
  if (!state.lottery) return;
  elements.timerGroupsContent.innerHTML = view === "expert"
    ? buildExpertGroupsTable(state.lottery)
    : buildHomeGroupsTable(state.lottery);
}

async function copyMethod() {
  const items = $$("#methodText li").map((item, index) => `${index + 1}. ${item.textContent}`).join("\n");
  const success = await copyText(`Gruppenpuzzle\n\n${items}`);
  $("#copyMethodFeedback").textContent = success
    ? "Die Methodenanleitung wurde kopiert."
    : "Kopieren war nicht möglich. Der Text bleibt zum manuellen Kopieren markierbar.";
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

function resetSettings() {
  if (!window.confirm("Alle lokal gespeicherten Einstellungen und Auslosungen zurücksetzen?")) return;
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
