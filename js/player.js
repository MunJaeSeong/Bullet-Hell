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

// 플레이어 총알 업그레이드 상태
player.bulletDamageMultiplier = 1.0; // 데미지 배율
// 발사속도 관련: 발사 속도 배율과 기준 발사 간격(밀리초)
player.fireRateMultiplier = 1.0;     // 발사속도 배율 (1.0 = 기본)
player.baseFireIntervalMs = 1000;    // 기본 발사 간격(밀리초)
player.fireIntervalMs = player.baseFireIntervalMs; // 현재 발사 간격(업그레이드 반영)
player.maxFireRateMultiplier = 2.0;  // (옵션) UI에서 표시할 최대 배율
player.bulletsPerShot = 1;           // 한 번에 발사되는 총알 개수
// 업그레이드 카운트 및 한계값
player.upgradeCounts = { damage: 0, speed: 0, count: 0 }; // 각 업그레이드가 몇 번 적용되었는지
player.maxUpgrades = { damage: 9, speed: 9, count: 4 }; // 최대 적용 횟수 (count는 +1씩, 4번이면 1->5)

// 현재 누른 키 상태를 저장하는 객체 (전역)
const keysPressed = {};

// 키보드 이벤트 처리: 키를 누르고 있는 동안 계속 이동하도록 처리
document.addEventListener("keydown", function(e) {
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  // 기존 이동키 처리
  if (allowed.includes(e.key)) {
    e.preventDefault();
    keysPressed[e.key] = true;
  }
  // 스페이스바: 한 번 눌렀을 때만 발동
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    if (!keysPressed['Space']) {
      keysPressed['Space'] = true;
      // 스킬 사용 시 스킬 차감: useSkill()가 있으면 호출하여 성공할 때만 효과 발동
      let used = true;
      if (typeof useSkill === 'function') {
        used = useSkill();
      }
      if (used) {
        // 플레이어 전체 몬스터에 대미지 주는 함수 호출
        if (typeof castGlobalDamage === 'function') castGlobalDamage(100000);
      } else {
        // 스킬이 없으면 아무 동작 안 함 (추후 피드백 추가 가능)
      }
    }
  }
});

document.addEventListener("keyup", function(e) {
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  if (allowed.includes(e.key)) {
    keysPressed[e.key] = false;
  }
  if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
    keysPressed['Space'] = false;
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
  // 좌우는 기존과 동일하게 가장자리에 붙지 않게 클램프
  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
  // 상단 영역 제한: 캔버스 높이의 상단 60% 영역으로 진입 불가
  const topLimit = canvas.height * 0.6 + player.radius;
  if (player.y < topLimit) player.y = topLimit;
  // 하단은 기존처럼 캔버스 바깥으로 나가지 않게 클램프
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

// ------------------------------
// Bullet (플레이어 발사체) 관리
// ------------------------------
// bullets 배열과 관련 함수들을 player.js에서 관리합니다.
const bullets = []; // {x, y, radius, vy}
const BULLET_DAMAGE = 200; // 기본 총알 대미지 (업그레이드 배율 적용 전)
// 현재 탄환 대미지(업그레이드 적용)를 반환
function getBulletDamage() {
  return Math.max(1, Math.floor(BULLET_DAMAGE * (player.bulletDamageMultiplier || 1)));
}
// 플레이어 위치에서 총알을 생성
function spawnBullet() {
  if (typeof player === 'undefined') return;
  // 기본 속도 (총알 발사 속도는 이제 발사 빈도로 제어됩니다)
  const baseVy = -6;
  const count = Math.max(1, Math.floor(player.bulletsPerShot || 1));
  const created = [];
  if (count === 1) {
    const b = { x: player.x, y: player.y - player.radius - 6, radius: 3, vy: baseVy };
    bullets.push(b);
    created.push(b);
  } else {
    // 여러 발을 발사할 때는 약간의 각도(수평 분산)를 줌
    const spread = Math.min(20, 6 * count); // 픽셀 단위 좌우 분산
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) - 0.5; // -0.5 .. 0.5
      const bx = player.x + t * spread;
      const b = { x: bx, y: player.y - player.radius - 6, radius: 3, vy: baseVy };
      bullets.push(b);
      created.push(b);
    }
  }
  return created;
}

