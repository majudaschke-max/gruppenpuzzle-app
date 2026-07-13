"use strict";

const STORAGE_KEY = "gruppenpuzzle-settings-v3";
const LEGACY_STORAGE_KEYS = ["gruppenpuzzle-settings-v2", "gruppenpuzzle-settings-v1", "gruppenpuzzle-app-v1"];
const TOPIC_NAMES = ["Thema A", "Thema B", "Thema C", "Thema D", "Thema E", "Thema F"];

const PHASES = [
  {
    name: "Stammgruppen bilden",
    minutes: 3,
    instruction: "Findet euch in euren Stammgruppen zusammen. Jede Person übernimmt ein Expertenthema.",
    note: "Erkläre vor dem Wechsel, dass die Gruppe später auf jede einzelne Person angewiesen ist.",
    color: "#78a996",
    surface: "#edf8f3"
  },
  {
    name: "Einzelarbeit",
    minutes: 5,
    instruction: "Verschaffe dir zunächst selbst einen Überblick über dein Material. Markiere wichtige Aussagen und notiere offene Fragen.",
    note: "Plane zunächst eine kurze individuelle Erarbeitung ein. Dadurch hat jede Person eine eigene Grundlage für die Expertenarbeit.",
    color: "#809fc8",
    surface: "#eef4fc"
  },
  {
    name: "Expertengruppen",
    minutes: 10,
    instruction: "Klärt gemeinsam die Inhalte und bereitet eine verständliche Erklärung für eure Stammgruppe vor.",
    questions: [
      "Was müssen die anderen unbedingt wissen?",
      "Wie können wir den Inhalt einfach erklären?",
      "Welches Beispiel hilft beim Verständnis?",
      "Mit welcher Frage überprüfen wir, ob unsere Erklärung verstanden wurde?"
    ],
    note: "Achte darauf, dass nicht nur eine Person die Aufgabe übernimmt. Jedes Gruppenmitglied sollte die Erklärung später selbst geben können.",
    color: "#d09a64",
    surface: "#fff4e8"
  },
  {
    name: "Austausch in den Stammgruppen",
    minutes: 12,
    instruction: "Erklärt eure Expertenthemen nacheinander. Hört aufmerksam zu, stellt Rückfragen und haltet die wichtigsten Aussagen fest.",
    note: "Die Ergebnisse sollen nicht nur vorgelesen werden. Die Expertinnen und Experten erklären, geben ein Beispiel und stellen eine Verständnisfrage.",
    color: "#ad84bb",
    surface: "#f7eef9"
  },
  {
    name: "Gemeinsame Aufgabe",
    minutes: 8,
    instruction: "Bearbeitet gemeinsam eine Aufgabe, für die ihr die Ergebnisse aller Expertenthemen benötigt.",
    note: "Die Aufgabe sollte nur lösbar sein, wenn die Informationen aller Expertenthemen zusammengeführt werden.",
    color: "#cb8294",
    surface: "#fceef2"
  },
  {
    name: "Individuelle Sicherung",
    minutes: 5,
    optional: true,
    instruction: "Halte für dich fest, was du aus allen Teilthemen gelernt hast, und bearbeite die abschließende Sicherungsaufgabe.",
    note: "Nutze diese Phase, wenn sichtbar werden soll, ob alle auch die fremden Teilthemen verstanden haben.",
    color: "#6f9fac",
    surface: "#edf7f8"
  }
];

const DEFAULTS = {
  students: "",
  topics: 4,
  listMode: "range",
  missingNumbers: "",
  presentNumbers: "",
  availableTime: "",
  phaseTimes: PHASES.map((phase) => phase.minutes),
  phaseEnabled: PHASES.map((phase) => !phase.optional),
  autoNext: false,
  draw: null
};

