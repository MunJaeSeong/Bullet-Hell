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
// 게임 점수
let score = 0;
// 레벨 추적 및 레벨업 처리 변수
let prevLevel = (typeof Level !== 'undefined') ? Level.levelForScore(score) : 1;
let pendingLevelUps = 0;
let levelUpActive = false; // 레벨업 선택 UI 활성화 여부

// 전역 헬퍼: 업그레이드 가능한 항목이 있는지 검사
function hasAvailableUpgrades() {
  if (typeof player === 'undefined') return false;
  const uc = player.upgradeCounts || { damage: 0, speed: 0, count: 0 };
  const mu = player.maxUpgrades || { damage: 9, speed: 9, count: 4 };
  return (uc.damage || 0) < (mu.damage || 9) || (uc.speed || 0) < (mu.speed || 9) || (uc.count || 0) < (mu.count || 4);
}

// 레벨업 선택 UI 표시 함수
function showLevelUpOptions() {
  // 만약 모든 업그레이드가 이미 최대라면 아무것도 하지 않음
  const hasAvailableUpgrades = () => {
    if (typeof player === 'undefined') return false;
    const uc = player.upgradeCounts || { damage: 0, speed: 0, count: 0 };
    const mu = player.maxUpgrades || { damage: 9, speed: 9, count: 4 };
    return (uc.damage || 0) < (mu.damage || 9) || (uc.speed || 0) < (mu.speed || 9) || (uc.count || 0) < (mu.count || 4);
  };
  if (!hasAvailableUpgrades()) {
    // 사용 가능한 업그레이드 없음: 대기 카운트를 초기화하고 비활성화
    pendingLevelUps = 0;
    levelUpActive = false;
    return;
  }

  levelUpActive = true;
  // 오버레이 생성
  const overlay = document.createElement('div');
  overlay.id = 'levelup-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)', zIndex: 9999
  });
  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#fff', padding: '18px', borderRadius: '8px', textAlign: 'center', minWidth: '300px'
  });
  const title = document.createElement('h3');
  title.innerText = 'Level Up! 업그레이드를 선택하세요';
  box.appendChild(title);
  const desc = document.createElement('p');
  desc.innerText = '아래 업그레이드 중 하나를 선택하세요.';
  box.appendChild(desc);

  const btnContainer = document.createElement('div');
  Object.assign(btnContainer.style, { display: 'flex', gap: '8px', justifyContent: 'center' });

  const makeBtn = (text, kind) => {
    const b = document.createElement('button');
    Object.assign(b.style, { padding: '8px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' });
    // 업그레이드 증가량 표시
    let label = text;
    let extra = '';
    if (typeof player !== 'undefined') {
      const uc = player.upgradeCounts || { damage: 0, speed: 0, count: 0 };
      const mu = player.maxUpgrades || { damage: 9, speed: 9, count: 4 };
      if (kind === 'damage') {
        const cur = player.bulletDamageMultiplier || 1;
        const next = cur * 1.5;
        const curCount = uc.damage || 0;
        const maxCount = mu.damage || 9;
        if (curCount >= maxCount) {
          extra = '(최대)';
          b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
          b.title = '이미 최대치입니다';
          b.style.cursor = 'not-allowed';
        } else {
          extra = `(+${Math.round((next / cur - 1) * 100)}% → x${next.toFixed(2)})`;
        }
      } else if (kind === 'speed') {
        const cur = player.fireRateMultiplier || 1;
        const next = cur * 1.25;
        const curCount = uc.speed || 0;
        const maxCount = mu.speed || 9;
        if (curCount >= maxCount) {
          extra = '(최대)';
          b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
          b.title = '이미 최대치입니다';
          b.style.cursor = 'not-allowed';
        } else {
          extra = `(+${Math.round((next / cur - 1) * 100)}% → x${next.toFixed(2)})`;
        }
      } else if (kind === 'count') {
        const cur = player.bulletsPerShot || 1;
        const curCount = uc.count || 0;
        const maxCount = mu.count || 4;
        const maxBullets = player.maxBulletsPerShot || 5;
        const next = Math.min(maxBullets, Math.floor(cur + 1));
        if (curCount >= maxCount || cur >= maxBullets) {
          extra = '(최대)';
          b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
          b.title = '이미 최대치입니다';
          b.style.cursor = 'not-allowed';
        } else {
          extra = `(+${next - cur} → ${next}발)`;
        }
      }
    }
    b.innerHTML = `<div style="font-weight:600;">${label}</div><div style="font-size:12px;color:#333;margin-top:4px;">${extra}</div>`;
    b.addEventListener('click', () => {
      // 적용: applyPlayerUpgrade이 true를 반환해야만 닫기/카운트 감소
      let applied = false;
      if (typeof applyPlayerUpgrade === 'function') applied = applyPlayerUpgrade(kind);
      if (applied) {
        // 닫기
        document.body.removeChild(overlay);
        pendingLevelUps = Math.max(0, pendingLevelUps - 1);
        // 다음 대기 레벨업이 있으면 다시 열기, 없으면 해제
        if (pendingLevelUps > 0) {
          // show again on next frame to allow DOM cleanup
          requestAnimationFrame(showLevelUpOptions);
        } else {
          levelUpActive = false;
        }
      } else {
        // 클릭했지만 적용되지 않음 (최대치); 시각적 피드백을 줄 수 있음
        b.style.opacity = '0.6';
        setTimeout(() => { b.style.opacity = '1'; }, 120);
      }
    });
    return b;
  };

  btnContainer.appendChild(makeBtn('데미지 강화', 'damage'));
  btnContainer.appendChild(makeBtn('발사속도 증가', 'speed'));
  btnContainer.appendChild(makeBtn('탄환 수 증가', 'count'));
  box.appendChild(btnContainer);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
}
// HUD 업데이트 함수: index.html의 HUD 요소들을 갱신
function updateHUD() {
  // score
  const eScore = document.getElementById('hud-score');
  if (eScore) eScore.innerText = String(score);
  // level (Level 모듈 사용)
  const eLevel = document.getElementById('hud-level');
  if (eLevel) {
    const lv = (typeof Level !== 'undefined') ? Level.levelForScore(score) : 1;
    eLevel.innerText = String(lv);
  }
  // skills (player.skills)
  const eSkills = document.getElementById('hud-skills');
  if (eSkills && typeof player !== 'undefined') eSkills.innerText = String(player.skills || 0);
  // upgrades summary
  const eUp = document.getElementById('hud-upgrades');
  if (eUp && typeof player !== 'undefined') {
    const dmg = (player.bulletDamageMultiplier || 1).toFixed(2);
    const spd = (player.fireRateMultiplier || 1).toFixed(2);
    const cnt = player.bulletsPerShot || 1;
    eUp.innerText = `데미지 x${dmg} / 발사속도 x${spd} / 탄환 ${cnt}`;
  }
}
// 파워 몬스터(이로운 몬스터) 생성 타이밍
let lastPowerMonsterTime = Date.now();

