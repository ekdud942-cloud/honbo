const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const message = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const levelEl = document.getElementById('level');
const difficultyEl = document.getElementById('difficulty');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');

const SIZE = 20;
const CELLS = canvas.width / SIZE;
const LEVEL_SCORE = 50;
const LEVEL_SPEEDUP = 10;
const MIN_SPEED = 30;
const STORAGE_KEY = 'snakeHighScore';

let snake, dir, nextDir, food, score, level, timer, baseSpeed;
let running = false;
let paused = false;

// 효과음/BGM은 파일 없이 Web Audio API로 합성
const audio = (() => {
  let ac = null;
  let muted = false;
  let bgmTimer = null;
  let step = 0;
  // 띵(높은음) - 똥(낮은음) 반복, 마지막 마디는 불안한 음정으로 긴장감
  const melody = [659.25, 493.88, 659.25, 493.88, 659.25, 493.88, 698.46, 466.16];

  function ensure() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, start, dur, type, vol, endFreq) {
    const c = ensure();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
    gain.gain.setValueAtTime(vol, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(start);
    osc.stop(start + dur);
  }

  function bgmStep() {
    if (muted) return;
    const c = ensure();
    const t = c.currentTime;
    const i = step % melody.length;
    tone(melody[i], t, 0.22, 'sine', 0.12);
    if (i % 2 === 0) tone(82.41, t, 0.25, 'triangle', 0.18); // 낮은 심장박동 베이스
    step++;
  }

  function bgmLoop() {
    bgmStep();
    const interval = Math.max(130, 260 - (level - 1) * 15); // 레벨이 오를수록 빨라짐
    bgmTimer = setTimeout(bgmLoop, interval);
  }

  return {
    startBgm() { this.stopBgm(); step = 0; ensure(); bgmLoop(); },
    stopBgm() { clearTimeout(bgmTimer); bgmTimer = null; },
    eat() {
      if (muted) return;
      const t = ensure().currentTime;
      tone(660, t, 0.08, 'square', 0.1);
      tone(990, t + 0.08, 0.12, 'square', 0.1);
    },
    die() {
      if (muted) return;
      const t = ensure().currentTime;
      tone(440, t, 0.7, 'sawtooth', 0.15, 55);
      tone(220, t + 0.1, 0.7, 'square', 0.1, 40);
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
  };
})();
let highScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
highScoreEl.textContent = highScore;

function init() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  level = 1;
  scoreEl.textContent = score;
  levelEl.textContent = level;
  placeFood();
}

function currentSpeed() {
  return Math.max(MIN_SPEED, baseSpeed - (level - 1) * LEVEL_SPEEDUP);
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(tick, currentSpeed());
}

function setPaused(value) {
  if (!running) return;
  paused = value;
  pauseBtn.textContent = paused ? '재개' : '일시정지';
  if (paused) {
    clearInterval(timer);
    audio.stopBgm();
  } else {
    startTimer();
    audio.startBgm();
  }
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * CELLS),
      y: Math.floor(Math.random() * CELLS),
    };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function startGame() {
  baseSpeed = Number(difficultyEl.value);
  init();
  running = true;
  paused = false;
  pauseBtn.textContent = '일시정지';
  pauseBtn.disabled = false;
  difficultyEl.disabled = true;
  overlay.classList.add('hidden');
  draw();
  startTimer();
  audio.startBgm();
}

function tick() {
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitWall = head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS;
  const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
  if (hitWall || hitSelf) return gameOver();

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    audio.eat();
    placeFood();
    const newLevel = Math.floor(score / LEVEL_SCORE) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelEl.textContent = level;
      startTimer();
    }
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff4757';
  ctx.fillRect(food.x * SIZE + 1, food.y * SIZE + 1, SIZE - 2, SIZE - 2);

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#7bed9f' : '#2ed573';
    ctx.fillRect(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2);
  });
}

function gameOver() {
  clearInterval(timer);
  audio.stopBgm();
  audio.die();
  running = false;
  pauseBtn.disabled = true;
  pauseBtn.textContent = '일시정지';
  difficultyEl.disabled = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem(STORAGE_KEY, highScore);
    highScoreEl.textContent = highScore;
  }
  message.textContent = `게임 오버! 점수: ${score}`;
  startBtn.classList.add('hidden');
  restartBtn.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

document.addEventListener('keydown', e => {
  const keys = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };
  if (e.key === ' ' && running) {
    e.preventDefault();
    setPaused(!paused);
    return;
  }
  const d = keys[e.key];
  if (!d) return;
  e.preventDefault();
  if (paused) return;
  // 반대 방향으로의 즉시 회전 방지
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
});

muteBtn.addEventListener('click', () => {
  muteBtn.textContent = audio.toggleMute() ? '🔇' : '🔊';
  muteBtn.blur();
});
pauseBtn.addEventListener('click', () => {
  setPaused(!paused);
  pauseBtn.blur(); // 스페이스바가 버튼을 다시 누르지 않도록
});
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

init();
draw();