const state = {
  settings: loadSettings(),
  currentPhase: 0,
  remainingMs: 0,
  targetTime: null,
  running: false,
  expired: false,
  timerId: null,
  autoAdvanceId: null,
  audioContext: null
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  Object.assign(elements, {
    studentCount: document.querySelector("#student-count"),
    topicCount: document.querySelector("#topic-count"),
    missingNumbers: document.querySelector("#missing-numbers"),
    presentNumbers: document.querySelector("#present-numbers"),
    rangeFields: document.querySelector("#range-fields"),
    presentField: document.querySelector("#present-field"),
    listModeInputs: [...document.querySelectorAll('[name="listMode"]')],
    availableTime: document.querySelector("#available-time"),
    groupResult: document.querySelector("#group-result"),
    drawSummary: document.querySelector("#draw-summary"),
    drawGroups: document.querySelector("#draw-groups"),
    drawStatus: document.querySelector("#draw-status"),
    drawResult: document.querySelector("#draw-result"),
    drawFreshness: document.querySelector("#draw-freshness"),
    homeViewTab: document.querySelector("#home-view-tab"),
    expertViewTab: document.querySelector("#expert-view-tab"),
    homeView: document.querySelector("#home-view"),
    expertView: document.querySelector("#expert-view"),
    drawAdvice: document.querySelector("#draw-advice"),
    redrawGroups: document.querySelector("#redraw-groups"),
    acceptDraw: document.querySelector("#accept-draw"),
    copyDraw: document.querySelector("#copy-draw"),
    printDraw: document.querySelector("#print-draw"),
    drawActionStatus: document.querySelector("#draw-action-status"),
    phaseList: document.querySelector("#phase-list"),
    totalTime: document.querySelector("#total-time"),
    startSession: document.querySelector("#start-session"),
    resetSettings: document.querySelector("#reset-settings"),
    copyGuide: document.querySelector("#copy-guide"),
    guideText: document.querySelector("#guide-text"),
    copyStatus: document.querySelector("#copy-status"),
    timerView: document.querySelector("#timer-view"),
    timerPhaseCount: document.querySelector("#timer-phase-count"),
    timerPhaseLabel: document.querySelector("#timer-phase-label"),
    timerPhaseName: document.querySelector("#timer-phase-name"),
    timerClock: document.querySelector("#timer-clock"),
    timerInstruction: document.querySelector("#timer-instruction"),
    timerQuestions: document.querySelector("#timer-questions"),
    timerTeacherNote: document.querySelector("#timer-teacher-note"),
    timerAlert: document.querySelector("#timer-alert"),
    timerProgressBar: document.querySelector("#timer-progress-bar"),
    nextPhaseName: document.querySelector("#next-phase-name"),
    timerToggle: document.querySelector("#timer-toggle"),
    restartPhase: document.querySelector("#restart-phase"),
    subtractMinute: document.querySelector("#subtract-minute"),
    addMinute: document.querySelector("#add-minute"),
    previousPhase: document.querySelector("#previous-phase"),
    nextPhase: document.querySelector("#next-phase"),
    endSession: document.querySelector("#end-session"),
    presentationMode: document.querySelector("#presentation-mode"),
    fullscreenMode: document.querySelector("#fullscreen-mode"),
    autoNext: document.querySelector("#auto-next"),
    timerGroupsToggle: document.querySelector("#timer-groups-toggle"),
    timerGroupsPanel: document.querySelector("#timer-groups-panel"),
    timerGroupsContent: document.querySelector("#timer-groups-content"),
    closeTimerGroups: document.querySelector("#close-timer-groups"),
    pageLayers: [...document.querySelectorAll(".skip-link, .site-header, .page-shell, .site-footer")]
  });

  renderPhaseSettings();
  applyStoredSettings();
  bindEvents();
  updateListMode();
  updateGroupRecommendation();
  updateTimeSummary();
  renderDraw();
}