// 게임 업데이트 루프
function update() {
  if (gameOver) return;
  if (levelUpActive) { requestAnimationFrame(update); return; }

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
  drawMonsters();
  // 이로운 몬스터 그리기
  if (typeof drawPowerMonsters === 'function') drawPowerMonsters();
  // 플레이어 HUD (생명, 스킬)
  if (typeof drawPlayerHUD === 'function') drawPlayerHUD();

  // HUD DOM 업데이트
  if (typeof updateHUD === 'function') updateHUD();

  // 충돌 검사: 플레이어와 몬스터
  for (let i = monsters.length - 1; i >= 0; i--) {
    const ob = monsters[i];
    if (checkCollision(player, ob)) {
      // 충돌 발생: 생명 감소
      const remaining = typeof loseLife === 'function' ? loseLife(1) : (player.lives = Math.max(0, player.lives - 1));
      // 충돌한 몬스터 제거
      monsters.splice(i, 1);
      // 생명 소진 시 게임 오버
      if (remaining <= 0) {
        gameOver = true;
        alert('Game Over!');
        return;
      }
      // 플레이어는 즉시 계속 플레이 가능 (무적 처리 등은 추후 추가)
    }
  }

  // 화면 밖으로 나간 몬스터 제거
  monsters = monsters.filter(ob => ob.y < canvas.height);

  // 이로운 몬스터 화면 밖 제거
  powerMonsters = powerMonsters.filter(pm => pm.y < canvas.height);

  // --- 총알 생성 및 업데이트: player.js의 함수 사용 ---
  const now = Date.now();
  const interval = (typeof player !== 'undefined' && player.fireIntervalMs) ? player.fireIntervalMs : 1000;
  if (now - lastBulletTime >= interval) {
    if (typeof spawnBullet === 'function') spawnBullet();
    lastBulletTime = now;
  }
  if (typeof updateBullets === 'function') updateBullets();

  // 15초마다 이로운 몬스터(하트/번개) 중 하나를 랜덤 생성
  if (now - lastPowerMonsterTime >= 15000) {
    if (typeof generatePowerMonster === 'function') generatePowerMonster();
    lastPowerMonsterTime = now;
  }

  // --- 총알과 장애물 충돌 처리: 충돌 시 둘 다 제거하고 점수 추가 ---
  if (typeof getBullets === 'function') {
    const bullets = getBullets();
    if (Array.isArray(bullets) && Array.isArray(monsters)) {
      for (let i = monsters.length - 1; i >= 0; i--) {
        const ob = monsters[i];
        for (let j = bullets.length - 1; j >= 0; j--) {
          const b = bullets[j];
          if (checkCollision(b, ob)) {
            // 총알이 적에게 데미지
            if (typeof ob.hp === 'number') {
              const damage = (typeof getBulletDamage === 'function') ? getBulletDamage() : BULLET_DAMAGE;
              ob.hp -= damage;
              // 총알은 항상 소모
              bullets.splice(j, 1);
              if (ob.hp <= 0) {
                monsters.splice(i, 1);
                // 보상 점수 처리: 몬스터가 제공하는 보상을 사용
                if (typeof ob.getReward === 'function') score += ob.getReward(); else score += 10;
                // 레벨업 검사: 점수 증가로 레벨이 오른 경우 대기열에 추가
                if (typeof Level !== 'undefined') {
                  const newLevel = Level.levelForScore(score);
                  if (newLevel > prevLevel) {
                    pendingLevelUps += (newLevel - prevLevel);
                    prevLevel = newLevel;
                  }
                }
              }
            } else {
              // hp가 없으면 기존 동작: 둘 다 제거
              bullets.splice(j, 1);
              monsters.splice(i, 1);
              if (typeof ob.getReward === 'function') score += ob.getReward(); else score += 10;
              if (typeof Level !== 'undefined') {
                const newLevel = Level.levelForScore(score);
                if (newLevel > prevLevel) {
                  pendingLevelUps += (newLevel - prevLevel);
                  prevLevel = newLevel;
                }
              }
            }
            // 이 몬스터는 이미 처리했으므로 다음 몬스터로
            break;
          }
        }
      }
    }
  }

  // --- 플레이어와 이로운 몬스터 충돌 처리 (생명/스킬 추가) ---
  if (Array.isArray(powerMonsters)) {
    for (let i = powerMonsters.length - 1; i >= 0; i--) {
      const pm = powerMonsters[i];
      if (checkCollision(player, pm)) {
        // 생명 추가
        if (pm.type === 'life') {
          if (typeof addLife === 'function') addLife(1);
        } else {
          // 스킬 추가
          if (typeof addSkill === 'function') addSkill(1);
        }
        // 충돌된 파워 몬스터 제거
        powerMonsters.splice(i, 1);
      }
    }
  }

  frameCount++;
  if (frameCount % 30 === 0) generateMonster();

  // 레벨업이 대기 중이면 UI를 연다 (활성화 중이 아니면)
  if (pendingLevelUps > 0 && !levelUpActive) {
    if (hasAvailableUpgrades()) {
      requestAnimationFrame(showLevelUpOptions);
    } else {
      // 더 이상 적용 가능한 업그레이드 없음: 대기 카운트 소모
      pendingLevelUps = 0;
      levelUpActive = false;
    }
  }

  requestAnimationFrame(update);
}

// 게임 루프 시작
update();
