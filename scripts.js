/* scripts.js - Band Key Trainer */

const concertKeys = ["F", "B♭", "A♭", "E♭"];
const instrumentMap = {
  bravo: { F: "G", "B♭": "C", "A♭": "B♭", "E♭": "F" },
  charlie: { F: "F", "B♭": "B♭", "A♭": "A♭", "E♭": "E♭" },
  foxtrot: { F: "C", "B♭": "F", "A♭": "E♭", "E♭": "B♭" },
  echo: { F: "D", "B♭": "G", "A♭": "F", "E♭": "C" }
};
const keySignatures = {
  "C": ["All Natural"], "G": ["F♯"], "D": ["F♯", "C♯"],
  "A": ["F♯", "C♯", "G♯"], "E": ["F♯", "C♯", "G♯", "D♯"],
  "B": ["F♯", "C♯", "G♯", "D♯", "A♯"], "F♯": ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯"],
  "F": ["B♭"], "B♭": ["B♭", "E♭"], "E♭": ["B♭", "E♭", "A♭"],
  "A♭": ["B♭", "E♭", "A♭", "D♭"], "D♭": ["B♭", "E♭", "A♭", "D♭", "G♭"],
  "G♭": ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭"]
};

/* UI elements */
const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const startBtn = document.getElementById("start-btn");
const instrumentSelect = document.getElementById("instrument");
const concertKeyEl = document.getElementById("concert-key");
const userProgressEl = document.getElementById("user-progress");
const accButtons = document.querySelectorAll(".acc-btn");
const clearBtn = document.getElementById("clear-btn");
const checkBtn = document.getElementById("check-answer");
const resultEl = document.getElementById("result");
const progressBar = document.getElementById("progress-bar");
const circleSvg = document.getElementById("result-circle");
const circleText = document.getElementById("circle-text");
const finalMessage = document.getElementById("final-message");
const scoreText = document.getElementById("score-text");
const restartBtn = document.getElementById("restart-btn");

/* state */
let currentInstrument = "bravo";
let initialOrder = [];
let currentIndex = 0;
let userAnswer = [];
let round = 1; // 1 = main, 2 = review
let incorrectList = [];
let reviewList = [];
let progressSegments = [];

/* helpers */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initProgressBar() {
  progressBar.innerHTML = "";
  progressSegments = [];
  for (let i = 0; i < 4; i++) {
    const seg = document.createElement("div");
    seg.className = "progress-seg";
    progressBar.appendChild(seg);
    progressSegments.push(seg);
  }
}

function setActiveScreen(screenEl) {
  [startScreen, quizScreen, resultsScreen].forEach(s => s.classList.remove("active"));
  screenEl.classList.add("active");
}

function updateUserProgressDisplay() {
  userProgressEl.textContent = "Your Key Signature: " + (userAnswer.length ? userAnswer.join(" ") : "");
}

/* start the session */
function startPractice() {
  currentInstrument = instrumentSelect.value;
  initialOrder = shuffle(concertKeys);
  currentIndex = 0;
  round = 1;
  incorrectList = [];
  reviewList = [];
  resultEl.textContent = "";
  initProgressBar();
  loadCurrentKey();
  setActiveScreen(quizScreen);
}

function loadCurrentKey() {
  let concert;
  if (round === 1) {
    concert = initialOrder[currentIndex];
  } else {
    concert = reviewList[currentIndex].concert;
  }
  concertKeyEl.textContent = `Concert Key: ${concert}`;
  userAnswer = [];
  updateUserProgressDisplay();
  resultEl.textContent = "";
}

accButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const acc = btn.dataset.acc;
    if (acc === "All Natural") {
      userAnswer = ["All Natural"];
    } else {
      if (userAnswer.includes("All Natural")) return;
      if (!userAnswer.includes(acc)) userAnswer.push(acc);
    }
    updateUserProgressDisplay();
  });
});
clearBtn.addEventListener("click", () => {
  userAnswer = [];
  updateUserProgressDisplay();
});

