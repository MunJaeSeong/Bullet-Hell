// ========================================
// monsters.js
// 장애물(몬스터) 관련 변수 및 함수
// ========================================

// 몬스터 배열 (전역)
let monsters = [];

// 몬스터 타입 정의 (이름, 기본 체력, 속도 범위, 크기 등)
const MONSTER_TYPES = {
  slime: {
    displayName: '슬라임',
    hp: 150,
    speedRange: [0.8, 1.6],
    size: { width: 36, height: 28 },
    baseLevel: 1,
    baseScore: 10
  },
  goblin: {
    displayName: '고블린',
    hp: 300,
    speedRange: [1.6, 2.6],
    size: { width: 36, height: 32 },
    baseLevel: 2,
    baseScore: 25
  },
  wolf: {
    displayName: '들개',
    hp: 200,
    speedRange: [2.0, 3.2],
    size: { width: 32, height: 22 },
    baseLevel: 3,
    baseScore: 40
  }
};

// 몬스터 체력 증가 관련 상수
// 난이도마다 증가량이 등차수열로 커집니다.
// 예: firstIncrement = 0.1, step = 0.1
// level 1 : multiplier = 1
// level 2 : multiplier = 1 + 0.1
// level 3 : multiplier = 1 + (0.1 + 0.2)
// level n : multiplier = 1 + Sum_{i=1..n-1} (firstIncrement + (i-1)*step)
const HP_FIRST_INCREMENT = 0.1;
const HP_INCREMENT_STEP = 0.1;

// Monster 클래스: 공통 속성(name, hp, speed, 위치, 크기, type)과 그리기/업데이트 메서드
class Monster {
  /**
   * constructor(typeKey, x, y, level)
   * - typeKey: `MONSTER_TYPES`의 키 중 하나
   * - level (선택): 몬스터의 레벨을 직접 지정합니다. 지정하지 않으면 타입의 baseLevel을 사용합니다.
   */
  constructor(typeKey, x = 0, y = 0, level = null) {
    const def = MONSTER_TYPES[typeKey] || MONSTER_TYPES.slime;
    this.type = typeKey;
    this.name = def.displayName;
    // 기본/기준 체력과 레벨 기반 체력 계산
    const baseHp = Number(def.hp) || 1;
    this.width = def.size.width;
    this.height = def.size.height;
    this.x = x;
    this.y = y;
    this.speed = def.speedRange[0] + Math.random() * (def.speedRange[1] - def.speedRange[0]);
  // 몬스터 레벨 (인자로 전달되거나 type의 baseLevel 사용)
  this.level = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : (def.baseLevel || 1);
    // 난이도 조정: 레벨이 올라갈수록 체력을 등차수열의 합만큼 증가시킴
    // multiplier = 1 + S where S = sum_{i=1}^{level-1} (a + (i-1)*d)
    const n = Math.max(0, this.level - 1);
    let incrementSum = 0;
    if (n > 0) {
      // 합 공식: n/2 * (2a + (n-1)d)
      incrementSum = (n * (2 * HP_FIRST_INCREMENT + (n - 1) * HP_INCREMENT_STEP)) / 2;
    }
    const multiplier = 1 + incrementSum;
    const scaledHp = Math.max(1, Math.floor(baseHp * multiplier));
    this.hp = scaledHp;
    this.maxHp = scaledHp;
  // 점수 보상 계산 (약간의 랜덤 변동 포함)
  const base = def.baseScore || 10;
  const variation = 0.9 + Math.random() * 0.2; // 0.9 - 1.1
  this.score = Math.max(1, Math.floor(base * this.level * variation));
  // 간단한 상태 플래그
    this.isAlive = true;
  }

  // 업데이트(이동 등)
  update() {
    this.y += this.speed;
  }

  // 보상을 반환 (몬스터 처치 시 부여되는 점수)
  getReward() {
    return this.score;
  }

