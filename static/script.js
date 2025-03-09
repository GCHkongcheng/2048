const grid = document.querySelector(".grid-container");
const cells = document.querySelectorAll(".grid-cell");
const message = document.querySelector(".game-message p");
const restartButton = document.querySelector(".restart-button");
const undoButton = document.querySelector(".undo-button");
const resetButton = document.querySelector(".reset-button");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");

let board = [];
let previousBoard = [];
let hasWon = false;
let score = 0;
let previousScore = 0;
let canUndo = false;
let timer;
let startTime; // 游戏开始的时间戳
let elapsedTime = 0; // 累计游戏时间（毫秒）
let autoSaveInterval;

function initializeBoard() {
  board = Array.from({ length: 4 }, () => Array(4).fill(0));
  previousBoard = [];
  score = 0;
  previousScore = 0;
  elapsedTime = 0; // 重置累计时间
  updateScore();
  addRandomTile();
  addRandomTile();
  updateBoard();
  resetTimer();
  startTimer();
  saveGameState();
}

function updateBoard() {
  cells.forEach((cell, index) => {
    const value = board[Math.floor(index / 4)][index % 4];
    cell.textContent = value || "";
    cell.className = `grid-cell tile-${value}`;
  });
  saveGameState();
}

function addRandomTile() {
  const emptyCells = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === 0) {
        emptyCells.push({ i, j });
      }
    });
  });

  if (emptyCells.length === 0) return;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[randomCell.i][randomCell.j] = Math.random() > 0.9 ? 4 : 2;
}

function moveTiles(direction) {
  savePreviousState();
  const rotations = { up: 3, right: 2, down: 1, left: 0 };
  const rotationCount = rotations[direction];

  for (let i = 0; i < rotationCount; i++) {
    rotateBoard();
  }

  for (let row = 0; row < 4; row++) {
    compressRow(row);
    mergeRow(row);
    compressRow(row);
  }

  for (let i = 0; i < 4 - rotationCount; i++) {
    rotateBoard();
  }

  if (!boardsEqual(previousBoard, board)) {
    addRandomTile();
    updateBoard();
    checkGameOver();
    canUndo = true; // 允许撤回
  }
}

function compressRow(row) {
  const newRow = board[row].filter((cell) => cell !== 0);
  newRow.push(...Array(4 - newRow.length).fill(0));
  board[row] = newRow;
}

function mergeRow(row) {
  for (let i = 0; i < 3; i++) {
    if (board[row][i] === board[row][i + 1] && board[row][i] !== 0) {
      board[row][i] *= 2;
      board[row][i + 1] = 0;
      score += board[row][i];
      updateScore();
      if (!hasWon && board[row][i] === 2048) {
        hasWon = true;
        message.textContent = "You Win!";
        document.querySelector(".game-message").style.display = "block";
        stopTimer();
      }
    }
  }
}

function rotateBoard() {
  const newBoard = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      newBoard[j][3 - i] = board[i][j];
    }
  }
  board = newBoard;
}

function checkGameOver() {
  if (hasWon) return;

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === 0) return;
      if (i < 3 && board[i][j] === board[i + 1][j]) return;
      if (j < 3 && board[i][j] === board[i][j + 1]) return;
    }
  }

  message.textContent = "Game Over";
  document.querySelector(".game-message").style.display = "block";
  stopTimer();
}

function updateScore() {
  scoreDisplay.textContent = score;
}

function savePreviousState() {
  previousBoard = board.map((row) => row.slice());
  previousScore = score;
}

function undoMove() {
  if (canUndo && previousBoard.length > 0) {
    board = previousBoard.map((row) => row.slice());
    score = previousScore;
    updateBoard();
    updateScore();
    previousBoard = [];
    canUndo = false; // 撤回后不允许再次撤回，直到下一次移动
  } else {
    alert("不能连续撤回两次哦");
  }
}

function startTimer() {
  startTime = Date.now() - elapsedTime; // 根据累计时间调整起始时间
  timer = setInterval(updateTime, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function resetTimer() {
  stopTimer();
  elapsedTime = 0; // 重置累计时间
  timeDisplay.textContent = "00:00";
}

function updateTime() {
  if (!startTime) return; // 确保 startTime 已初始化

  elapsedTime = Date.now() - startTime; // 更新累计时间
  const minutes = Math.floor(elapsedTime / 60000);
  const seconds = Math.floor((elapsedTime % 60000) / 1000);
  timeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function saveGameState() {
  const gameState = {
    board,
    score,
    hasWon,
    elapsedTime, // 保存累计时间
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
  const gameState = JSON.parse(localStorage.getItem("gameState"));
  if (gameState) {
    board = gameState.board;
    score = gameState.score;
    hasWon = gameState.hasWon;
    elapsedTime = gameState.elapsedTime || 0; // 恢复累计时间，默认为 0
    updateBoard();
    updateScore();
    startTimer(); // 重新启动计时器
  } else {
    initializeBoard();
  }
}

function boardsEqual(board1, board2) {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board1[i][j] !== board2[i][j]) return false;
    }
  }
  return true;
}

document.addEventListener("keydown", (e) => {
  if (hasWon) return;

  switch (e.key) {
    case "ArrowUp":
      moveTiles("up");
      break;
    case "ArrowRight":
      moveTiles("right");
      break;
    case "ArrowDown":
      moveTiles("down");
      break;
    case "ArrowLeft":
      moveTiles("left");
      break;
  }
});

// 触摸事件支持
let startX, startY;

grid.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  e.preventDefault(); // 阻止默认行为
});

grid.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;

  const deltaX = endX - startX;
  const deltaY = endY - startY;

  const threshold = 50;

  if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平方向滑动
      if (deltaX > 0) {
        moveTiles("right");
      } else {
        moveTiles("left");
      }
    } else {
      // 垂直方向滑动
      if (deltaY > 0) {
        moveTiles("down");
      } else {
        moveTiles("up");
      }
    }
  }
  e.preventDefault(); // 阻止默认行为
});

restartButton.addEventListener("click", () => {
  localStorage.removeItem("gameState"); // 清空存档
  initializeBoard();
  document.querySelector(".game-message").style.display = "none";
  hasWon = false;
  resetTimer(); // 重置计时器
  startTimer(); // 重新开始计时
});

undoButton.addEventListener("click", () => {
  undoMove();
});

resetButton.addEventListener("click", () => {
  if (confirm("确实要重置游戏吗?")) {
    localStorage.removeItem("gameState"); // 清空存档
    initializeBoard();
    document.querySelector(".game-message").style.display = "none";
    hasWon = false;
    resetTimer(); // 重置计时器
    startTimer(); // 重新开始计时
  }
});

window.addEventListener("load", () => {
  loadGameState();
  autoSaveInterval = setInterval(saveGameState, 1000); // 每秒自动保存一次游戏状态
});