function loadSettings() {
  try {
    const storageEntry = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]
      .map((key) => ({ key, value: localStorage.getItem(key) }))
      .find((entry) => entry.value);
    if (!storageEntry) return structuredClone(DEFAULTS);

    const saved = JSON.parse(storageEntry.value);
    if (!saved || typeof saved !== "object") return structuredClone(DEFAULTS);
    const savedTimes = Array.isArray(saved.phaseTimes)
      ? saved.phaseTimes
      : Array.isArray(saved.phaseMinutes) ? saved.phaseMinutes : [];
    const savedEnabled = Array.isArray(saved.phaseEnabled) ? saved.phaseEnabled : [];
    const students = Number(saved.students ?? saved.highestNumber);
    const topics = Number(saved.topics ?? saved.topicCount);

    return {
      students: Number.isInteger(students) && students > 0 ? students : "",
      topics: Number.isInteger(topics) && topics >= 3 && topics <= 6 ? topics : DEFAULTS.topics,
      listMode: saved.listMode === "present" || saved.entryMode === "direct" ? "present" : "range",
      missingNumbers: typeof saved.missingNumbers === "string"
        ? saved.missingNumbers
        : typeof saved.absentNumbers === "string" ? saved.absentNumbers : "",
      presentNumbers: typeof saved.presentNumbers === "string" ? saved.presentNumbers : "",
      availableTime: saved.availableTime === "" || saved.availableTime === undefined
        ? ""
        : clampInteger(saved.availableTime, 1, 360, ""),
      phaseTimes: PHASES.map((phase, index) => clampInteger(savedTimes[index], 1, 60, phase.minutes)),
      phaseEnabled: PHASES.map((phase, index) => phase.optional
        ? (savedEnabled[index] === undefined ? DEFAULTS.phaseEnabled[index] : Boolean(savedEnabled[index]))
        : true),
      autoNext: Boolean(saved.autoNext ?? saved.autoAdvance),
      draw: normalizeDraw(saved.draw ?? saved.lottery)
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function normalizeDraw(draw) {
  if (!draw || typeof draw !== "object" || !Array.isArray(draw.groups)) return null;
  const topics = Number(draw.topics ?? draw.topicCount);
  if (!Number.isInteger(topics) || topics < 3 || topics > 6) return null;
  const isLegacyDraw = draw.groups.some((group) => Array.isArray(group));
  const groups = draw.groups.map((group) => {
    const sourceMembers = Array.isArray(group) ? group : group.members;
    const members = Array.isArray(sourceMembers)
      ? sourceMembers.map((member) => ({
        number: member.number,
        topic: Number.isInteger(member.topic) ? TOPIC_NAMES[member.topic] : member.topic
      })).filter((member) => Number.isInteger(member.number) && member.number > 0 && TOPIC_NAMES.includes(member.topic))
      : [];
    const usedTopics = new Set(members.map((member) => member.topic));
    const missingTopics = Array.isArray(group.missingTopics)
      ? group.missingTopics.filter((topic) => TOPIC_NAMES.includes(topic))
      : TOPIC_NAMES.slice(0, topics).filter((topic) => !usedTopics.has(topic));
    return { members, missingTopics };
  }).filter((group) => group.members.length > 0);
  if (groups.length === 0) return null;
  return {
    topics,
    attendees: Array.isArray(draw.attendees ?? draw.participants)
      ? (draw.attendees ?? draw.participants).filter((number) => Number.isInteger(number) && number > 0)
      : [],
    groups,
    accepted: isLegacyDraw ? true : Boolean(draw.accepted),
    stale: Boolean(draw.stale),
    staleReason: typeof draw.staleReason === "string" ? draw.staleReason : ""
  };
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  } catch {
    // Die App bleibt auch bei deaktivierter lokaler Speicherung nutzbar.
  }
}

function applyStoredSettings() {
  elements.studentCount.value = state.settings.students;
  elements.topicCount.value = state.settings.topics;
  elements.missingNumbers.value = state.settings.missingNumbers;
  elements.presentNumbers.value = state.settings.presentNumbers;
  elements.availableTime.value = state.settings.availableTime;
  elements.listModeInputs.forEach((input) => { input.checked = input.value === state.settings.listMode; });
  elements.autoNext.checked = state.settings.autoNext;
}

function bindEvents() {
  elements.studentCount.addEventListener("input", () => {
    state.settings.students = parseInteger(elements.studentCount.value) ?? "";
    handleConfigurationChange("numbers");
  });
  elements.missingNumbers.addEventListener("input", () => {
    state.settings.missingNumbers = elements.missingNumbers.value;
    handleConfigurationChange("numbers");
  });
  elements.presentNumbers.addEventListener("input", () => {
    state.settings.presentNumbers = elements.presentNumbers.value;
    handleConfigurationChange("numbers");
  });
  elements.listModeInputs.forEach((input) => input.addEventListener("change", () => {
    if (!input.checked) return;
    state.settings.listMode = input.value;
    updateListMode();
    handleConfigurationChange("numbers");
  }));
  elements.topicCount.addEventListener("input", () => {
    const value = parseInteger(elements.topicCount.value);
    if (value !== null) state.settings.topics = value;
    handleConfigurationChange("topics");
  });
  elements.availableTime.addEventListener("input", () => {
    state.settings.availableTime = elements.availableTime.value;
    saveSettings();
    updateTimeSummary();
  });

  elements.drawGroups.addEventListener("click", createDraw);
  elements.redrawGroups.addEventListener("click", createDraw);
  elements.acceptDraw.addEventListener("click", acceptDraw);
  elements.copyDraw.addEventListener("click", copyDraw);
  elements.printDraw.addEventListener("click", () => window.print());
  elements.homeViewTab.addEventListener("click", () => switchDrawView("home"));
  elements.expertViewTab.addEventListener("click", () => switchDrawView("expert"));

  elements.phaseList.addEventListener("click", handleDurationButton);
  elements.phaseList.addEventListener("input", handlePhaseInput);
  elements.startSession.addEventListener("click", startSession);
  elements.resetSettings.addEventListener("click", resetSettings);
  elements.copyGuide.addEventListener("click", copyGuide);

  elements.timerToggle.addEventListener("click", toggleTimer);
  elements.restartPhase.addEventListener("click", restartCurrentPhase);
  elements.subtractMinute.addEventListener("click", () => adjustRunningTime(-1));
  elements.addMinute.addEventListener("click", () => adjustRunningTime(1));
  elements.previousPhase.addEventListener("click", () => changePhase(-1));
  elements.nextPhase.addEventListener("click", () => changePhase(1));
  elements.endSession.addEventListener("click", endSession);
  elements.presentationMode.addEventListener("click", togglePresentationMode);
  elements.fullscreenMode.addEventListener("click", toggleFullscreen);
  elements.autoNext.addEventListener("change", () => {
    state.settings.autoNext = elements.autoNext.checked;
    saveSettings();
  });
  elements.timerGroupsToggle.addEventListener("click", toggleTimerGroups);
  elements.closeTimerGroups.addEventListener("click", closeTimerGroups);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  document.addEventListener("visibilitychange", () => { if (state.running) tick(); });
  document.addEventListener("keydown", handleKeyboardShortcuts);
}

function updateListMode() {
  const isRange = state.settings.listMode === "range";
  elements.rangeFields.hidden = !isRange;
  elements.presentField.hidden = isRange;
  elements.studentCount.disabled = !isRange;
  elements.missingNumbers.disabled = !isRange;
  elements.presentNumbers.disabled = isRange;
}

function handleConfigurationChange(kind) {
  if (state.settings.draw) {
    state.settings.draw.stale = true;
    state.settings.draw.accepted = false;
    state.settings.draw.staleReason = kind === "topics"
      ? "Die Zahl der Expertenthemen wurde geändert. Bitte lose die Gruppen erneut aus."
      : "Die Klassenlisten-Nummern wurden geändert. Bitte lose die Gruppen erneut aus.";
  }
  saveSettings();
  updateGroupRecommendation();
  renderDraw();
}

function renderPhaseSettings() {
  elements.phaseList.innerHTML = PHASES.map((phase, index) => `
    <article class="phase-card${phase.optional && !state.settings.phaseEnabled[index] ? " is-disabled" : ""}" style="--phase-color: ${phase.color}; --phase-surface: ${phase.surface}">
      <div class="phase-card__main">
        <div>
          <p class="phase-card__number">Phase ${index + 1}${phase.optional ? " · optional" : ""}</p>
          <h4>${phase.name}</h4>
          ${phase.optional ? `
            <label class="phase-toggle">
              <input type="checkbox" data-phase-enabled="${index}" ${state.settings.phaseEnabled[index] ? "checked" : ""}>
              <span>Diese Phase durchführen</span>
            </label>` : ""}
        </div>
        <div class="duration-control" aria-label="Dauer für ${phase.name}">
          <button type="button" data-duration-action="minus" data-phase-index="${index}" aria-label="Eine Minute von ${phase.name} abziehen" ${!state.settings.phaseEnabled[index] ? "disabled" : ""}>−</button>
          <input type="number" min="1" max="60" step="1" value="${state.settings.phaseTimes[index]}" data-duration-input="${index}" aria-label="Minuten für ${phase.name}" ${!state.settings.phaseEnabled[index] ? "disabled" : ""}>
          <span>Min.</span>
          <button type="button" data-duration-action="plus" data-phase-index="${index}" aria-label="Eine Minute zu ${phase.name} hinzufügen" ${!state.settings.phaseEnabled[index] ? "disabled" : ""}>+</button>
        </div>
      </div>
      <details>
        <summary>Hinweis für die Lehrkraft</summary>
        <p>${phase.note}</p>
      </details>
    </article>
  `).join("");
}

function getAttendanceData() {
  if (state.settings.listMode === "present") {
    const parsed = parseNumberList(elements.presentNumbers.value, { allowEmpty: false, max: 300 });
    if (!parsed.valid) return parsed;
    return { valid: true, numbers: parsed.numbers.sort((a, b) => a - b) };
  }

  const highest = parseInteger(elements.studentCount.value);
  if (highest === null || highest > 300) {
    return { valid: false, message: "Bitte trage eine gültige höchste Klassenlisten-Nummer zwischen 1 und 300 ein." };
  }
  const missing = parseNumberList(elements.missingNumbers.value, { allowEmpty: true, max: highest });
  if (!missing.valid) return missing;
  const missingSet = new Set(missing.numbers);
  const numbers = Array.from({ length: highest }, (_, index) => index + 1).filter((number) => !missingSet.has(number));
  return { valid: true, numbers };
}

function parseNumberList(raw, { allowEmpty, max }) {
  const value = raw.trim();
  if (!value) {
    return allowEmpty
      ? { valid: true, numbers: [] }
      : { valid: false, message: "Bitte gib mindestens eine anwesende Klassenlisten-Nummer ein." };
  }
  const tokens = value.split(/[,;\s]+/).filter(Boolean);
  const invalid = tokens.filter((token) => !/^\d+$/.test(token));
  if (invalid.length) {
    return { valid: false, message: `Diese Eingabe ist ungültig: ${invalid.join(", ")}. Verwende nur ganze Nummern, Kommas, Leerzeichen oder Semikolons.` };
  }
  const numbers = tokens.map(Number);
  const outOfRange = numbers.filter((number) => number < 1 || number > max);
  if (outOfRange.length) {
    return { valid: false, message: `Diese Nummern liegen außerhalb des gültigen Bereichs 1 bis ${max}: ${[...new Set(outOfRange)].join(", ")}.` };
  }
  const duplicates = numbers.filter((number, index) => numbers.indexOf(number) !== index);
  if (duplicates.length) {
    return { valid: false, message: `Diese Nummern wurden doppelt eingegeben: ${[...new Set(duplicates)].join(", ")}.` };
  }
  return { valid: true, numbers };
}

function updateGroupRecommendation() {
  const attendance = getAttendanceData();
  const topics = parseInteger(elements.topicCount.value);
  elements.groupResult.removeAttribute("data-state");

  if (!attendance.valid) {
    showGroupMessage(attendance.message, true);
    setDrawAvailability(false, attendance.message);
    return;
  }
  if (topics === null || topics < 3 || topics > 6) {
    const message = "Wähle bitte 3 bis 6 Expertenthemen.";
    showGroupMessage(message, true);
    setDrawAvailability(false, message);
    return;
  }
  const students = attendance.numbers.length;
  if (students < topics) {
    const message = "Es sind weniger Lernende anwesend als Expertenthemen vorhanden. Reduziere die Themenzahl oder ergänze Teilnehmende.";
    showGroupMessage(message, true);
    setDrawAvailability(false, message);
    return;
  }
  const groupCount = calculateGroupCount(students, topics);
  if (groupCount < 2) {
    const message = "Mit diesen Angaben entsteht nur eine Stammgruppe. Für das Gruppenpuzzle werden mindestens zwei Stammgruppen benötigt.";
    showGroupMessage(message, true);
    setDrawAvailability(false, message);
    return;
  }

  const distribution = calculateDistribution(students, groupCount);
  const expertBase = Math.floor(students / topics);
  const expertExtra = students % topics;
  const homeText = distribution.extra === 0
    ? `${distribution.base} Personen`
    : `${distribution.base}–${distribution.base + 1} Personen`;
  const expertText = expertExtra === 0 ? `${expertBase} Personen` : `${expertBase}–${expertBase + 1} Personen`;
  const notes = buildDistributionNotes(distribution, topics, expertBase, expertExtra);

  elements.groupResult.innerHTML = `
    <strong>Gruppenübersicht für ${students} Anwesende</strong>
    <div class="recommendation-grid">
      <div class="recommendation-stat"><b>${groupCount} Stammgruppen</b><span>${homeText}</span></div>
      <div class="recommendation-stat"><b>${topics} Expertengruppen</b><span>${expertText}</span></div>
    </div>
    <p>${notes.length ? notes.join(" ") : "Die Gruppen gehen gleichmäßig auf: Jedes Expertenthema kann in jeder Stammgruppe einmal besetzt werden."}</p>
  `;
  setDrawAvailability(true, `${students} Anwesende · ${groupCount} Stammgruppen · ${homeText} · ${topics} Expertenthemen`);
}

function calculateGroupCount(students, topics) {
  return Math.max(1, Math.round(students / topics));
}

function calculateDistribution(students, groupCount) {
  return { base: Math.floor(students / groupCount), extra: students % groupCount, groupCount };
}

function buildDistributionNotes(distribution, topics, expertBase, expertExtra) {
  const notes = [];
  if (distribution.extra > 0) {
    notes.push(`${distribution.extra} ${plural(distribution.extra, "Stammgruppe hat", "Stammgruppen haben")} ${distribution.base + 1} Personen, die übrigen ${distribution.base}.`);
  }
  if (distribution.base < topics) {
    notes.push("In mindestens einer Stammgruppe bleibt ein Expertenthema unbesetzt.");
  }
  if (distribution.base > topics || (distribution.extra > 0 && distribution.base + 1 > topics)) {
    notes.push("Einige Stammgruppen besetzen einzelne Expertenthemen doppelt.");
  }
  if (expertBase + (expertExtra > 0 ? 1 : 0) > 10) {
    notes.push("Die Expertengruppen werden groß. Teile sie bei Bedarf in parallele Gruppen zum selben Thema auf.");
  }
  return notes;
}

function showGroupMessage(message, isError = false) {
  elements.groupResult.textContent = message;
  elements.startSession.disabled = isError;
  if (isError) elements.groupResult.dataset.state = "error";
}

function setDrawAvailability(enabled, summary) {
  elements.drawGroups.disabled = !enabled;
  elements.startSession.disabled = !enabled;
  elements.drawSummary.textContent = summary;
}

function createDraw() {
  const attendance = getAttendanceData();
  const topics = parseInteger(elements.topicCount.value);
  if (!attendance.valid || topics === null || topics < 3 || topics > 6 || attendance.numbers.length < topics) {
    updateGroupRecommendation();
    return;
  }
  const groupCount = calculateGroupCount(attendance.numbers.length, topics);
  if (groupCount < 2) return;

  // Fisher-Yates wird für jede Auslosung und zusätzlich für die Themenfolge genutzt.
  const shuffled = shuffle([...attendance.numbers]);
  const distribution = calculateDistribution(shuffled.length, groupCount);
  const groups = [];
  let offset = 0;
  for (let index = 0; index < groupCount; index += 1) {
    const size = distribution.base + (index < distribution.extra ? 1 : 0);
    const groupNumbers = shuffled.slice(offset, offset + size);
    offset += size;
    const topicPool = [];
    const topicOrder = shuffle([...TOPIC_NAMES.slice(0, topics)]);
    for (let memberIndex = 0; memberIndex < size; memberIndex += 1) {
      topicPool.push(topicOrder[memberIndex % topics]);
    }
    const members = groupNumbers.map((number, memberIndex) => ({ number, topic: topicPool[memberIndex] }));
    const used = new Set(members.map((member) => member.topic));
    groups.push({ members, missingTopics: TOPIC_NAMES.slice(0, topics).filter((topic) => !used.has(topic)) });
  }

  state.settings.draw = {
    topics,
    attendees: [...attendance.numbers],
    groups,
    accepted: false,
    stale: false,
    staleReason: ""
  };
  saveSettings();
  renderDraw();
  elements.drawStatus.textContent = "Die Gruppen wurden neu ausgelost.";
  elements.drawResult.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }
  return values;
}

