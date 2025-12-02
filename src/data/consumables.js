// src/data/consumables.js

// 기본 최대/초기 주행거리
export const INITIAL_MAX_KM = 20000; // 그래프 기본 높이 기준 km
export const HARD_MAX_KM = 300000; // 절대 상한 km

// 소모품 목록
export const CONSUMABLES = [
  { id: "engineOil", name: "오일-엔진", intervalKm: 8000, color: "#e83939ff" }, // 빨강
  {
    id: "airconFilter",
    name: "필터-에어컨",
    intervalKm: 6000,
    color: "#22c5b8ff",
  }, // 초록
  {
    id: "brakeOil",
    name: "오일-브레이크",
    intervalKm: 40000,
    color: "#f59e0b",
  }, // 주황
  {
    id: "clutchFluid",
    name: "오일-클러치",
    intervalKm: 40000,
    color: "#e9830eff",
  }, // 파랑
  {
    id: "missionOil",
    name: "오일-미션",
    intervalKm: 70000,
    color: "#e37bf8ff",
  }, // 남색
  {
    id: "brakePad",
    name: "패드-브레이크",
    intervalKm: 90000,
    color: "#d4cf92ff",
  }, // 보라
  {
    id: "engineCoolant",
    name: "냉각수",
    intervalKm: 70000,
    color: "#228609ff",
  }, // 핑크
  {
    id: "tirePosition",
    name: "타이어위치",
    intervalKm: 20000,
    color: "#b25ff1ff",
  }, // 청록
  {
    id: "tireExchange",
    name: "타이어교체",
    intervalKm: 80000,
    color: "#b388b8ff",
  },
  {
    id: "powerSteeringOil",
    name: "점화플러그",
    intervalKm: 90000,
    color: "#aacc5aff",
  },
  {
    id: "timingBelt",
    name: "타이밍벨트",
    intervalKm: 120000,
    color: "#8b878dff",
  },
  {
    id: "fuelFilter",
    name: "필터-연료",
    intervalKm: 150000,
    color: "#b46499ff",
  },
];

// km → px 비율 (세로축 간격)
const PX_PER_1000KM = 40; // 1000km당 약 40px

// 세로 위치 계산 함수
export function kmToPx(km, maxKm) {
  const ratio = PX_PER_1000KM / 1000;
  return km * ratio;
}

// 전체 트랙 높이(px)
// HARD_MAX_KM 까지 모두 표현할 수 있도록 넉넉하게 잡음
export const TRACK_HEIGHT_PX = kmToPx(HARD_MAX_KM, HARD_MAX_KM) + 200;