// 업그레이드 적용 헬퍼: 'damage'|'speed'|'count'
function applyPlayerUpgrade(kind) {
  if (!player) return false;
  switch (kind) {
    case 'damage': {
      const curCount = (player.upgradeCounts && player.upgradeCounts.damage) || 0;
      const maxCount = (player.maxUpgrades && player.maxUpgrades.damage) || 9;
      if (curCount >= maxCount) return false;
      // 적용
      player.upgradeCounts.damage = curCount + 1;
      player.bulletDamageMultiplier = (player.bulletDamageMultiplier || 1) * 1.5;
      return true;
    }
    case 'speed': {
      const curCount = (player.upgradeCounts && player.upgradeCounts.speed) || 0;
      const maxCount = (player.maxUpgrades && player.maxUpgrades.speed) || 9;
      if (curCount >= maxCount) return false;
      // 업그레이드 카운트 증가
      player.upgradeCounts.speed = curCount + 1;
      // 발사속도(빈도) 배율을 늘리고, 그에 따라 발사 간격을 줄임
      player.fireRateMultiplier = (player.fireRateMultiplier || 1) * 1.25;
      // 발사 간격은 기본 간격을 배율로 나누어 계산 (최소값 보호)
      player.fireIntervalMs = Math.max(50, Math.round(player.baseFireIntervalMs / player.fireRateMultiplier));
      return true;
    }
    case 'count': {
      const curCount = (player.upgradeCounts && player.upgradeCounts.count) || 0;
      const maxCount = (player.maxUpgrades && player.maxUpgrades.count) || 4;
      if (curCount >= maxCount) return false;
      player.upgradeCounts.count = curCount + 1;
      player.bulletsPerShot = Math.min((player.maxUpgrades && player.maxUpgrades.count) ? 1 + player.upgradeCounts.count : 5, 5);
      return true;
    }
    default:
      return false;
  }
}

// 총알 위치 업데이트 및 화면 밖 제거
function updateBullets() {
  if (typeof canvas === 'undefined') return;
  for (let b of bullets) {
    b.y += b.vy;
  }
  // 화면 상단으로 나간 총알 제거
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y + bullets[i].radius < 0) bullets.splice(i, 1);
  }
}

// 총알 그리기 (global ctx 사용)
function drawBullets() {
  if (typeof ctx === 'undefined') return;
  ctx.fillStyle = 'black';
  for (let b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 총알 배열 얻기 (필요 시 외부에서 접근 가능)
function getBullets() {
  return bullets;
}

// ------------------------------
// 스페이스바 사용: 전체 몬스터에 피해를 주는 함수
// ------------------------------
function castGlobalDamage(damage = 1000) {
  if (typeof monsters === 'undefined') return 0;
  let killed = 0;
  // 뒤에서부터 순회하며 hp 차감, hp <= 0이면 제거
  for (let i = monsters.length - 1; i >= 0; i--) {
    const m = monsters[i];
    if (typeof m.hp === 'number') {
      m.hp -= damage;
      if (m.hp <= 0) {
        monsters.splice(i, 1);
        // 점수 보상 합산
        if (typeof m.getReward === 'function') score += m.getReward(); else score += 10;
        killed++;
        // 레벨업 대기열 업데이트
        if (typeof Level !== 'undefined') {
          const newLevel = Level.levelForScore(score);
          if (newLevel > (typeof prevLevel !== 'undefined' ? prevLevel : 1)) {
            pendingLevelUps += (newLevel - (typeof prevLevel !== 'undefined' ? prevLevel : 1));
            prevLevel = newLevel;
          }
        }
      }
    } else {
      // hp가 없다면 즉시 제거
      monsters.splice(i, 1);
      killed++;
    }
  }
  // 기존 루틴: 이미 점수는 각 몬스터 삭제 시 합산됨
  return killed;
}
