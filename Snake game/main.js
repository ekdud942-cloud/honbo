// 스네이크 게임 — 400x400 캔버스, 20x20 격자

const GRID = 20;          // 한 변의 칸 수
const CELL = 20;          // 한 칸의 픽셀 크기 (20 * 20 = 400px)
const STORAGE_KEY = 'snakeHighScore';

// 난이도별 기본 이동 간격(ms) — 값이 작을수록 빠름
const DIFFICULTIES = {
  easy: 200,
  normal: 150,
  hard: 100,
  extreme: 50,
};
const DEFAULT_DIFFICULTY = 'normal';

const POINTS_PER_LEVEL = 50;   // 50점마다 레벨업
const LEVEL_SPEEDUP = 10;      // 레벨업 1회당 간격 -10ms (= 속도 증가)
const MIN_INTERVAL = 30;       // 너무 빨라지지 않도록 하한

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const levelEl = document.getElementById('level');
const difficultyEl = document.getElementById('difficulty');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayScore = document.getElementById('overlayScore');

let snake = [];
let direction = DIRECTIONS.ArrowRight;
let pendingDirection = null;   // 다음 틱에 적용할 방향
let food = null;
let score = 0;
let highScore = 0;
let level = 1;
let running = false;
let paused = false;
let timerId = null;

/* ---------- 저장소 ---------- */

function loadHighScore() {
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  highScore = Number.isFinite(saved) && saved > 0 ? saved : 0;
}

function saveHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(STORAGE_KEY, String(highScore));
    return true;
  }
  return false;
}

/* ---------- 속도 / 레벨 ---------- */

// 현재 선택된 난이도의 기본 간격
function baseInterval() {
  return DIFFICULTIES[difficultyEl.value] ?? DIFFICULTIES[DEFAULT_DIFFICULTY];
}

// 난이도 기본 간격에서 레벨만큼 빨라진 실제 간격
function currentInterval() {
  return Math.max(MIN_INTERVAL, baseInterval() - (level - 1) * LEVEL_SPEEDUP);
}

// 점수에 맞춰 레벨을 갱신하고, 레벨업했으면 true
function updateLevel() {
  const next = Math.floor(score / POINTS_PER_LEVEL) + 1;
  if (next === level) return false;
  level = next;
  return true;
}

/* ---------- 게임 흐름 ---------- */

function startGame() {
  if (running) return;

  const mid = Math.floor(GRID / 2);
  snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  direction = DIRECTIONS.ArrowRight;
  pendingDirection = null;
  score = 0;
  level = 1;
  paused = false;
  running = true;

  placeFood();
  hideOverlay();
  startBtn.classList.add('hidden');
  restartBtn.classList.add('hidden');
  pauseBtn.classList.remove('hidden');
  pauseBtn.textContent = '일시정지';

  draw();
  scheduleTick();
}

function scheduleTick() {
  clearTimeout(timerId);
  timerId = setTimeout(tick, currentInterval());
}

function tick() {
  if (!running || paused) return;

  // 한 틱에 방향은 한 번만 확정 (연타로 몸에 파고드는 것 방지)
  if (pendingDirection) {
    direction = pendingDirection;
    pendingDirection = null;
  }

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (isCollision(head)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (food && head.x === food.x && head.y === food.y) {
    score += 10;
    updateLevel();        // 50점마다 레벨업 → 다음 틱부터 간격이 짧아짐
    placeFood();          // 꼬리를 자르지 않으므로 길이 +1
  } else {
    snake.pop();
  }

  draw();
  scheduleTick();
}

function isCollision(head) {
  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) return true;
  // 꼬리 끝은 이번 틱에 비워지지만, 안전하게 전체를 검사
  return snake.some((part) => part.x === head.x && part.y === head.y);
}

function placeFood() {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const empty = [];

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
    }
  }

  if (empty.length === 0) {   // 화면을 가득 채운 경우 = 클리어
    food = null;
    return;
  }

  food = empty[Math.floor(Math.random() * empty.length)];
}

function gameOver() {
  running = false;
  paused = false;
  clearTimeout(timerId);

  const isNewRecord = saveHighScore();

  overlayTitle.textContent = isNewRecord ? '🎉 신기록!' : '게임 오버';
  overlayScore.textContent = `점수 ${score}점 · 레벨 ${level} · 최고 ${highScore}점`;
  overlayScore.classList.remove('hidden');
  showOverlay();

  startBtn.classList.add('hidden');
  pauseBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');

  draw();
}

function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    clearTimeout(timerId);
    overlayTitle.textContent = '일시정지';
    overlayScore.classList.add('hidden');
    showOverlay();
    pauseBtn.textContent = '계속하기';
  } else {
    hideOverlay();
    pauseBtn.textContent = '일시정지';
    scheduleTick();
  }
}

function showOverlay() {
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

/* ---------- 렌더링 ---------- */

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  if (food) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL + CELL / 2,
      food.y * CELL + CELL / 2,
      CELL / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? '#86efac' : '#4ade80';
    ctx.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
  });

  scoreEl.textContent = score;
  highScoreEl.textContent = highScore;
  levelEl.textContent = level;
}

function drawGrid() {
  ctx.strokeStyle = '#1e232c';
  ctx.lineWidth = 1;

  for (let i = 1; i < GRID; i++) {
    const pos = i * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

/* ---------- 입력 ---------- */

function handleKeydown(e) {
  // 난이도 select에 포커스가 있으면 키 조작을 가로채지 않음
  if (e.target === difficultyEl) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePause();
    return;
  }

  const next = DIRECTIONS[e.key];
  if (!next) return;

  e.preventDefault();   // 방향키 스크롤 방지
  if (!running || paused) return;

  // 180도 역방향 입력은 무시
  if (next.x === -direction.x && next.y === -direction.y) return;

  pendingDirection = next;
}

/* ---------- 초기화 ---------- */

function init() {
  loadHighScore();

  const mid = Math.floor(GRID / 2);
  snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ];
  food = null;
  level = 1;

  draw();

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);

  // 게임 중에 난이도를 바꾸면 즉시 반영
  difficultyEl.addEventListener('change', () => {
    if (running && !paused) scheduleTick();
    difficultyEl.blur();   // 이후 방향키가 select에 먹히지 않도록
  });

  document.addEventListener('keydown', handleKeydown);
}

init();
