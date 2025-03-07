const grid = document.querySelector(".grid-container");
const cells = document.querySelectorAll(".grid-cell");
const message = document.querySelector(".game-message p");
const restartButton = document.querySelector(".restart-button");
const scoreDisplay = document.getElementById("score");

let board = [];
let hasWon = false;
let score = 0;

function initializeBoard() {
  board = Array.from({ length: 4 }, () => Array(4).fill(0));
  score = 0;
  updateScore();
  addRandomTile();
  addRandomTile();
  updateBoard();
}

function updateBoard() {
  cells.forEach((cell, index) => {
    const value = board[Math.floor(index / 4)][index % 4];
    cell.textContent = value || "";
    cell.className = `grid-cell tile-${value}`;
  });
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
  const rotations = { up: 0, right: 1, down: 2, left: 3 };
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

  addRandomTile();
  updateBoard();
  checkGameOver();
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
}

function updateScore() {
  scoreDisplay.textContent = score;
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
  initializeBoard();
  document.querySelector(".game-message").style.display = "none";
  hasWon = false;
});

initializeBoard();
