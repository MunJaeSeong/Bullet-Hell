// ========================================
// monsters.js
// 장애물(몬스터) 관련 변수 및 함수
// ========================================

// 장애물 배열 (전역)
let obstacles = [];

// 장애물 그리기 및 이동 함수 (전역 ctx 사용)
function drawObstacles() {
  if (typeof ctx === 'undefined') return;
  obstacles.forEach(ob => {
    ctx.fillStyle = "red";
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
    ob.y += ob.speed;
  });
}

// 새로운 장애물 생성 함수
function generateObstacle() {
  if (typeof canvas === 'undefined') return;
  const x = Math.random() * (canvas.width - 40);
  obstacles.push({
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