checkBtn.addEventListener("click", () => {
  const concert = round === 1 ? initialOrder[currentIndex] : reviewList[currentIndex].concert;
  const correctKey = instrumentMap[currentInstrument][concert];
  const correctSig = keySignatures[correctKey] || [];
  const isCorrect = arraysEqual(userAnswer, correctSig);

  if (round === 1) {
    const seg = progressSegments[currentIndex];
    if (isCorrect) seg.style.background = "var(--green)";
    else {
      seg.style.background = "var(--yellow)";
      incorrectList.push({ concert, originalIndex: currentIndex });
    }
    resultEl.textContent = isCorrect ? "Correct" : `Incorrect — ${correctSig.join(" ")}`;
  } else {
    const origIdx = reviewList[currentIndex].originalIndex;
    const seg = progressSegments[origIdx];
    if (isCorrect) {
      seg.style.background = "var(--green)";
      resultEl.textContent = "Correct (review)";
    } else {
      seg.style.background = "var(--yellow)";
      resultEl.textContent = `Still incorrect — ${correctSig.join(" ")}`;
    }
  }

  // move to next
  if (round === 1) {
    currentIndex++;
    if (currentIndex < initialOrder.length) {
      setTimeout(loadCurrentKey, 800);
    } else {
      // always show results screen after 4
      setTimeout(showMidResults, 900);
    }
  } else {
    currentIndex++;
    if (currentIndex < reviewList.length) {
      setTimeout(loadCurrentKey, 800);
    } else {
      setTimeout(showFinalResults, 800);
    }
  }
});

/* --- RESULTS FLOW --- */

// shows after first 4, even if wrong
function showMidResults() {
  setActiveScreen(resultsScreen);
  const greenSegs = progressSegments.filter(s => s.style.background === "var(--green)").length;
  const percent = Math.round((greenSegs / 4) * 100);
  finalMessage.textContent = "First Test Complete";
  scoreText.innerHTML = `${greenSegs} of 4 correct (${percent}%)`;

  renderResultCircle(percent);

  // update restart button to "Start Next Test"
  restartBtn.textContent = incorrectList.length ? "Start Next Test" : "Restart";
  restartBtn.onclick = () => {
    if (incorrectList.length) {
      // start review round
      round = 2;
      reviewList = incorrectList.map(i => ({ ...i }));
      currentIndex = 0;
      setActiveScreen(quizScreen);
      loadCurrentKey();
    } else {
      // no review needed
      setActiveScreen(startScreen);
    }
  };
}

// after review round done
function showFinalResults() {
  setActiveScreen(resultsScreen);
  const greenSegs = progressSegments.filter(s => s.style.background === "var(--green)").length;
  const percent = Math.round((greenSegs / 4) * 100);
  finalMessage.textContent = "Final Results";
  scoreText.innerHTML = `${greenSegs} of 4 correct after review (${percent}%)`;

  renderResultCircle(percent);

  restartBtn.textContent = "Restart";
  restartBtn.onclick = () => setActiveScreen(startScreen);
}

/* Circle draw */
function renderResultCircle(percent) {
  const size = 120;
  const radius = 45;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  const greenLen = (percent / 100) * circumference;
  const yellowLen = circumference - greenLen;

  circleSvg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${radius}" stroke="#efefef" stroke-width="12" fill="none"></circle>
    <circle cx="${cx}" cy="${cy}" r="${radius}" stroke-width="12" fill="none"
      stroke-linecap="round" stroke="var(--yellow)"
      style="stroke-dasharray:${yellowLen} ${circumference}; stroke-dashoffset:-${greenLen};"></circle>
    <circle cx="${cx}" cy="${cy}" r="${radius}" stroke-width="12" fill="none"
      stroke-linecap="round" stroke="var(--green)"
      style="stroke-dasharray:${greenLen} ${circumference}; stroke-dashoffset:0;"></circle>
  `;
  circleText.textContent = `${percent}%`;
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

/* startup */
startBtn.addEventListener("click", startPractice);
(function init() {
  setActiveScreen(startScreen);
  initProgressBar();
})();
