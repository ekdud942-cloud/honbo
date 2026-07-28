// 게임 설정값
const CELL = 20;                          // 셀 한 변의 픽셀 크기
const COLS = 20;                          // 가로 칸 수 (400 / 20)
const ROWS = 20;                          // 세로 칸 수 (400 / 20)
const FOOD_SCORE = 10;                    // 먹이 하나당 점수
const LEVEL_UP_SCORE = 50;                // 레벨업에 필요한 점수 간격
const LEVEL_SPEED_STEP = 10;              // 레벨업 시 짧아지는 간격(ms) = 속도 상승
const MIN_TICK_MS = 30;                   // 조작이 불가능해지지 않도록 하한선
const BEST_SCORE_KEY = "snake-best-score";

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const levelEl = document.getElementById("level");
const difficultySelect = document.getElementById("difficulty");
const pauseBtn = document.getElementById("pause-btn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayDesc = document.getElementById("overlay-desc");
const startBtn = document.getElementById("start-btn");

// 방향키 → 이동 벡터
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

let snake = [];             // 뱀의 몸통 좌표 (index 0 이 머리)
let direction = { x: 1, y: 0 };
let pendingDirection = { x: 1, y: 0 };   // 다음 틱에 반영할 방향
let food = { x: 0, y: 0 };
let score = 0;
let bestScore = 0;
let level = 1;
let isPlaying = false;
let isPaused = false;
let timerId = null;

// 최고 점수 읽기 (LocalStorage 가 막혀 있어도 게임은 동작하도록 처리)
function loadBestScore() {
  try {
    const saved = Number(localStorage.getItem(BEST_SCORE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  } catch (error) {
    // 저장에 실패해도 진행에는 영향이 없으므로 무시
  }
}

// 선택한 난이도의 기본 간격에서 레벨만큼 속도를 올린 값
function currentTickMs() {
  const base = Number(difficultySelect.value);
  return Math.max(MIN_TICK_MS, base - (level - 1) * LEVEL_SPEED_STEP);
}

// 진행 중일 때만 현재 속도로 타이머를 다시 건다
function applySpeed() {
  clearInterval(timerId);
  timerId = null;
  if (isPlaying && !isPaused) {
    timerId = setInterval(tick, currentTickMs());
  }
}

// 뱀이 없는 빈 칸 중에서 무작위로 먹이 위치 선택
function placeFood() {
  const taken = new Set(snake.map((part) => `${part.x},${part.y}`));
  const empty = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(`${x},${y}`)) empty.push({ x, y });
    }
  }

  // 보드가 꽉 찼다면 더 놓을 자리가 없음
  if (empty.length === 0) return;

  food = empty[Math.floor(Math.random() * empty.length)];
}

// 뱀/점수/레벨/방향을 초기 상태로 되돌림
function resetGame() {
  const startY = Math.floor(ROWS / 2);
  const startX = Math.floor(COLS / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  direction = { x: 1, y: 0 };
  pendingDirection = { x: 1, y: 0 };
  score = 0;
  level = 1;
  scoreEl.textContent = "0";
  levelEl.textContent = "1";
  placeFood();
}

// 벽 밖으로 나갔거나 자기 몸에 부딪혔는지 확인
function isCollision(head) {
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return true;
  return snake.some((part) => part.x === head.x && part.y === head.y);
}

// 점수에 맞춰 레벨을 갱신하고, 올랐으면 속도를 다시 적용
function updateLevel() {
  const nextLevel = Math.floor(score / LEVEL_UP_SCORE) + 1;
  if (nextLevel === level) return;

  level = nextLevel;
  levelEl.textContent = String(level);
  applySpeed();
}

// 한 칸 이동 = 게임의 한 프레임
function tick() {
  direction = pendingDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // 꼬리 끝은 이번 틱에 비워지므로 충돌 검사에서 제외
  const ateFood = head.x === food.x && head.y === food.y;
  if (!ateFood) snake.pop();

  if (isCollision(head)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  if (ateFood) {
    score += FOOD_SCORE;
    scoreEl.textContent = String(score);
    placeFood();
    updateLevel();
  }

  draw();
}

// 격자 → 먹이 → 뱀 순으로 캔버스에 그리기
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 격자선
  ctx.strokeStyle = getCssVar("--grid");
  ctx.lineWidth = 1;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL + 0.5, 0);
    ctx.lineTo(i * CELL + 0.5, canvas.height);
    ctx.stroke();
  }
  for (let i = 1; i < ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * CELL + 0.5);
    ctx.lineTo(canvas.width, i * CELL + 0.5);
    ctx.stroke();
  }

  // 먹이
  ctx.fillStyle = getCssVar("--food");
  ctx.beginPath();
  ctx.arc(
    food.x * CELL + CELL / 2,
    food.y * CELL + CELL / 2,
    CELL / 2 - 3,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // 뱀 (머리는 진한 색으로 구분)
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? getCssVar("--snake-head") : getCssVar("--snake-body");
    ctx.fillRect(part.x * CELL + 1, part.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function startGame() {
  resetGame();
  draw();

  overlay.classList.add("is-hidden");
  overlay.classList.remove("is-paused");
  isPlaying = true;
  isPaused = false;

  pauseBtn.disabled = false;
  pauseBtn.textContent = "일시정지";
  applySpeed();
}

// 일시정지 ↔ 재개
function togglePause() {
  if (!isPlaying) return;

  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "이어하기" : "일시정지";

  if (isPaused) {
    overlayTitle.textContent = "일시정지";
    overlayDesc.textContent = "이어하기를 누르면 계속됩니다.";
    overlay.classList.add("is-paused");
    overlay.classList.remove("is-hidden");
  } else {
    overlay.classList.add("is-hidden");
    overlay.classList.remove("is-paused");
  }

  applySpeed();
}

function gameOver() {
  isPlaying = false;
  isPaused = false;
  applySpeed();

  pauseBtn.disabled = true;
  pauseBtn.textContent = "일시정지";

  const isNewBest = score > bestScore;
  if (isNewBest) {
    bestScore = score;
    bestScoreEl.textContent = String(bestScore);
    saveBestScore(bestScore);
  }

  overlayTitle.textContent = "게임 오버!";
  overlayDesc.textContent = isNewBest
    ? `신기록 달성! 최종 점수 ${score}점 (레벨 ${level})`
    : `최종 점수 ${score}점 (레벨 ${level})`;
  startBtn.textContent = "다시 시작";
  overlay.classList.remove("is-paused");
  overlay.classList.remove("is-hidden");
}

// 방향키 입력 처리 (정반대 방향은 무시)
document.addEventListener("keydown", (event) => {
  const next = DIRECTIONS[event.key];
  if (!next) return;

  event.preventDefault();
  if (!isPlaying || isPaused) return;

  const isReverse = next.x === -direction.x && next.y === -direction.y;
  if (isReverse) return;

  pendingDirection = next;
});

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);

// 난이도를 바꾸면 진행 중인 게임에도 즉시 반영
difficultySelect.addEventListener("change", () => {
  applySpeed();
  difficultySelect.blur();   // 이후 방향키 입력이 드롭다운에 먹히지 않도록
});

// 첫 로드: 최고 점수 표시 + 시작 화면 렌더
bestScore = loadBestScore();
bestScoreEl.textContent = String(bestScore);
resetGame();
draw();
