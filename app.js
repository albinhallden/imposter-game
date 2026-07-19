const LANG = typeof window.LANG === "string" && TRANSLATIONS[window.LANG] ? window.LANG : "en";
const T = TRANSLATIONS[LANG];
const WORDS = WORD_CATEGORIES_BY_LANG[LANG];

const state = {
  screen: "setup",
  players: 6,
  imposters: 1,
  category: "all",
  playerNames: [],
  secretWord: "",
  secretWordCategory: "",
  imposterIndexes: [],
  starterIndex: 0,
  revealIndex: 0,
  cardRevealed: false,
  timerSeconds: 0,
  timerHandle: null,
};

const app = document.getElementById("app");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pickWord(categoryId) {
  const entries =
    categoryId === "all"
      ? Object.entries(WORDS).flatMap(([id, words]) => words.map((word) => ({ word, categoryId: id })))
      : WORDS[categoryId].map((word) => ({ word, categoryId }));
  return entries[Math.floor(Math.random() * entries.length)];
}

function pickImposters(playerCount, imposterCount) {
  const indexes = Array.from({ length: playerCount }, (_, i) => i);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes.slice(0, imposterCount);
}

function ensurePlayerNames() {
  const existing = state.playerNames || [];
  const result = [];
  for (let i = 0; i < state.players; i++) {
    result.push(existing[i] || `${T.playerWord} ${i + 1}`);
  }
  state.playerNames = result;
}

function startGame() {
  const picked = pickWord(state.category);
  state.secretWord = picked.word;
  state.secretWordCategory = picked.categoryId;
  state.imposterIndexes = pickImposters(state.players, state.imposters);
  state.starterIndex = Math.floor(Math.random() * state.players);
  state.revealIndex = 0;
  state.cardRevealed = false;
  state.screen = "reveal";
  render();
}

function newRound() {
  startGame();
}

function newGame() {
  stopTimer();
  state.timerSeconds = 0;
  state.screen = "setup";
  render();
}

function stopTimer() {
  if (state.timerHandle) {
    clearInterval(state.timerHandle);
    state.timerHandle = null;
  }
}

function startTimer(seconds) {
  stopTimer();
  state.timerSeconds = seconds;
  state.timerHandle = setInterval(() => {
    state.timerSeconds--;
    if (state.timerSeconds <= 0) {
      stopTimer();
      state.timerSeconds = 0;
    }
    renderTimerOnly();
  }, 1000);
  render();
}

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function renderTimerOnly() {
  const el = document.getElementById("timer-display");
  if (el) el.textContent = formatTime(state.timerSeconds);
}

function render() {
  if (state.screen === "setup") renderSetup();
  else if (state.screen === "howto") renderHowToPlay();
  else if (state.screen === "names") renderNames();
  else if (state.screen === "reveal") renderReveal();
  else if (state.screen === "discuss") renderDiscuss();
  else if (state.screen === "result") renderResult();
}

function languageSwitcherHtml() {
  const links = LANGUAGE_CODES.map((code) => {
    const active = code === LANG ? "active" : "";
    return `<a class="lang-pill ${active}" href="/${code}/">${TRANSLATIONS[code].flag} ${TRANSLATIONS[code].nativeName}</a>`;
  }).join("");
  return `<div class="lang-switcher">${links}</div>`;
}

function renderSetup() {
  const categoryOptions = ["all", ...CATEGORY_IDS]
    .map((id) => `<option value="${id}" ${id === state.category ? "selected" : ""}>${T.categories[id]}</option>`)
    .join("");

  app.innerHTML = `
    <div class="screen setup-screen">
      ${languageSwitcherHtml()}
      <h1>Imposter</h1>
      <p class="subtitle">${T.subtitleSetup}</p>

      <label class="field">
        ${T.playersLabel}
        <div class="stepper">
          <button id="players-minus" class="step-btn">−</button>
          <span id="players-value">${state.players}</span>
          <button id="players-plus" class="step-btn">+</button>
        </div>
      </label>

      <label class="field">
        ${T.impostersLabel}
        <div class="stepper">
          <button id="imposters-minus" class="step-btn">−</button>
          <span id="imposters-value">${state.imposters}</span>
          <button id="imposters-plus" class="step-btn">+</button>
        </div>
      </label>

      <label class="field">
        ${T.categoryLabel}
        <select id="category-select">${categoryOptions}</select>
      </label>

      <button id="start-btn" class="primary-btn">${T.continueBtn}</button>
      <button id="how-to-play-btn" class="secondary-btn">${T.howToPlayBtn}</button>
    </div>
  `;

  document.getElementById("players-minus").onclick = () => {
    state.players = Math.max(3, state.players - 1);
    state.imposters = Math.min(state.imposters, maxImposters());
    renderSetup();
  };
  document.getElementById("players-plus").onclick = () => {
    state.players = Math.min(20, state.players + 1);
    renderSetup();
  };
  document.getElementById("imposters-minus").onclick = () => {
    state.imposters = Math.max(1, state.imposters - 1);
    renderSetup();
  };
  document.getElementById("imposters-plus").onclick = () => {
    state.imposters = Math.min(maxImposters(), state.imposters + 1);
    renderSetup();
  };
  document.getElementById("category-select").onchange = (e) => {
    state.category = e.target.value;
  };
  document.getElementById("start-btn").onclick = () => {
    ensurePlayerNames();
    state.screen = "names";
    render();
  };
  document.getElementById("how-to-play-btn").onclick = () => {
    state.screen = "howto";
    render();
  };
}