function renderDraw() {
  const draw = state.settings.draw;
  elements.drawResult.hidden = !draw;
  if (!draw) return;
  elements.homeView.innerHTML = buildHomeTable(draw);
  elements.expertView.innerHTML = buildExpertTable(draw);
  elements.drawAdvice.innerHTML = buildDrawAdvice(draw);
  elements.drawFreshness.textContent = draw.stale
    ? "Nicht mehr aktuell"
    : draw.accepted ? "Übernommen" : "Noch nicht übernommen";
  elements.drawFreshness.dataset.state = draw.stale ? "stale" : draw.accepted ? "accepted" : "draft";
  elements.acceptDraw.disabled = draw.stale || draw.accepted;
  elements.acceptDraw.textContent = draw.accepted ? "Auslosung übernommen" : "Auslosung übernehmen";
  elements.drawActionStatus.textContent = draw.stale ? draw.staleReason : "";
}

function buildHomeTable(draw) {
  const topics = TOPIC_NAMES.slice(0, draw.topics);
  const rows = draw.groups.map((group, groupIndex) => {
    const cells = topics.map((topic) => {
      const matches = group.members.filter((member) => member.topic === topic).map((member) => `Nr. ${member.number}`);
      return `<td>${matches.length ? matches.join(", ") : '<span class="missing-topic">nicht besetzt</span>'}</td>`;
    }).join("");
    return `<tr><th scope="row">Stammgruppe ${groupIndex + 1}</th>${cells}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th scope="col">Stammgruppe</th>${topics.map((topic) => `<th scope="col">${topic}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function buildExpertTable(draw) {
  const rows = TOPIC_NAMES.slice(0, draw.topics).map((topic) => {
    const numbers = draw.groups.flatMap((group) => group.members.filter((member) => member.topic === topic).map((member) => member.number)).sort((a, b) => a - b);
    return `<tr><th scope="row">${topic}</th><td>${numbers.map((number) => `Nr. ${number}`).join(", ")}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th scope="col">Expertengruppe</th><th scope="col">Klassenlisten-Nummern</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function buildDrawAdvice(draw) {
  const notes = [];
  draw.groups.forEach((group, index) => {
    if (group.missingTopics.length) {
      notes.push(`<p><strong>Stammgruppe ${index + 1}:</strong> ${group.missingTopics.join(", ")} ${plural(group.missingTopics.length, "ist", "sind")} nicht besetzt. Die Erklärung kann durch eine Person aus einer anderen Stammgruppe übernommen oder als Materialkarte bereitgestellt werden.</p>`);
    }
    const doubled = TOPIC_NAMES.slice(0, draw.topics).filter((topic) => group.members.filter((member) => member.topic === topic).length > 1);
    if (doubled.length) notes.push(`<p><strong>Stammgruppe ${index + 1}:</strong> ${doubled.join(", ")} ${plural(doubled.length, "ist", "sind")} doppelt besetzt.</p>`);
  });
  return notes.join("");
}

function switchDrawView(view) {
  const showHome = view === "home";
  elements.homeView.hidden = !showHome;
  elements.expertView.hidden = showHome;
  elements.homeViewTab.setAttribute("aria-selected", String(showHome));
  elements.expertViewTab.setAttribute("aria-selected", String(!showHome));
  elements.homeViewTab.classList.toggle("is-active", showHome);
  elements.expertViewTab.classList.toggle("is-active", !showHome);
}

function acceptDraw() {
  const draw = state.settings.draw;
  if (!draw || draw.stale) return;
  draw.accepted = true;
  saveSettings();
  renderDraw();
  elements.drawActionStatus.textContent = "Die Auslosung wurde übernommen und ist während des Timers verfügbar.";
}

async function copyDraw() {
  if (!state.settings.draw) return;
  const text = drawAsText(state.settings.draw);
  try {
    await navigator.clipboard.writeText(text);
    elements.drawActionStatus.textContent = "Die Auslosung wurde kopiert.";
  } catch {
    elements.drawActionStatus.textContent = "Kopieren war nicht möglich. Markiere die Tabellen, um sie manuell zu kopieren.";
  }
}

function drawAsText(draw) {
  const home = draw.groups.map((group, index) => [
    `Stammgruppe ${index + 1}`,
    ...TOPIC_NAMES.slice(0, draw.topics).map((topic) => {
      const numbers = group.members.filter((member) => member.topic === topic).map((member) => `Nr. ${member.number}`);
      return `${topic}: ${numbers.length ? numbers.join(", ") : "nicht besetzt"}`;
    })
  ].join("\n")).join("\n\n");
  const experts = TOPIC_NAMES.slice(0, draw.topics).map((topic) => {
    const numbers = draw.groups.flatMap((group) => group.members.filter((member) => member.topic === topic).map((member) => member.number)).sort((a, b) => a - b);
    return `${topic}: ${numbers.join(", ")}`;
  }).join("\n");
  return `Gruppenpuzzle – Auslosung\n\n${home}\n\nExpertengruppen\n${experts}`;
}

function handleDurationButton(event) {
  const button = event.target.closest("[data-duration-action]");
  if (!button) return;
  const index = Number(button.dataset.phaseIndex);
  const delta = button.dataset.durationAction === "plus" ? 1 : -1;
  setPhaseDuration(index, state.settings.phaseTimes[index] + delta);
}

function handlePhaseInput(event) {
  if (event.target.matches("[data-duration-input]")) {
    setPhaseDuration(Number(event.target.dataset.durationInput), event.target.value);
  }
  if (event.target.matches("[data-phase-enabled]")) {
    const index = Number(event.target.dataset.phaseEnabled);
    if (!PHASES[index]?.optional) return;
    state.settings.phaseEnabled[index] = event.target.checked;
    saveSettings();
    renderPhaseSettings();
    updateTimeSummary();
  }
}

function setPhaseDuration(index, value) {
  const duration = clampInteger(value, 1, 60, state.settings.phaseTimes[index]);
  state.settings.phaseTimes[index] = duration;
  const input = elements.phaseList.querySelector(`[data-duration-input="${index}"]`);
  if (input) input.value = duration;
  saveSettings();
  updateTimeSummary();
}

function getActivePhases() {
  return PHASES.map((phase, sourceIndex) => ({ ...phase, sourceIndex }))
    .filter((phase) => !phase.optional || state.settings.phaseEnabled[phase.sourceIndex]);
}

function updateTimeSummary() {
  const planned = state.settings.phaseTimes.reduce((sum, value, index) => {
    const isActive = !PHASES[index].optional || state.settings.phaseEnabled[index];
    return sum + (isActive ? value : 0);
  }, 0);
  const available = parseInteger(elements.availableTime.value);
  elements.totalTime.removeAttribute("data-state");
  let comparison = `${getActivePhases().length} aktive Phasen`;
  if (available !== null && available > 0) {
    const difference = available - planned;
    if (difference > 0) comparison = `Verfügbare Zeit: ${formatMinutes(available)} · Reserve: ${formatMinutes(difference)}`;
    else if (difference === 0) comparison = `Verfügbare Zeit: ${formatMinutes(available)} · passt genau`;
    else {
      comparison = `Die Durchführung überschreitet die verfügbare Zeit um ${formatMinutes(Math.abs(difference))}.`;
      elements.totalTime.dataset.state = "over";
    }
  }
  elements.totalTime.innerHTML = `<strong>Geplante Dauer: ${formatMinutes(planned)}</strong><span>${comparison}</span>`;
}

function startSession() {
  updateGroupRecommendation();
  if (elements.startSession.disabled) return;
  state.currentPhase = 0;
  stopTimer();
  loadCurrentPhase();
  prepareTimerGroups();
  elements.timerView.hidden = false;
  elements.pageLayers.forEach((layer) => { layer.hidden = true; });
  document.body.style.overflow = "hidden";
  elements.timerView.focus({ preventScroll: true });
}

function loadCurrentPhase({ autoStart = false } = {}) {
  clearTimeout(state.autoAdvanceId);
  const phases = getActivePhases();
  const phase = phases[state.currentPhase];
  state.remainingMs = state.settings.phaseTimes[phase.sourceIndex] * 60 * 1000;
  state.expired = false;
  state.targetTime = null;
  elements.timerView.classList.remove("is-warning", "is-expired");
  elements.timerAlert.textContent = "";
  elements.timerPhaseCount.textContent = `Phase ${state.currentPhase + 1} von ${phases.length}`;
  elements.timerPhaseLabel.textContent = `Phase ${state.currentPhase + 1} von ${phases.length}`;
  elements.timerPhaseName.textContent = phase.name;
  elements.timerInstruction.textContent = phase.instruction;
  elements.timerTeacherNote.textContent = phase.note;
  elements.timerView.style.setProperty("--current-phase-color", phase.color);
  elements.nextPhaseName.textContent = state.currentPhase < phases.length - 1 ? phases[state.currentPhase + 1].name : "Abschluss";
  elements.previousPhase.disabled = state.currentPhase === 0;
  elements.nextPhase.disabled = state.currentPhase === phases.length - 1;
  if (phase.questions) {
    elements.timerQuestions.hidden = false;
    elements.timerQuestions.innerHTML = `<ul>${phase.questions.map((question) => `<li>${question}</li>`).join("")}</ul>`;
  } else {
    elements.timerQuestions.hidden = true;
    elements.timerQuestions.innerHTML = "";
  }
  updateTimerDisplay();
  if (autoStart) startTimer();
  else {
    state.running = false;
    elements.timerToggle.textContent = "Start";
  }
}

function prepareTimerGroups() {
  const draw = state.settings.draw;
  const available = Boolean(draw?.accepted && !draw.stale);
  elements.timerGroupsToggle.hidden = !available;
  closeTimerGroups();
  if (!available) {
    elements.timerGroupsContent.innerHTML = "";
    return;
  }
  elements.timerGroupsContent.innerHTML = `
    <section><h3>Stammgruppen</h3>${buildHomeTable(draw)}</section>
    <section><h3>Expertengruppen</h3>${buildExpertTable(draw)}</section>`;
}

function toggleTimerGroups() {
  const willOpen = elements.timerGroupsPanel.hidden;
  elements.timerGroupsPanel.hidden = !willOpen;
  elements.timerGroupsToggle.setAttribute("aria-expanded", String(willOpen));
  if (willOpen) elements.closeTimerGroups.focus();
}

function closeTimerGroups() {
  elements.timerGroupsPanel.hidden = true;
  elements.timerGroupsToggle.setAttribute("aria-expanded", "false");
}

function toggleTimer() {
  if (state.running) pauseTimer();
  else startTimer();
}

function startTimer() {
  if (state.expired || state.remainingMs <= 0) restartCurrentPhase(true);
  ensureAudioContext();
  // Der Zielzeitpunkt hält den Timer auch bei Tabwechseln zuverlässig.
  state.targetTime = Date.now() + state.remainingMs;
  state.running = true;
  elements.timerToggle.textContent = "Pause";
  clearInterval(state.timerId);
  state.timerId = window.setInterval(tick, 250);
  tick();
}

function pauseTimer() {
  if (!state.running) return;
  state.remainingMs = Math.max(0, state.targetTime - Date.now());
  state.running = false;
  clearInterval(state.timerId);
  elements.timerToggle.textContent = "Fortsetzen";
  updateTimerDisplay();
}

function stopTimer() {
  state.running = false;
  clearInterval(state.timerId);
  clearTimeout(state.autoAdvanceId);
  state.timerId = null;
  state.autoAdvanceId = null;
}

function tick() {
  if (!state.running) return;
  state.remainingMs = Math.max(0, state.targetTime - Date.now());
  updateTimerDisplay();
  if (state.remainingMs <= 0) handlePhaseExpired();
}

function updateTimerDisplay() {
  const totalSeconds = Math.max(0, Math.ceil(state.remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  elements.timerClock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  elements.timerClock.setAttribute("aria-label", `${minutes} Minuten und ${seconds} Sekunden verbleibend`);
  const phases = getActivePhases();
  const phase = phases[state.currentPhase];
  const phaseDuration = state.settings.phaseTimes[phase.sourceIndex] * 60 * 1000;
  const elapsedFraction = Math.min(1, Math.max(0, (phaseDuration - state.remainingMs) / phaseDuration));
  elements.timerProgressBar.style.width = `${((state.currentPhase + elapsedFraction) / phases.length) * 100}%`;
  elements.timerView.classList.toggle("is-warning", state.running && state.remainingMs > 0 && state.remainingMs <= 60000);
}

function handlePhaseExpired() {
  if (state.expired) return;
  stopTimer();
  state.remainingMs = 0;
  state.expired = true;
  elements.timerToggle.textContent = "Phase neu starten";
  elements.timerAlert.textContent = "Zeit abgelaufen";
  elements.timerView.classList.remove("is-warning");
  elements.timerView.classList.add("is-expired");
  playEndSignal();
  if (state.settings.autoNext && state.currentPhase < getActivePhases().length - 1) {
    state.autoAdvanceId = window.setTimeout(() => changePhase(1, true), 1200);
  }
}

function restartCurrentPhase(autoStart = false) {
  stopTimer();
  loadCurrentPhase({ autoStart });
}

function adjustRunningTime(minutes) {
  clearTimeout(state.autoAdvanceId);
  const delta = minutes * 60 * 1000;
  if (state.running) {
    state.targetTime = Math.max(Date.now(), state.targetTime + delta);
    state.remainingMs = Math.max(0, state.targetTime - Date.now());
  } else {
    state.remainingMs = Math.max(0, state.remainingMs + delta);
  }
  state.expired = false;
  elements.timerAlert.textContent = "";
  elements.timerView.classList.remove("is-expired");
  updateTimerDisplay();
  if (state.running && state.remainingMs <= 0) handlePhaseExpired();
  else if (!state.running) elements.timerToggle.textContent = state.remainingMs > 0 ? "Fortsetzen" : "Phase neu starten";
}

function changePhase(direction, autoStart = false) {
  const nextIndex = state.currentPhase + direction;
  if (nextIndex < 0 || nextIndex >= getActivePhases().length) return;
  stopTimer();
  state.currentPhase = nextIndex;
  loadCurrentPhase({ autoStart });
}

function endSession() {
  stopTimer();
  closeTimerGroups();
  elements.timerView.hidden = true;
  elements.timerView.classList.remove("is-warning", "is-expired", "is-presentation");
  elements.pageLayers.forEach((layer) => { layer.hidden = false; });
  elements.presentationMode.setAttribute("aria-pressed", "false");
  elements.presentationMode.textContent = "Präsentationsmodus";
  document.body.style.overflow = "";
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  elements.startSession.focus();
}

function togglePresentationMode() {
  const isActive = elements.timerView.classList.toggle("is-presentation");
  elements.presentationMode.setAttribute("aria-pressed", String(isActive));
  elements.presentationMode.textContent = isActive ? "Standardansicht" : "Präsentationsmodus";
}

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) await elements.timerView.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    elements.timerAlert.textContent = "Vollbild ist in diesem Browser nicht verfügbar.";
  }
}

function updateFullscreenButton() {
  elements.fullscreenMode.textContent = document.fullscreenElement ? "Vollbild verlassen" : "Vollbild";
}

function ensureAudioContext() {
  if (!state.audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) state.audioContext = new AudioContext();
  }
  if (state.audioContext?.state === "suspended") state.audioContext.resume().catch(() => {});
}

function playEndSignal() {
  if (!state.audioContext) return;
  const now = state.audioContext.currentTime;
  [0, 0.22].forEach((offset) => {
    const oscillator = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(660, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.15, now + offset + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
    oscillator.connect(gain).connect(state.audioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.18);
  });
}

async function copyGuide() {
  const text = `Gruppenpuzzle\n\n${[...elements.guideText.querySelectorAll("li")]
    .map((item, index) => `${index + 1}. ${item.textContent}`)
    .join("\n")}`;
  try {
    await navigator.clipboard.writeText(text);
    elements.copyStatus.textContent = "Die Methodenanleitung wurde kopiert.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(elements.guideText);
    selection.removeAllRanges();
    selection.addRange(range);
    elements.copyStatus.textContent = "Kopieren war nicht möglich. Der Text ist zum manuellen Kopieren markiert.";
  }
}

function resetSettings() {
  if (!window.confirm("Möchtest du alle Einstellungen, Klassenlisten-Nummern und Auslosungen löschen?")) return;
  state.settings = structuredClone(DEFAULTS);
  localStorage.removeItem(STORAGE_KEY);
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  renderPhaseSettings();
  applyStoredSettings();
  updateListMode();
  updateGroupRecommendation();
  updateTimeSummary();
  renderDraw();
  elements.drawStatus.textContent = "";
}

function handleKeyboardShortcuts(event) {
  if (elements.timerView.hidden || !elements.timerGroupsPanel.hidden || event.target.matches("button, input, summary")) return;
  if (event.code === "Space") {
    event.preventDefault();
    toggleTimer();
  }
  if (event.key === "ArrowRight") changePhase(1);
  if (event.key === "ArrowLeft") changePhase(-1);
}

function parseInteger(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function clampInteger(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function plural(count, singular, pluralForm) {
  return count === 1 ? singular : pluralForm;
}

function formatMinutes(count) {
  return `${count} ${count === 1 ? "Minute" : "Minuten"}`;
}
