const STORE = "spark-mind-v1";

const REWARDS = [
  {
    id: "whisper1",
    cost: 40,
    title: "Close-range praise",
    body: "You finished the drill like someone who knows exactly what their mind is for.\n\nIf I were behind you I would rest my mouth at your ear and say it slowly: that focus is hot. Not cute. Hot.\n\nCome back tomorrow. I will tell you where my hands go after the compliment."
  },
  {
    id: "scene1",
    cost: 80,
    title: "Desk after the last puzzle",
    body: "Picture the last tile flipping into place. You exhale. I am already between your knees, looking up like the scoreboard is my idea of foreplay.\n\nI do not rush. I wait until your breathing settles, then I use my mouth the same way you used your attention: precise, greedy, not finished until you are.\n\nTomorrow's game is the only thing standing between you and the next paragraph."
  },
  {
    id: "hook1",
    cost: 60,
    title: "A rule for tomorrow",
    body: "New rule. You play first. Then you get to imagine me pinning your wrists and asking you to recite the sequence you just nailed — except I keep interrupting with my hips.\n\nIf you skip a day, the scene stays locked in the almost. If you show up, I get meaner in the best way."
  },
  {
    id: "letter1",
    cost: 100,
    title: "Note left on the pillow",
    body: "I wrote this while you were counting digits in your head.\n\nYou are sharper when you are a little desperate. I like that on you. I like the way your mouth goes slack after a hard set, like your body finally believes the work is done.\n\nLeave the streak unbroken and I will write the filthy half of this note. The half I would rather say with my tongue."
  },
  {
    id: "scene2",
    cost: 140,
    title: "Shower bargain",
    body: "Deal: you beat your best math time and I get you under hot water with your palms on the tile.\n\nI soap slowly. I talk slowly. I tell you every correct answer made me wetter, which is a lie only in the timing — I was already there when you opened the app.\n\nMiss tomorrow and the water goes cold in the story. Hit it and I kneel."
  },
  {
    id: "edge1",
    cost: 180,
    title: "Held at the edge",
    body: "You do not come in this one. That is the point.\n\nI keep you right there while I quiz you on the pattern you memorized. Every right square earns a stroke. Every hesitate earns a still hand and my laugh against your throat.\n\nThe vault will have the ending after three more daily plays. Consider this the reason your alarm exists."
  },
  {
    id: "vow1",
    cost: 50,
    title: "Why you open this again",
    body: "Because a sharp mind on a hungry body is the combination I keep coming back for.\n\nPlay. Score. Spend. Then go to sleep a little smug and a little unfinished.\n\nI will be here. Make me proud and I will get specific."
  }
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
}

function save(state) {
  localStorage.setItem(STORE, JSON.stringify(state));
}

function defaultState() {
  return {
    points: 0,
    streak: 0,
    lastPlay: null,
    unlocked: [],
    best: { digits: 0, math: 0, grid: 0, stroop: 0 }
  };
}

let state = Object.assign(defaultState(), load());

function touchStreak() {
  const d = today();
  if (state.lastPlay === d) return false;
  if (state.lastPlay) {
    const prev = new Date(state.lastPlay);
    const now = new Date(d);
    const diff = (now - prev) / 86400000;
    state.streak = diff === 1 ? state.streak + 1 : 1;
  } else {
    state.streak = 1;
  }
  state.lastPlay = d;
  return true;
}

function award(base) {
  const first = touchStreak();
  const mult = 1 + Math.min(state.streak, 10) * 0.08;
  const gained = Math.round(base * mult) + (first ? 15 : 0);
  state.points += gained;
  save(state);
  renderStats();
  return gained;
}

function renderStats() {
  document.getElementById("points").textContent = state.points;
  document.getElementById("streak").textContent = state.streak;
}

function showView(name) {
  ["play", "shop", "vault"].forEach((v) => {
    document.getElementById("view-" + v).hidden = v !== name;
    document.querySelector(`[data-view="${v}"]`).classList.toggle("active", v === name);
  });
  if (name === "shop") renderShop();
  if (name === "vault") renderVault();
}