function renderHowToPlay() {
  const steps = T.howToPlaySteps.map((step) => `<li>${step}</li>`).join("");

  app.innerHTML = `
    <div class="screen howto-screen">
      <h1>${T.howToPlayTitle}</h1>
      <ol class="howto-steps">${steps}</ol>
      <button id="howto-back-btn" class="primary-btn">${T.backBtn}</button>
    </div>
  `;

  document.getElementById("howto-back-btn").onclick = () => {
    state.screen = "setup";
    render();
  };
}

function maxImposters() {
  return Math.max(1, state.players - 2);
}

function renderNames() {
  const inputs = state.playerNames
    .map(
      (name, i) => `
        <label class="field name-field">
          ${T.playerWord} ${i + 1}
          <input type="text" class="name-input" data-index="${i}" value="${escapeHtml(name)}" maxlength="20">
        </label>
      `
    )
    .join("");

  app.innerHTML = `
    <div class="screen names-screen">
      <h1>${T.namesTitle}</h1>
      <p class="subtitle">${T.namesSubtitle}</p>
      <div class="name-list">${inputs}</div>
      <button id="start-game-btn" class="primary-btn">${T.startGameBtn}</button>
      <button id="back-btn" class="secondary-btn">${T.backBtn}</button>
    </div>
  `;

  document.querySelectorAll(".name-input").forEach((input) => {
    input.oninput = (e) => {
      const i = Number(e.target.dataset.index);
      state.playerNames[i] = e.target.value.trim() || `${T.playerWord} ${i + 1}`;
    };
  });
  document.getElementById("start-game-btn").onclick = startGame;
  document.getElementById("back-btn").onclick = () => {
    state.screen = "setup";
    render();
  };
}

function renderReveal() {
  const playerNum = state.revealIndex + 1;
  const playerName = state.playerNames[state.revealIndex] || `${T.playerWord} ${playerNum}`;
  const isImposter = state.imposterIndexes.includes(state.revealIndex);

  app.innerHTML = `
    <div class="screen reveal-screen">
      <p class="pass-label">${T.passLabel}</p>
      <h1>${escapeHtml(playerName)}</h1>

      <div id="card" class="card ${state.cardRevealed ? "revealed" : ""}">
        <div class="card-face card-front">
          <span>${T.tapToReveal}</span>
        </div>
        <div class="card-face card-back ${isImposter ? "imposter" : ""}">
          ${isImposter
            ? `<span class="imposter-text">${T.impostorLine1}<br>${T.impostorLine2}</span>`
            : `<span class="word-label">${T.yourWordLabel}</span><span class="word-text">${state.secretWord}</span><span class="word-category">${T.categories[state.secretWordCategory]}</span>`}
        </div>
      </div>

      <button id="next-btn" class="primary-btn" ${state.cardRevealed ? "" : "disabled"}>
        ${playerNum < state.players ? T.hideContinueBtn : T.hideStartDiscussionBtn}
      </button>
    </div>
  `;

  document.getElementById("card").onclick = () => {
    state.cardRevealed = true;
    renderReveal();
  };
  document.getElementById("next-btn").onclick = (e) => {
    e.stopPropagation();
    if (!state.cardRevealed) return;
    if (state.revealIndex + 1 < state.players) {
      state.revealIndex++;
      state.cardRevealed = false;
      renderReveal();
    } else {
      state.screen = "discuss";
      render();
    }
  };
}

function renderDiscuss() {
  const starterName = state.playerNames[state.starterIndex] || `${T.playerWord} ${state.starterIndex + 1}`;

  app.innerHTML = `
    <div class="screen discuss-screen">
      <h1>${T.discussTitle}</h1>
      <p class="subtitle">${T.discussSubtitle}</p>
      <p class="starter-label">${T.starterLabel}</p>
      <p class="starter-name">${escapeHtml(starterName)}</p>

      <div id="timer-display" class="timer-display">${formatTime(state.timerSeconds)}</div>

      <div class="timer-buttons">
        <button data-secs="60" class="secondary-btn timer-btn">1 ${T.minWord}</button>
        <button data-secs="180" class="secondary-btn timer-btn">3 ${T.minWord}</button>
        <button data-secs="300" class="secondary-btn timer-btn">5 ${T.minWord}</button>
      </div>

      <button id="reveal-result-btn" class="primary-btn">${T.revealImpostorBtn}</button>
    </div>
  `;

  document.querySelectorAll(".timer-btn").forEach((btn) => {
    btn.onclick = () => startTimer(Number(btn.dataset.secs));
  });
  document.getElementById("reveal-result-btn").onclick = () => {
    stopTimer();
    state.screen = "result";
    render();
  };
}

function renderResult() {
  const imposterList = state.imposterIndexes
    .slice()
    .sort((a, b) => a - b)
    .map((i) => escapeHtml(state.playerNames[i] || `${T.playerWord} ${i + 1}`))
    .join(", ");
  const label = state.imposterIndexes.length > 1 ? T.impostorsWereLabel : T.impostorWasLabel;

  app.innerHTML = `
    <div class="screen result-screen">
      <h1>${T.revealTitle}</h1>
      <p class="reveal-line">${T.wordWasLabel}</p>
      <p class="reveal-word">${state.secretWord}</p>
      <p class="reveal-category">${T.categories[state.secretWordCategory]}</p>
      <p class="reveal-line">${label}</p>
      <p class="reveal-imposter">${imposterList}</p>

      <button id="new-round-btn" class="primary-btn">${T.newRoundBtn}</button>
      <button id="new-game-btn" class="secondary-btn">${T.newGameBtn}</button>
    </div>
  `;

  document.getElementById("new-round-btn").onclick = newRound;
  document.getElementById("new-game-btn").onclick = newGame;
}

render();
