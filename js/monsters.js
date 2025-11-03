// ========================================
// monsters.js
// 장애물(몬스터) 관련 변수 및 함수
// ========================================

// 몬스터 배열 (전역)
let monsters = [];

// 장애물 그리기 및 이동 함수 (전역 ctx 사용)
function drawMonsters() {
  if (typeof ctx === 'undefined') return;
  monsters.forEach(ob => {
    ctx.fillStyle = "red";
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    ob.y += ob.speed;
  });
}

// 새로운 몬스터 생성 함수
function generateMonster() {
  if (typeof canvas === 'undefined') return;
  const x = Math.random() * (canvas.width - 40);
  monsters.push({
    x: x,
    y: 0,
    width: 40,
    height: 20,
    speed: 2 + Math.random() * 2
  });
}

// 충돌 감지 함수 (원-사각 또는 AABB)
function checkCollision(a, b) {
  // a가 원인 경우
  if (a.radius !== undefined) {
    const closestX = Math.max(b.x, Math.min(a.x, b.x + b.width));
    const closestY = Math.max(b.y, Math.min(a.y, b.y + b.height));
    const dx = a.x - closestX;
    const dy = a.y - closestY;
    return dx * dx + dy * dy <= a.radius * a.radius;
  }

  // b가 원인 경우
  if (b.radius !== undefined) {
    const closestX = Math.max(a.x, Math.min(b.x, a.x + a.width));
    const closestY = Math.max(a.y, Math.min(b.y, a.y + a.height));
    const dx = b.x - closestX;
    const dy = b.y - closestY;
    return dx * dx + dy * dy <= b.radius * b.radius;
  }

  // 사각-사각 충돌
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ========================================

// 이로운 몬스터 배열 (전역)
let powerMonsters = [];

// 이로운 몬스터 그리기 함수 (하트 또는 번개로 렌더)
function drawPowerMonsters() {
  if (typeof ctx === 'undefined') return;
  powerMonsters.forEach(item => {
    const cx = item.x + item.width / 2;
    const cy = item.y + item.height / 2;
    // 하트는 생명, 번개는 스킬
    if (item.type === 'life') {
      ctx.fillStyle = 'crimson';
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      // drawHeart(ctx, cx, cy, size)
      drawHeart(ctx, cx, cy, Math.min(item.width, item.height) * 0.5, true);
    } else {
      ctx.fillStyle = 'dodgerblue';
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      drawBolt(ctx, cx, cy, Math.min(item.width, item.height) * 1.0, true);
    }
    item.y += item.speed;
  });
}

// 새로운 이로운 몬스터 생성 함수
function generatePowerMonster() {
  if (typeof canvas === 'undefined') return;
  const x = Math.random() * (canvas.width - 40);
  const type = Math.random() < 0.5 ? 'life' : 'skill';
  powerMonsters.push({
    x: x,
    y: 0,
    width: 40,
    height: 20,
    speed: 2 + Math.random() * 2,
    type: type
  });
}

