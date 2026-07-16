const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');
const scoreValue = document.getElementById('scoreValue');
const bestValue = document.getElementById('bestValue');
const speedValue = document.getElementById('speedValue');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');

const gridSize = 20;
const tileCount = 21;
const cellSize = canvas.width / tileCount;

let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 0, y: 0 };
let obstacles = [];
let score = 0;
let speed = 160;
let bestScore = Number(localStorage.getItem('snake-best-score') || 0);
let running = false;
let paused = false;
let gameTimer = null;

function initGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  speed = 160;
  paused = false;
  running = true;
  createObstacles();
  food = spawnFood();
  updateHud();
  draw();
  hideOverlay();
  startLoop();
}

function createObstacles() {
  obstacles = [
    { x: 7, y: 7 }, { x: 13, y: 7 }, { x: 7, y: 13 }, { x: 13, y: 13 },
    { x: 10, y: 5 }, { x: 10, y: 15 }
  ];
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (isOccupied(newFood));
  return newFood;
}

function isOccupied(pos) {
  return snake.some(seg => seg.x === pos.x && seg.y === pos.y) ||
    obstacles.some(obs => obs.x === pos.x && obs.y === pos.y);
}

function startLoop() {
  clearTimeout(gameTimer);
  if (!running || paused) return;
  gameTimer = setTimeout(tick, speed);
}

function tick() {
  if (!running || paused) return;

  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (isCollision(head)) {
    endGame();
    return;
  }

  const ateFood = head.x === food.x && head.y === food.y;
  snake.unshift(head);

  if (!ateFood) {
    snake.pop();
  } else {
    score += 1;
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('snake-best-score', bestScore);
    }
    speed = Math.max(70, speed - 6);
    food = spawnFood();
  }

  updateHud();
  draw();
  startLoop();
}

function isCollision(head) {
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) return true;
  if (obstacles.some(obs => obs.x === head.x && obs.y === head.y)) return true;

  return snake.slice(0, -1).some(seg => seg.x === head.x && seg.y === head.y);
}

function updateHud() {
  scoreValue.textContent = score;
  bestValue.textContent = bestScore;
  speedValue.textContent = `${Math.round(1000 / speed)}x`;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let x = 0; x < tileCount; x++) {
    for (let y = 0; y < tileCount; y++) {
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }

  obstacles.forEach(obstacle => drawCell(obstacle.x, obstacle.y, '#ef4444'));
  drawCell(food.x, food.y, '#f59e0b');

  snake.forEach((segment, index) => {
    const color = index === 0 ? '#22c55e' : '#16a34a';
    drawCell(segment.x, segment.y, color);
  });
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.strokeRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
}

function endGame() {
  running = false;
  clearTimeout(gameTimer);
  showOverlay('Game Over', `You scored ${score}. Press restart to try again.`);
}

function showOverlay(title, text) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.add('show');
}

function hideOverlay() {
  overlay.classList.remove('show');
}

function changeDirection(newDirection) {
  const isOpposite = direction.x + newDirection.x === 0 && direction.y + newDirection.y === 0;
  if (isOpposite) return;
  nextDirection = newDirection;
}

document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') changeDirection({ x: 0, y: -1 });
  if (key === 'arrowdown' || key === 's') changeDirection({ x: 0, y: 1 });
  if (key === 'arrowleft' || key === 'a') changeDirection({ x: -1, y: 0 });
  if (key === 'arrowright' || key === 'd') changeDirection({ x: 1, y: 0 });
  if (key === ' ') {
    event.preventDefault();
    if (!running) initGame();
    else if (paused) { paused = false; startLoop(); }
    else { paused = true; clearTimeout(gameTimer); }
  }
});

document.querySelectorAll('[data-dir]').forEach(button => {
  button.addEventListener('click', () => {
    const dir = button.getAttribute('data-dir');
    if (dir === 'up') changeDirection({ x: 0, y: -1 });
    if (dir === 'down') changeDirection({ x: 0, y: 1 });
    if (dir === 'left') changeDirection({ x: -1, y: 0 });
    if (dir === 'right') changeDirection({ x: 1, y: 0 });
  });
});

startBtn.addEventListener('click', initGame);
overlayBtn.addEventListener('click', initGame);
pauseBtn.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  if (!paused) startLoop();
  else clearTimeout(gameTimer);
});

bestValue.textContent = bestScore;
showOverlay('Snake Arcade', 'Press Start to begin playing.');
draw();
