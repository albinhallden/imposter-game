const state = {
  screen: "setup",
  players: 6,
  imposters: 1,
  category: CATEGORY_NAMES[0],
  playerNames: [],
  secretWord: "",
  imposterIndexes: [],
  revealIndex: 0,
  cardRevealed: false,
  timerSeconds: 0,
  timerHandle: null,
};

const app = document.getElementById("app");

function pickWord(category) {
  const pool = category === "All"
    ? Object.values(WORD_CATEGORIES).flat()
    : WORD_CATEGORIES[category];
  return pool[Math.floor(Math.random() * pool.length)];
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
    result.push(existing[i] || `Player ${i + 1}`);
  }
  state.playerNames = result;
}

function startGame() {
  state.secretWord = pickWord(state.category);
  state.imposterIndexes = pickImposters(state.players, state.imposters);
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
  else if (state.screen === "names") renderNames();
  else if (state.screen === "reveal") renderReveal();
  else if (state.screen === "discuss") renderDiscuss();
  else if (state.screen === "result") renderResult();
}

function renderSetup() {
  const categoryOptions = [...CATEGORY_NAMES, "All"]
    .map((c) => `<option value="${c}" ${c === state.category ? "selected" : ""}>${c}</option>`)
    .join("");

  app.innerHTML = `
    <div class="screen setup-screen">
      <h1>Imposter</h1>
      <p class="subtitle">Pass the phone around. Everyone except the impostor gets a secret word.</p>

      <label class="field">
        Number of players
        <div class="stepper">
          <button id="players-minus" class="step-btn">−</button>
          <span id="players-value">${state.players}</span>
          <button id="players-plus" class="step-btn">+</button>
        </div>
      </label>

      <label class="field">
        Number of impostors
        <div class="stepper">
          <button id="imposters-minus" class="step-btn">−</button>
          <span id="imposters-value">${state.imposters}</span>
          <button id="imposters-plus" class="step-btn">+</button>
        </div>
      </label>

      <label class="field">
        Category
        <select id="category-select">${categoryOptions}</select>
      </label>

      <button id="start-btn" class="primary-btn">Continue</button>
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
}

function maxImposters() {
  return Math.max(1, state.players - 2);
}

function renderNames() {
  const inputs = state.playerNames
    .map(
      (name, i) => `
        <label class="field name-field">
          Player ${i + 1}
          <input type="text" class="name-input" data-index="${i}" value="${name.replace(/"/g, "&quot;")}" maxlength="20">
        </label>
      `
    )
    .join("");

  app.innerHTML = `
    <div class="screen names-screen">
      <h1>Name Your Players</h1>
      <p class="subtitle">Enter each player's name, or keep the defaults.</p>
      <div class="name-list">${inputs}</div>
      <button id="start-game-btn" class="primary-btn">Start Game</button>
      <button id="back-btn" class="secondary-btn">Back</button>
    </div>
  `;

  document.querySelectorAll(".name-input").forEach((input) => {
    input.oninput = (e) => {
      const i = Number(e.target.dataset.index);
      state.playerNames[i] = e.target.value.trim() || `Player ${i + 1}`;
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
  const playerName = state.playerNames[state.revealIndex] || `Player ${playerNum}`;
  const isImposter = state.imposterIndexes.includes(state.revealIndex);

  app.innerHTML = `
    <div class="screen reveal-screen">
      <p class="pass-label">Pass the phone to</p>
      <h1>${playerName}</h1>

      <div id="card" class="card ${state.cardRevealed ? "revealed" : ""}">
        <div class="card-face card-front">
          <span>Tap to reveal</span>
        </div>
        <div class="card-face card-back ${isImposter ? "imposter" : ""}">
          ${isImposter
            ? `<span class="imposter-text">YOU ARE THE<br>IMPOSTOR</span>`
            : `<span class="word-label">Your word</span><span class="word-text">${state.secretWord}</span>`}
        </div>
      </div>

      <button id="next-btn" class="primary-btn" ${state.cardRevealed ? "" : "disabled"}>
        ${playerNum < state.players ? "Hide & continue" : "Hide & start discussion"}
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
  app.innerHTML = `
    <div class="screen discuss-screen">
      <h1>Discuss</h1>
      <p class="subtitle">Everyone describes the word with one word at a time. Then vote on who you think the impostor is.</p>

      <div id="timer-display" class="timer-display">${formatTime(state.timerSeconds)}</div>

      <div class="timer-buttons">
        <button data-secs="60" class="secondary-btn timer-btn">1 min</button>
        <button data-secs="180" class="secondary-btn timer-btn">3 min</button>
        <button data-secs="300" class="secondary-btn timer-btn">5 min</button>
      </div>

      <button id="reveal-result-btn" class="primary-btn">Reveal the Impostor</button>
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
    .map((i) => state.playerNames[i] || `Player ${i + 1}`)
    .join(", ");
  const label = state.imposterIndexes.length > 1 ? "The impostors were:" : "The impostor was:";

  app.innerHTML = `
    <div class="screen result-screen">
      <h1>Reveal</h1>
      <p class="reveal-line">The word was:</p>
      <p class="reveal-word">${state.secretWord}</p>
      <p class="reveal-line">${label}</p>
      <p class="reveal-imposter">${imposterList}</p>

      <button id="new-round-btn" class="primary-btn">New Round, Same Players</button>
      <button id="new-game-btn" class="secondary-btn">New Game</button>
    </div>
  `;

  document.getElementById("new-round-btn").onclick = newRound;
  document.getElementById("new-game-btn").onclick = newGame;
}

render();