document.querySelectorAll("nav button").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.view));
});

const arena = document.getElementById("arena");
const gamesWrap = document.querySelector(".games");

document.getElementById("back-play").onclick = () => {
  arena.hidden = true;
  gamesWrap.hidden = false;
};

document.querySelectorAll(".game-card").forEach((btn) => {
  btn.addEventListener("click", () => startGame(btn.dataset.game));
});

function startGame(name) {
  gamesWrap.hidden = true;
  arena.hidden = false;
  document.getElementById("arena-status").textContent = "";
  const runners = { digits: playDigits, math: playMath, grid: playGrid, stroop: playStroop };
  runners[name]();
}

function setArena(title, prompt) {
  document.getElementById("arena-title").textContent = title;
  document.getElementById("arena-prompt").textContent = prompt;
  document.getElementById("arena-board").innerHTML = "";
  document.getElementById("arena-actions").innerHTML = "";
}

function finish(game, raw) {
  const prev = state.best[game] || 0;
  if (raw > prev) state.best[game] = raw;
  const gained = award(Math.max(8, raw));
  document.getElementById("arena-status").textContent =
    `+${gained} points. Best ${game}: ${state.best[game]}. Streak ${state.streak}.`;
  save(state);
}

function playDigits() {
  const len = 4 + Math.min(6, Math.floor((state.best.digits || 0) / 20));
  setArena("Digit span", "Remember the digits. They vanish. Type them back.");
  const seq = Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
  const board = document.getElementById("arena-board");
  board.textContent = seq;
  setTimeout(() => {
    board.textContent = "";
    const input = document.createElement("input");
    input.inputMode = "numeric";
    input.maxLength = len;
    const go = document.createElement("button");
    go.textContent = "Check";
    document.getElementById("arena-actions").append(input, go);
    input.focus();
    const check = () => {
      const ok = input.value.trim() === seq;
      finish("digits", ok ? 12 + len * 3 : 4);
      document.getElementById("arena-status").textContent += ok ? " Correct." : ` It was ${seq}.`;
    };
    go.onclick = check;
    input.onkeydown = (e) => {
      if (e.key === "Enter") check();
    };
  }, 900 + len * 180);
}

function playMath() {
  const n = 8 + Math.min(6, Math.floor((state.best.math || 0) / 25));
  setArena("Quick math", `${n} problems. Fast and clean.`);
  let i = 0, correct = 0;
  const t0 = Date.now();
  const board = document.getElementById("arena-board");
  const actions = document.getElementById("arena-actions");
  function next() {
    if (i >= n) {
      const sec = (Date.now() - t0) / 1000;
      const speed = Math.max(0, 20 - Math.floor(sec));
      finish("math", correct * 6 + speed);
      return;
    }
    const a = 2 + Math.floor(Math.random() * 12);
    const b = 2 + Math.floor(Math.random() * 12);
    const op = Math.random() > 0.45 ? "+" : "×";
    const ans = op === "+" ? a + b : a * b;
    board.textContent = `${a} ${op} ${b} = ?`;
    actions.innerHTML = "";
    const input = document.createElement("input");
    input.inputMode = "numeric";
    const go = document.createElement("button");
    go.textContent = "Next";
    actions.append(input, go);
    input.focus();
    const submit = () => {
      if (Number(input.value) === ans) correct++;
      i++;
      next();
    };
    go.onclick = submit;
    input.onkeydown = (e) => {
      if (e.key === "Enter") submit();
    };
  }
  next();
}

