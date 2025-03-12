const grid = document.querySelector(".grid-container");
const cells = document.querySelectorAll(".grid-cell");
const message = document.querySelector(".game-message p");
const restartButton = document.querySelector(".restart-button");
const undoButton = document.querySelector(".undo-button");
const resetButton = document.querySelector(".reset-button");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const showButton = document.getElementById("show-button");
const hiddenContent = document.getElementById("hidden-content");
const overlay = document.getElementById("overlay");
const leaderboardDiv = document.getElementById("leaderboard");
const nicknameDiv = document.getElementById("nickname");
const closeButton = document.getElementById("close-button");
const uploadButton = document.getElementById("upload-button");

let board = [];
let previousBoard = [];
let hasWon = false;
let score = 0;
let previousScore = 0;
let canUndo = false;
let timer;
let startTime;
let elapsedTime = 0;
let autoSaveInterval;

function initializeBoard() {
  board = Array.from({ length: 4 }, () => Array(4).fill(0));
  previousBoard = [];
  score = 0;
  previousScore = 0;
  elapsedTime = 0;
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
    const row = Math.floor(index / 4);
    const col = index % 4;
    const value = board[row][col];
    cell.textContent = value || "";
    cell.className = `grid-cell tile-${value}`;
  });
  saveGameState();
}

function addRandomTile() {
  const emptyCells = [];
  board.forEach((row, i) => {
    row.forEach((cell, j) => {
      if (cell === 0) emptyCells.push({ i, j });
    });
  });

  if (emptyCells.length === 0) return;

  const { i, j } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[i][j] = Math.random() > 0.9 ? 4 : 2;
}

function moveTiles(direction) {
  savePreviousState();
  const rotations = { up: 3, right: 2, down: 1, left: 0 };
  const rotationCount = rotations[direction];

  for (let i = 0; i < rotationCount; i++) rotateBoard();

  for (let row = 0; row < 4; row++) {
    compressRow(row);
    mergeRow(row);
    compressRow(row);
  }

  for (let i = 0; i < 4 - rotationCount; i++) rotateBoard();

  if (!boardsEqual(previousBoard, board)) {
    addRandomTile();
    updateBoard();
    checkGameOver();
    canUndo = true;
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

  let gameOver = true;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === 0) gameOver = false;
      if (i < 3 && board[i][j] === board[i + 1][j]) gameOver = false;
      if (j < 3 && board[i][j] === board[i][j + 1]) gameOver = false;
    }
  }

  if (gameOver) {
    message.textContent = "Game Over";
    document.querySelector(".game-message").style.display = "block";
    stopTimer();
  }
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
    canUndo = false;
  } else {
    alert("不能连续撤回两次哦");
  }
}

function startTimer() {
  startTime = Date.now() - elapsedTime;
  timer = setInterval(updateTime, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function resetTimer() {
  stopTimer();
  elapsedTime = 0;
  timeDisplay.textContent = "00:00";
}

function updateTime() {
  if (!startTime) return;

  elapsedTime = Date.now() - startTime;
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
    elapsedTime,
  };
  localStorage.setItem("gameState", JSON.stringify(gameState));
}

function loadGameState() {
  const gameState = JSON.parse(localStorage.getItem("gameState"));
  if (gameState) {
    board = gameState.board;
    score = gameState.score;
    hasWon = gameState.hasWon;
    elapsedTime = gameState.elapsedTime || 0;
    updateBoard();
    updateScore();
    startTimer();
  } else {
    initializeBoard();
  }
  loadPreviewLeaderboard();
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

let startX, startY;
grid.addEventListener("touchstart", (e) => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  e.preventDefault();
});

grid.addEventListener("touchend", (e) => {
  const endX = e.changedTouches[0].clientX;
  const endY = e.changedTouches[0].clientY;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const threshold = 50;

  if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX > 0 ? moveTiles("right") : moveTiles("left");
    } else {
      deltaY > 0 ? moveTiles("down") : moveTiles("up");
    }
  }
  e.preventDefault();
});

