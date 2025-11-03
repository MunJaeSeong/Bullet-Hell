// ========================================
// main.js
// 게임의 메인 루프, 캔버스 설정 및 상태 관리
// ========================================

// 캔버스 및 컨텍스트 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 게임 상태 관리 변수
let gameOver = false;     // 게임 종료 여부
let startTime = Date.now();
let elapsedTime = 0;
let frameCount = 0;

// 시간 표시 함수
function drawTime() {
  elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
  ctx.fillStyle = "black";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`시간: ${elapsedTime}초`, 10, 30);
}

// 게임 업데이트 루프
function update() {
  if (gameOver) return;

  // 캔버스 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 플레이어 입력에 따른 이동
  if (keysPressed["ArrowLeft"]) player.x -= player.speed;
  if (keysPressed["ArrowRight"]) player.x += player.speed;
  if (keysPressed["ArrowUp"] || keysPressed["w"] || keysPressed["W"]) player.y -= player.speed;
  if (keysPressed["ArrowDown"] || keysPressed["s"] || keysPressed["S"]) player.y += player.speed;

  // 플레이어가 캔버스 밖으로 나가지 않도록 제한
  clampPlayerToCanvas();

  // 게임 요소 그리기
  drawPlayer();
  drawObstacles();
  // 플레이어 HUD (생명, 스킬)
  if (typeof drawPlayerHUD === 'function') drawPlayerHUD();
  drawTime();

  // 충돌 검사
  for (let ob of obstacles) {
    if (checkCollision(player, ob)) {
      gameOver = true;
      alert(`Game Over! 생존 시간: ${elapsedTime}초`);
      return;
    }
  }

  // 화면 밖으로 나간 장애물 제거
  obstacles = obstacles.filter(ob => ob.y < canvas.height);

  frameCount++;
  if (frameCount % 30 === 0) generateObstacle();

  requestAnimationFrame(update);
}

// 게임 루프 시작
update();