  // 체력바 그리기: 몬스터 상단에 표시
  _drawHealthBar(ctx) {
    if (!ctx) return;
    if (typeof this.hp !== 'number' || typeof this.maxHp !== 'number') return;
    const barW = Math.max(12, this.width);
    const barH = 6;
    const padding = 2;
    const bx = this.x + (this.width - barW) / 2;
    let by = this.y - barH - 6; // 몬스터 위 약간의 간격
    if (by < 2) by = 2;
    // 배경
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - padding, by - padding, barW + padding * 2, barH + padding * 2);
    // 바 전체(회색)
    ctx.fillStyle = 'rgba(100,100,100,0.9)';
    ctx.fillRect(bx, by, barW, barH);
    // 현재 체력(녹색)
    const pct = Math.max(0, Math.min(1, this.hp / this.maxHp));
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(bx, by, Math.round(barW * pct), barH);
    // 테두리
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, barW + 1, barH + 1);
    ctx.restore();
  }

  // 그리기: 타입에 따라 다른 그리기 함수 사용
  draw(ctx) {
    if (!ctx) return;
    switch (this.type) {
      case 'slime':
        this._drawSlime(ctx);
        break;
      case 'goblin':
        this._drawGoblin(ctx);
        break;
      case 'wolf':
        this._drawWolf(ctx);
        break;
      default:
        // 기본: 단순 사각형으로 대체 렌더링
        ctx.fillStyle = 'purple';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // 체력바 그리기 (타입별 그리기 이후에 공통으로 처리)
    this._drawHealthBar(ctx);
  }

  // 슬라임: 둥글고 반투명한 젤리 모양
  _drawSlime(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const rx = this.width / 2;
    const ry = this.height / 2;
  // 몸통
    ctx.save();
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, 'rgba(102, 204, 102, 0.95)');
    grad.addColorStop(1, 'rgba(34, 153, 84, 0.95)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true);
    ctx.fill();
  // 광택(하이라이트)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - rx*0.3, cy - ry*0.4, rx*0.35, ry*0.25, 0, 0, Math.PI*2);
    ctx.fill();
  // 눈
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(cx - rx*0.25, cy - ry*0.05, 2.5, 0, Math.PI*2);
    ctx.arc(cx + rx*0.05, cy - ry*0.02, 2.0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // 고블린: 뾰족한 귀와 작고 민첩한 실루엣
  _drawGoblin(ctx) {
    ctx.save();
  // 몸통
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width*0.5, this.y + this.height*0.5, this.width*0.45, this.height*0.45, 0, 0, Math.PI*2);
    ctx.fill();
  // 머리 (살짝 위쪽)
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width*0.5, this.y + this.height*0.28, this.width*0.35, this.height*0.28, 0, 0, Math.PI*2);
    ctx.fill();
  // 귀
    ctx.beginPath();
    ctx.moveTo(this.x + 4, this.y + this.height*0.25);
    ctx.lineTo(this.x + 10, this.y + 2);
    ctx.lineTo(this.x + 14, this.y + this.height*0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + this.width - 4, this.y + this.height*0.25);
    ctx.lineTo(this.x + this.width - 10, this.y + 2);
    ctx.lineTo(this.x + this.width - 14, this.y + this.height*0.35);
    ctx.fill();
  // 눈
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x + this.width*0.42, this.y + this.height*0.28, 3, 0, Math.PI*2);
    ctx.arc(this.x + this.width*0.6, this.y + this.height*0.3, 2.5, 0, Math.PI*2);
    ctx.fill();
  // 입 (미소와 송곳니 표현)
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x + this.width*0.42, this.y + this.height*0.34);
    ctx.quadraticCurveTo(this.x + this.width*0.5, this.y + this.height*0.42, this.x + this.width*0.6, this.y + this.height*0.34);
    ctx.stroke();
    ctx.restore();
  }

  // 들개(늑대류): 긴 몸통과 귀, 회색 계열
  _drawWolf(ctx) {
    ctx.save();
  // 몸통
    ctx.fillStyle = '#9E9E9E';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width*0.45, this.y + this.height*0.55, this.width*0.55, this.height*0.45, 0, 0, Math.PI*2);
    ctx.fill();
  // 머리
    ctx.fillStyle = '#8D8D8D';
    ctx.beginPath();
    ctx.ellipse(this.x + this.width*0.9 - 6, this.y + this.height*0.32, this.width*0.28, this.height*0.22, 0, 0, Math.PI*2);
    ctx.fill();
  // 귀
    ctx.beginPath();
    ctx.moveTo(this.x + this.width*0.78, this.y + this.height*0.15);
    ctx.lineTo(this.x + this.width*0.78 + 6, this.y + this.height*0.02);
    ctx.lineTo(this.x + this.width*0.78 + 12, this.y + this.height*0.18);
    ctx.fill();
  // 눈
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x + this.width*0.82, this.y + this.height*0.31, 2.5, 0, Math.PI*2);
    ctx.fill();
  // 꼬리
    ctx.beginPath();
    ctx.moveTo(this.x + 2, this.y + this.height*0.45);
    ctx.quadraticCurveTo(this.x - 8, this.y + this.height*0.2, this.x + 6, this.y + this.height*0.18);
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

// 장애물(몬스터) 그리기 및 이동 함수 (전역 ctx 사용)
function drawMonsters() {
  if (typeof ctx === 'undefined') return;
  monsters.forEach(mon => {
    mon.draw(ctx);
    mon.update();
  });
}

// 새로운 몬스터 생성 함수 (슬라임, 고블린, 들개 중 랜덤)
function generateMonster() {
  if (typeof canvas === 'undefined') return;
  const typeKeys = Object.keys(MONSTER_TYPES);
  const choice = typeKeys[Math.floor(Math.random() * typeKeys.length)];
  const def = MONSTER_TYPES[choice];
  const x = Math.random() * Math.max(0, canvas.width - def.size.width);
  // 생성 시점의 플레이어 레벨(또는 전역 score)에 따라 몬스터 레벨을 지정
  let level = 1;
  if (typeof Level !== 'undefined' && typeof score !== 'undefined') {
    level = Level.levelForScore(score);
  } else if (def.baseLevel) {
    level = def.baseLevel;
  }
  monsters.push(new Monster(choice, x, -def.size.height, level));
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

