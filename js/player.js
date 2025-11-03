// ========================================
// player.js
// 플레이어 관련 변수와 입력 처리, 플레이어 그리기 함수
// ========================================

// 플레이어 상태 객체 (전역으로 사용됩니다)
const player = {
  x: 180,          // 플레이어의 x 좌표 (원 중심)
  y: 450,          // 플레이어의 y 좌표 (원 중심, 화면 하단 근처)
  radius: 5,       // 플레이어 반지름 (픽셀)
  speed: 5         // 플레이어의 이동 속도 (픽셀/프레임)
};

// 현재 누른 키 상태를 저장하는 객체 (전역)
const keysPressed = {};

// 키보드 이벤트 처리: 키를 누르고 있는 동안 계속 이동하도록 처리
document.addEventListener("keydown", function(e) {
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  if (allowed.includes(e.key)) {
    e.preventDefault();
    keysPressed[e.key] = true;
  }
});

document.addEventListener("keyup", function(e) {
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  if (allowed.includes(e.key)) {
    keysPressed[e.key] = false;
  }
});

// 플레이어 그리기 함수: 전역 ctx 변수를 사용합니다 (main.js에서 정의)
function drawPlayer() {
  if (typeof ctx === 'undefined') return;
  ctx.fillStyle = "black";  // 플레이어 색상: 검은색
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

// 플레이어 경계 제한 (캔버스 크기에 맞춰 클램프)
function clampPlayerToCanvas() {
  if (typeof canvas === 'undefined') return;
  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
  if (player.y < player.radius) player.y = player.radius;
  if (player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;
}
