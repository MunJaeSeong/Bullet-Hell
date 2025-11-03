// ========================================
// player.js
// 플레이어 관련 변수와 입력 처리, 플레이어 그리기 함수
// ========================================

// 플레이어 상태 객체 (전역으로 사용됩니다)
const player = {
  x: 180,          // 플레이어의 x 좌표 (원 중심)
  y: 450,          // 플레이어의 y 좌표 (원 중심, 화면 하단 근처)
  radius: 5,       // 플레이어 반지름 (픽셀)
  speed: 5,        // 플레이어의 이동 속도 (픽셀/프레임)
  // 스킬 및 생명 관련
  skills: 1,       // 현재 보유 스킬 수 (시작값: 1)
  lives: 3,        // 현재 보유 생명 수 (시작값: 3)
  maxSkills: 2,    // 스킬의 최대 보유 개수
  maxLives: 3      // 생명의 최대 보유 개수
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

// ------------------------------
// HUD 그리기 및 스킬/생명 관련 함수
// ------------------------------

// 하트 그리기 헬퍼
function drawHeart(ctx, cx, cy, size, filled = true) {
  const topY = cy - size * 0.3;
  ctx.beginPath();
  ctx.moveTo(cx, topY + size * 0.3);
  ctx.bezierCurveTo(cx, topY, cx - size, topY, cx - size, topY + size * 0.6);
  ctx.bezierCurveTo(cx - size, topY + size, cx, topY + size * 1.3, cx, topY + size * 1.6);
  ctx.bezierCurveTo(cx, topY + size * 1.3, cx + size, topY + size, cx + size, topY + size * 0.6);
  ctx.bezierCurveTo(cx + size, topY, cx, topY, cx, topY + size * 0.3);
  ctx.closePath();
  if (filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

// 번개(스킬) 그리기 헬퍼: 중심 좌표(cx, cy), 전체 높이 size
function drawBolt(ctx, cx, cy, size, filled = true) {
  const w = size * 0.5;
  const h = size;
  // 탄탄한 번개 모양을 폴리곤으로 그림
  const points = [
    {x: cx - w * 0.2, y: cy - h * 0.5},
    {x: cx + w * 0.1, y: cy - h * 0.5},
    {x: cx - w * 0.1, y: cy - h * 0.1},
    {x: cx + w * 0.5, y: cy - h * 0.1},
    {x: cx - w * 0.2, y: cy + h * 0.5},
    {x: cx - w * 0.05, y: cy + h * 0.05},
    {x: cx - w * 0.4, y: cy + h * 0.05}
  ];
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  if (filled) ctx.fill(); else ctx.stroke();
}

// 플레이어 HUD: 왼쪽 하단에 하트(생명), 하트 위에 번개(스킬)
function drawPlayerHUD() {
  if (typeof ctx === 'undefined' || typeof canvas === 'undefined') return;
  ctx.save();
  ctx.lineWidth = 1.5;

  const paddingX = 12;
  const paddingY = 18;
  const heartSize = 8; // 하트 크기(scale)
  const gap = 14;

  // 하트(생명) 위치: 왼쪽 하단
  const baseY = canvas.height - paddingY;
  for (let i = 0; i < player.maxLives; i++) {
    const hx = paddingX + i * gap + heartSize;
    const hy = baseY - heartSize; // 중심 y
    if (i < player.lives) {
      ctx.fillStyle = 'crimson';
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      drawHeart(ctx, hx, hy, heartSize, true);
    } else {
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      drawHeart(ctx, hx, hy, heartSize, false);
    }
  }

  // 스킬(번개) 위치: 하트들 위, 중앙 정렬
  const boltY = baseY - heartSize - 18;
  for (let i = 0; i < player.maxSkills; i++) {
    const bx = paddingX + i * gap + heartSize;
    if (i < player.skills) {
      ctx.fillStyle = 'dodgerblue';
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      drawBolt(ctx, bx, boltY, 18, true);
    } else {
      ctx.fillStyle = 'transparent';
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      drawBolt(ctx, bx, boltY, 18, false);
    }
  }

  ctx.restore();
}

// 스킬/생명 관련 함수들
function addSkill(n = 1) {
  const before = player.skills;
  player.skills = Math.min(player.maxSkills, player.skills + n);
  return player.skills > before;
}

function useSkill() {
  if (player.skills > 0) {
    player.skills -= 1;
    return true;
  }
  return false;
}

function addLife(n = 1) {
  const before = player.lives;
  player.lives = Math.min(player.maxLives, player.lives + n);
  return player.lives > before;
}

function loseLife(n = 1) {
  player.lives = Math.max(0, player.lives - n);
  return player.lives;
}

function resetPlayerStatus() {
  player.skills = 1;
  player.lives = 3;
}
