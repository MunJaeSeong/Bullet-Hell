// ========================================
// bullet-hell 게임 JavaScript 코드
// 총알 지옥 (bullet hell) 스타일의 2D 게임
// ========================================

// ========================================
// Canvas 설정
// ========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ========================================
// 플레이어 설정
// ========================================
let player = {
  x: 180,          // 플레이어의 x 좌표 (원 중심)
  y: 450,          // 플레이어의 y 좌표 (원 중심, 화면 하단 근처)
  radius: 5,      // 플레이어 반지름 (픽셀)
  speed: 5         // 플레이어의 이동 속도 (픽셀/프레임)
};

// ========================================
// 게임 상태 관리 변수
// ========================================
let obstacles = [];       // 떨어지는 장애물들을 저장하는 배열
let gameOver = false;     // 게임 종료 여부를 나타내는 플래그
let startTime = Date.now();  // 게임 시작 시간 (밀리초)
let elapsedTime = 0;      // 경과 시간 (초)
let frameCount = 0;       // 프레임 카운터 (장애물 생성 주기 계산용)

// ========================================
// 키보드 입력 처리
// ========================================
// 키보드 이벤트 처리: 키를 누르고 있는 동안 계속 이동하도록 처리
// 현재 누른 키 상태를 저장하는 객체
const keysPressed = {};

// 키 누름: 상태를 true로 설정하고 기본 동작(스크롤 등)을 막음
document.addEventListener("keydown", function(e) {
  // 지원할 키: ArrowLeft/ArrowRight/ArrowUp/ArrowDown, W/S (대소문자 구분 없이)
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  if (allowed.includes(e.key)) {
    e.preventDefault();
    keysPressed[e.key] = true;
  }
});

// 키 뗌: 상태를 false로 설정
document.addEventListener("keyup", function(e) {
  const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "W", "s", "S"];
  if (allowed.includes(e.key)) {
    keysPressed[e.key] = false;
  }
});

// ========================================
// 플레이어 그리기 함수
// ========================================
function drawPlayer() {
  ctx.fillStyle = "black";  // 플레이어 색상: 검은색
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

// ========================================
// 시간 표시 함수
// ========================================
function drawTime() {
  // 경과 시간 계산 (밀리초를 초로 변환)
  elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // 시간 텍스트 스타일 설정
  ctx.fillStyle = "black";      
  ctx.font = "24px Arial";      
  ctx.textAlign = "left";      
  
  // 화면 왼쪽 상단에 시간 표시
  ctx.fillText(`시간: ${elapsedTime}초`, 10, 30);
}

// ========================================
// 장애물 그리기 및 이동 함수
// ========================================
function drawObstacles() {
  // 모든 장애물을 순회하며 그리고 이동시킴
  obstacles.forEach(ob => {
    ctx.fillStyle = "red";   
    ctx.fillRect(ob.x, ob.y, ob.width, ob.height);    // 장애물을 현재 위치에 그리기
    ob.y += ob.speed;    // 장애물을 아래로 이동 (y 좌표 증가)
  });
}

// ========================================
// 새로운 장애물 생성 함수
// ========================================
function generateObstacle() {
  // 랜덤한 x 좌표 생성 (캔버스 너비 내에서, 장애물 크기를 고려)
  const x = Math.random() * (canvas.width - 40);

  obstacles.push({   // 새로운 장애물을 배열에 추가
    x: x,                           
    y: 0,                          
    width: 40,                        
    height: 20,                      
    speed: 2 + Math.random() * 2     
  });
}

// ========================================
// 충돌 감지 함수 (AABB 충돌 검사 : Axis-Aligned Bounding Box (축에 정렬된 경계 상자))
// ========================================
// 충돌 검사: 두 직사각형(AABB) 또는 원-직사각(circle-rect)을 지원
function checkCollision(a, b) {
  // a가 원(circle)인 경우: 원-사각 충돌 검사
  if (a.radius !== undefined) {
    // 직사각형 b의 가장 가까운 점을 원 중심에 대해 계산
    const closestX = Math.max(b.x, Math.min(a.x, b.x + b.width));
    const closestY = Math.max(b.y, Math.min(a.y, b.y + b.height));
    const dx = a.x - closestX;
    const dy = a.y - closestY;
    return dx * dx + dy * dy <= a.radius * a.radius;
  }

  // b가 원(circle)인 경우: 원-사각 충돌 검사 (역순)
  if (b.radius !== undefined) {
    const closestX = Math.max(a.x, Math.min(b.x, a.x + a.width));
    const closestY = Math.max(a.y, Math.min(b.y, a.y + a.height));
    const dx = b.x - closestX;
    const dy = b.y - closestY;
    return dx * dx + dy * dy <= b.radius * b.radius;
  }

  // 기본: 직사각형-직사각형 충돌 검사 (AABB)
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ========================================
// 게임 메인 루프 (업데이트 함수)
// ========================================
function update() {
  if (gameOver) return;  // 게임 오버 상태면 게임 루프 중단

  // 이전 프레임의 그림을 모두 지움 (캔버스 전체를 투명하게)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 키가 눌려있는 동안 프레임마다 플레이어 이동 처리 (좌/우 및 상/하 지원)
  if (keysPressed["ArrowLeft"]) player.x -= player.speed;
  if (keysPressed["ArrowRight"]) player.x += player.speed;
  // W/S 또는 화살표 위/아래로 상하 이동
  if (keysPressed["ArrowUp"] || keysPressed["w"] || keysPressed["W"]) player.y -= player.speed;
  if (keysPressed["ArrowDown"] || keysPressed["s"] || keysPressed["S"]) player.y += player.speed;

  // 플레이어가 캔버스 밖으로 나가지 않도록 반지름 기준으로 범위 제한 (player.x, player.y는 중심)
  if (player.x < player.radius) player.x = player.radius;
  if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
  if (player.y < player.radius) player.y = player.radius;
  if (player.y > canvas.height - player.radius) player.y = canvas.height - player.radius;

  // 게임 요소 그리기
  drawPlayer();      // 플레이어 그리기
  drawObstacles();   // 모든 장애물 그리기 및 이동
  drawTime();        // 시간 표시

  // 모든 장애물에 대해 플레이어와의 충돌 확인
  for (let ob of obstacles) {
    if (checkCollision(player, ob)) {
      gameOver = true;  // 게임 종료 플래그 설정
      alert(`Game Over! 생존 시간: ${elapsedTime}초`);  // 최종 시간 표시
      return;  // 게임 루프 종료
    }
  }

  // 화면 밖으로 나간 장애물을 제거 (y 좌표가 캔버스 높이보다 작은 것만 유지)
  obstacles = obstacles.filter(ob => ob.y < canvas.height);
  // 프레임마다 카운터 1씩 증가
  frameCount++;

  // 30프레임(약 0.5초)마다 새로운 장애물 생성
  if (frameCount % 30 === 0) generateObstacle();

  // requestAnimationFrame: 브라우저에게 다음 프레임에 update 함수 호출 요청
  requestAnimationFrame(update);
}

// 게임 루프 시작
update();