restartButton.addEventListener("click", () => {
  localStorage.removeItem("gameState");
  initializeBoard();
  document.querySelector(".game-message").style.display = "none";
  hasWon = false;
  resetTimer();
  startTimer();
});

undoButton.addEventListener("click", undoMove);

resetButton.addEventListener("click", () => {
  if (confirm("确实要重置游戏吗?")) {
    localStorage.removeItem("gameState");
    initializeBoard();
    document.querySelector(".game-message").style.display = "none";
    hasWon = false;
    resetTimer();
    startTimer();
  }
});

showButton.addEventListener("click", () => {
  fetch("/get_leaderboard")
    .then((response) => response.json())
    .then((data) => {
      leaderboardDiv.innerHTML =
        "<ul>" +
        data
          .map(
            (entry) =>
              `<li>${entry.name}: ${entry.score} 分, ${Math.floor(
                entry.time / 60000
              )} 分 ${Math.floor((entry.time % 60000) / 1000)} 秒</li>`
          )
          .join("") +
        "</ul>";
      hiddenContent.style.display = "block";
      overlay.style.display = "block";
    });
});

closeButton.addEventListener("click", () => {
  hiddenContent.style.display = "none";
  overlay.style.display = "none";
});

uploadButton.addEventListener("click", () => {
  const nickname = nicknameDiv.textContent;
  const score = parseInt(document.getElementById("score").textContent);
  fetch("/save_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, score, elapsed_time: elapsedTime }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.success ? "数据已成功上传至云端！" : "上传失败，请稍后再试。");
    });
});

nicknameDiv.addEventListener("click", () => {
  const oldNickname = nicknameDiv.textContent;
  const newNickname = prompt("请输入新昵称：", oldNickname);
  if (newNickname) {
    // 限制昵称长度为6个字
    const max_length = 6;
    if (newNickname.length > max_length) {
      alert(`昵称长度不能超过${max_length}个字！`);
      return;
    }
    fetch("/save_username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        old_username: oldNickname,
        new_username: newNickname,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          nicknameDiv.textContent = newNickname;
          localStorage.setItem("nickname", newNickname);
          // 昵称更新后自动上传一次
          const score = parseInt(document.getElementById("score").textContent);
          fetch("/save_user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nickname: newNickname,
              score,
              elapsed_time: elapsedTime,
            }),
          });
        } else {
          alert(data.message);
        }
      });
  }
});

function loadPreviewLeaderboard() {
  fetch("/get_leaderboard")
    .then((response) => response.json())
    .then((data) => {
      const preview = data.slice(0, 3);
      let html = "<ul>";
      preview.forEach((entry, index) => {
        html += `<li>${index + 1}. ${entry.name}: ${
          entry.score
        } 分, ${Math.floor(entry.time / 60000)} 分 ${Math.floor(
          (entry.time % 60000) / 1000
        )} 秒</li>`;
      });
      html += "</ul>";
      document.getElementById("preview-leaderboard").innerHTML = html;
    });
}

function showLeaderboard() {
  fetch("/get_leaderboard")
    .then((response) => response.json())
    .then((data) => {
      leaderboardDiv.innerHTML =
        "<ul>" +
        data
          .map(
            (entry) =>
              `<li>${entry.name}: ${entry.score} 分, ${Math.floor(
                entry.time / 60000
              )} 分 ${Math.floor((entry.time % 60000) / 1000)} 秒</li>`
          )
          .join("") +
        "</ul>";
      hiddenContent.style.display = "block";
      overlay.style.display = "block";
    });
}

window.addEventListener("load", () => {
  let savedNickname = localStorage.getItem("nickname");
  if (!savedNickname) {
    savedNickname = prompt("欢迎首次使用，请设置您的昵称：", "玩家1");
    if (savedNickname) {
      localStorage.setItem("nickname", savedNickname);
    } else {
      savedNickname = "玩家1"; // 默认昵称
    }
  }
  nicknameDiv.textContent = savedNickname;
  loadGameState();
  autoSaveInterval = setInterval(saveGameState, 1000);
});

overlay.addEventListener("click", () => {
  hiddenContent.style.display = "none";
  overlay.style.display = "none";
});
