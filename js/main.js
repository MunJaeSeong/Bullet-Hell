// ========================================
// main.js
// 게임의 메인 루프, 캔버스 설정 및 상태 관리
// ========================================

// 캔버스 및 컨텍스트 설정
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 게임 상태 관리 변수
let gameOver = false;     // 게임 종료 여부
let frameCount = 0;
// 발사 타이밍 관리 (spawn는 player.spawnBullet())
let lastBulletTime = Date.now();

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
  // 플레이어가 관리하는 총알 그리기
  if (typeof drawBullets === 'function') drawBullets();
  drawObstacles();
  // 플레이어 HUD (생명, 스킬)
  if (typeof drawPlayerHUD === 'function') drawPlayerHUD();

  // 충돌 검사: 플레이어와 장애물
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const ob = obstacles[i];
    if (checkCollision(player, ob)) {
      // 충돌 발생: 생명 감소
      const remaining = typeof loseLife === 'function' ? loseLife(1) : (player.lives = Math.max(0, player.lives - 1));
      // 충돌한 장애물 제거
      obstacles.splice(i, 1);
      // 생명 소진 시 게임 오버
      if (remaining <= 0) {
        gameOver = true;
        alert('Game Over!');
        return;
      }
      // 플레이어는 즉시 계속 플레이 가능 (무적 처리 등은 추후 추가)
    }
  }

  // 화면 밖으로 나간 장애물 제거
  obstacles = obstacles.filter(ob => ob.y < canvas.height);

  // --- 총알 생성 및 업데이트: player.js의 함수 사용 ---
  const now = Date.now();
  if (now - lastBulletTime >= 1000) {
    if (typeof spawnBullet === 'function') spawnBullet();
    lastBulletTime = now;
  }
  if (typeof updateBullets === 'function') updateBullets();

  frameCount++;
  if (frameCount % 30 === 0) generateObstacle();

  requestAnimationFrame(update);
}

// 게임 루프 시작
update();
