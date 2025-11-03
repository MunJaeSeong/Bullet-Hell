// ========================================
// level.js
// 점수 기반 레벨 임계지점 계산 유틸리티
// ========================================

/*
 수열(임계지점):
 a(n) = 50*n^2 - 50*n + 100

 이 파일은 위 수열을 바탕으로 다음 기능을 제공합니다.
 - a(n) 계산
 - 특정 레벨에 도달하기 위한 점수 임계값 계산
 - 현재 점수로부터 레벨을 결정
 - 다음 레벨의 임계값 확인
 - 점수 변화로 레벨업 여부 판단

 레벨 정의(이 구현):
 - 플레이어의 레벨은 1부터 시작합니다.
 - levelForScore(score)은 다음 규칙을 따릅니다.
   - score < a(1)  => level 1
   - a(1) <= score < a(2) => level 2
   - a(2) <= score < a(3) => level 3
   - ...

 즉, a(n) 값은 "다음 레벨"로 오를 수 있는 임계점(구간 경계)으로 사용됩니다.
*/

(function (global) {
  const Level = {};

  // 수열 a(n) 계산: n은 자연수(1,2,3,...)
  Level.a = function (n) {
    n = Math.max(1, Math.floor(n));
    return 50 * n * n - 50 * n + 100;
  };

  // 특정 레벨에 도달하기 위한 점수 임계값(threshold)
  // - level 1의 임계값은 0으로 정의(처음 레벨)
  // - level >=2의 임계값은 a(level-1)
  Level.thresholdForLevel = function (level) {
    level = Math.max(1, Math.floor(level));
    if (level <= 1) return 0;
    return Level.a(level - 1);
  };

  // 점수로부터 레벨을 계산
  // - score가 증가하면 레벨은 1,2,3...로 올라감
  Level.levelForScore = function (score) {
    score = Number(score) || 0;
    let level = 1;
    let n = 1;
    // a(n) 이 "다음 레벨로 가기 위한 임계값"이므로
    // score >= a(1) 이면 level 2, score >= a(2) 이면 level 3 ...
    while (score >= Level.a(n)) {
      level = n + 1;
      n++;
      // 안전 장치: 너무 큰 n으로 무한 루프를 도는 것을 방지
      if (n > 10000) break;
    }
    return level;
  };

  // 주어진 score에서 다음 레벨에 도달하기 위한 점수(임계값)
  // 반환값은 '다음 레벨의 최소 점수' (이미 최고 레벨에 도달해도 값 반환)
  Level.nextThresholdForScore = function (score) {
    const current = Level.levelForScore(score);
    return Level.thresholdForLevel(current + 1);
  };

  // 특정 레벨의 다음 레벨 임계값(편의 함수)
  Level.nextThresholdForLevel = function (level) {
    return Level.thresholdForLevel(level + 1);
  };

  // 두 점수(oldScore -> newScore)로 레벨업이 발생했는지 여부 반환
  Level.isLevelUp = function (oldScore, newScore) {
    const oldL = Level.levelForScore(oldScore);
    const newL = Level.levelForScore(newScore);
    return newL > oldL;
  };

  // 전역 노출
  global.Level = Level;
})(window);
