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
  x: 180,          // 플레이어의 x 좌표 (가로 위치)
  y: 450,          // 플레이어의 y 좌표 (세로 위치, 화면 하단 근처)
  width: 40,       // 플레이어의 너비 (픽셀)
  height: 20,      // 플레이어의 높이 (픽셀)
  speed: 5         // 플레이어의 이동 속도 (픽셀/키 입력)
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
// 키보드 이벤트 리스너: 화살표 키로 플레이어 이동
document.addEventListener("keydown", function(e) {
  // 왼쪽 화살표 키: 플레이어를 왼쪽으로 이동
  if (e.key === "ArrowLeft") player.x -= player.speed;
  // 오른쪽 화살표 키: 플레이어를 오른쪽으로 이동
  if (e.key === "ArrowRight") player.x += player.speed;
});

// ========================================
// 플레이어 그리기 함수
// ========================================
function drawPlayer() {
  ctx.fillStyle = "black";  // 플레이어 색상: 검은색
  ctx.fillRect(player.x, player.y, player.width, player.height);
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
// 두 사각형이 겹치는지 확인하는 함수
function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&      // rect1의 왼쪽이 rect2의 오른쪽보다 왼쪽에 있고
         rect1.x + rect1.width > rect2.x &&      // rect1의 오른쪽이 rect2의 왼쪽보다 오른쪽에 있고
         rect1.y < rect2.y + rect2.height &&     // rect1의 위쪽이 rect2의 아래쪽보다 위에 있고
         rect1.y + rect1.height > rect2.y;       // rect1의 아래쪽이 rect2의 위쪽보다 아래에 있으면
  // 위 4가지 조건이 모두 참이면 두 사각형이 겹침 (충돌)
}

// ========================================
// 게임 메인 루프 (업데이트 함수)
// ========================================
function update() {
  if (gameOver) return;  // 게임 오버 상태면 게임 루프 중단

  // 이전 프레임의 그림을 모두 지움 (캔버스 전체를 투명하게)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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