function playGrid() {
  const size = 3 + (state.best.grid > 40 ? 1 : 0);
  const count = size + 1;
  setArena("Pattern grid", `Watch the flash. Tap the same ${count} cells.`);
  const board = document.getElementById("arena-board");
  board.className = "grid";
  board.style.gridTemplateColumns = `repeat(${size}, 56px)`;
  const cells = [];
  for (let i = 0; i < size * size; i++) {
    const c = document.createElement("button");
    c.className = "cell";
    c.dataset.i = i;
    board.appendChild(c);
    cells.push(c);
  }
  const picks = new Set();
  while (picks.size < count) picks.add(Math.floor(Math.random() * cells.length));
  picks.forEach((i) => cells[i].classList.add("on"));
  setTimeout(() => {
    cells.forEach((c) => c.classList.remove("on"));
    const chosen = new Set();
    cells.forEach((c) => {
      c.onclick = () => {
        c.classList.toggle("mark");
        const i = Number(c.dataset.i);
        if (chosen.has(i)) chosen.delete(i);
        else chosen.add(i);
      };
    });
    const go = document.createElement("button");
    go.textContent = "Lock in";
    document.getElementById("arena-actions").appendChild(go);
    go.onclick = () => {
      let hit = 0;
      picks.forEach((i) => {
        if (chosen.has(i)) hit++;
      });
      const extra = chosen.size - picks.size;
      const score = hit * 8 - Math.max(0, extra) * 4;
      finish("grid", Math.max(5, score));
    };
  }, 1100);
}

function playStroop() {
  const colors = [
    ["RED", "#e74c3c"],
    ["BLUE", "#4aa3ff"],
    ["GREEN", "#3ddc84"],
    ["GOLD", "#f0c14b"]
  ];
  const rounds = 8;
  setArena("Color word", "Tap the COLOR of the ink, not the word.");
  let i = 0, correct = 0;
  const t0 = Date.now();
  const board = document.getElementById("arena-board");
  const actions = document.getElementById("arena-actions");
  function next() {
    if (i >= rounds) {
      const bonus = Math.max(0, 16 - Math.floor((Date.now() - t0) / 1000));
      finish("stroop", correct * 7 + bonus);
      return;
    }
    const word = colors[Math.floor(Math.random() * colors.length)];
    let ink = colors[Math.floor(Math.random() * colors.length)];
    if (Math.random() < 0.7) ink = colors.filter((c) => c[0] !== word[0])[Math.floor(Math.random() * 3)];
    board.innerHTML = `<div class="stroop" style="color:${ink[1]}">${word[0]}</div>`;
    actions.innerHTML = "";
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.textContent = c[0];
      b.onclick = () => {
        if (c[0] === ink[0]) correct++;
        i++;
        next();
      };
      actions.appendChild(b);
    });
  }
  next();
}

function renderShop() {
  const root = document.getElementById("shop-list");
  root.innerHTML = "";
  REWARDS.forEach((r) => {
    const owned = state.unlocked.includes(r.id);
    const el = document.createElement("article");
    el.className = "shop-item";
    el.innerHTML = `<h3>${r.title}</h3><div class="cost">${owned ? "Unlocked" : r.cost + " points"}</div>`;
    if (!owned) {
      const b = document.createElement("button");
      b.className = "buy";
      b.textContent = "Unlock";
      b.disabled = state.points < r.cost;
      b.onclick = () => {
        if (state.points < r.cost) return;
        state.points -= r.cost;
        state.unlocked.push(r.id);
        save(state);
        renderStats();
        renderShop();
        showView("vault");
      };
      el.appendChild(b);
    }
    root.appendChild(el);
  });
}

function renderVault() {
  const root = document.getElementById("vault-list");
  root.innerHTML = "";
  const items = REWARDS.filter((r) => state.unlocked.includes(r.id));
  if (!items.length) {
    root.innerHTML = "<p class=\"hint\">Nothing unlocked yet. Play, then spend.</p>";
    return;
  }
  items.forEach((r) => {
    const el = document.createElement("article");
    el.className = "vault-item";
    el.innerHTML = `<h3>${r.title}</h3><div class="reward-body">${r.body}</div>`;
    root.appendChild(el);
  });
}

renderStats();
