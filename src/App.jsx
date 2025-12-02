// src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import {
  INITIAL_MAX_KM,
  HARD_MAX_KM,
  CONSUMABLES as INITIAL_CONSUMABLES,
} from "./data/consumables";
import Tabs from "./components/layout/Tabs";
import TopListPanel from "./components/layout/TopListPanel";
import TimelineAllView from "./components/timeline/TimelineAllView";
import CheckView from "./components/check/CheckView";

// --- 새 소모품 색상 자동 배정용 팔레트 ---
const BASE_COLORS = INITIAL_CONSUMABLES.map((c) => c.color);
const EXTRA_COLORS = ["#0ea5e9", "#f97316", "#22c55e", "#a855f7", "#ec4899"];
const COLOR_POOL = [...BASE_COLORS, ...EXTRA_COLORS];

function pickUniqueColor(list) {
  const used = new Set(list.map((c) => c.color));
  const free = COLOR_POOL.find((c) => !used.has(c));
  if (free) return free;
  return COLOR_POOL[list.length % COLOR_POOL.length]; // 전부 쓰였으면 순환
}

// --- localStorage 키 & 초기값 로더 ---
const STORAGE_KEY = "car-consumables-state-v1";

function loadInitialState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("state load failed", e);
    return null;
  }
}

function App() {
  const loaded = loadInitialState() || {};

  const [currentKm, setCurrentKm] = useState(loaded.currentKm ?? 0);
  const [activeTab, setActiveTab] = useState(loaded.activeTab ?? "all");

  // 소모품 정의
  const [consumables, setConsumables] = useState(
    loaded.consumables ?? INITIAL_CONSUMABLES
  );

  // historyMap[id] = [{ km, createdAt }, ...]
  const [historyMap, setHistoryMap] = useState(loaded.historyMap ?? {});

  // 마지막으로 클릭한 소모품/주행거리
  const [lastChecked, setLastChecked] = useState(loaded.lastChecked ?? null);

  // -------------------------------
  // 🌗 다크 모드 (주간/야간) 상태
  // -------------------------------
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("dark-mode");
    return saved === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("dark-mode", darkMode ? "dark" : "light");
    } catch {
      // 무시
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // -------------------------------
  // 상태 변경 시 localStorage에 저장
  // -------------------------------
  useEffect(() => {
    try {
      const toSave = {
        currentKm,
        activeTab,
        consumables,
        historyMap,
        lastChecked,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("state save failed", e);
    }
  }, [currentKm, activeTab, consumables, historyMap, lastChecked]);

  // -------------------------------
  // 전체 초기화(리셋)
  // -------------------------------
  const handleResetAll = () => {
    if (
      !window.confirm(
        "모든 소모품 정의와 교체 이력을 초기화할까요? (되돌릴 수 없습니다)"
      )
    ) {
      return;
    }

    setCurrentKm(0);
    setActiveTab("all");
    setConsumables(INITIAL_CONSUMABLES);
    setHistoryMap({});
    setLastChecked(null);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("state reset failed", e);
    }
  };

  // -------------------------------
  // 소모품 정의 추가/수정/삭제
  // -------------------------------
  const handleAddConsumable = () => {
    const nameInput = window.prompt("새 소모품 이름을 입력하세요:");
    if (!nameInput) return;
    const name = nameInput.trim();
    if (!name) return;

    const intervalInput = window.prompt(
      "권장 교체 주기(km)를 입력하세요 (예: 10000):"
    );
    if (!intervalInput) return;

    const value = intervalInput.replace(/,/g, "");
    const km = Number(value);
    if (!Number.isFinite(km) || km <= 0 || km > HARD_MAX_KM) {
      window.alert(
        `1 ~ ${HARD_MAX_KM.toLocaleString()} 사이의 숫자를 입력하세요.`
      );
      return;
    }

    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const color = pickUniqueColor(consumables);

    setConsumables((prev) => [
      ...prev,
      {
        id,
        name,
        intervalKm: km,
        color,
      },
    ]);
  };

  const handleEditConsumable = (id) => {
    const target = consumables.find((c) => c.id === id);
    if (!target) return;

    const nameInput = window.prompt("소모품 이름을 수정하세요:", target.name);
    if (nameInput === null) return;
    const name = nameInput.trim();
    if (!name) return;

    const intervalInput = window.prompt(
      "권장 교체 주기(km)를 수정하세요:",
      target.intervalKm.toString()
    );
    if (intervalInput === null) return;
    const value = intervalInput.replace(/,/g, "");
    const km = Number(value);
    if (!Number.isFinite(km) || km <= 0 || km > HARD_MAX_KM) {
      window.alert(
        `1 ~ ${HARD_MAX_KM.toLocaleString()} 사이의 숫자를 입력하세요.`
      );
      return;
    }

    setConsumables((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, intervalKm: km } : c))
    );
  };

  const handleDeleteConsumable = (id) => {
    const target = consumables.find((c) => c.id === id);
    if (!target) return;

    if (
      !window.confirm(
        `"${target.name}" 항목을 삭제할까요? (해당 소모품의 교체 이력도 함께 삭제됩니다)`
      )
    ) {
      return;
    }

    setConsumables((prev) => prev.filter((c) => c.id !== id));
    setHistoryMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // -------------------------------
  // 상단 소모품 버튼 클릭 → 이력 추가
  // -------------------------------
  const handleCheck = (id) => {
    const now = Date.now();
    setHistoryMap((prev) => {
      const prevList = prev[id] ?? [];
      const last = prevList[prevList.length - 1];
      if (last && last.km === currentKm) return prev; // 같은 km 중복 방지

      const nextList = [...prevList, { km: currentKm, createdAt: now }];
      return { ...prev, [id]: nextList };
    });

    setLastChecked({ id, km: currentKm });
  };

  // -------------------------------
  // 개별 이력 수정/삭제
  // -------------------------------
  const handleEditEntry = (id, originalKm) => {
    const input = window.prompt(
      "새 교체 시점 km를 입력하세요:",
      originalKm.toString()
    );
    if (input === null) return;

    const value = input.replace(/,/g, "");
    const km = Number(value);
    if (!Number.isFinite(km) || km < 0 || km > HARD_MAX_KM) {
      window.alert(
        `0 ~ ${HARD_MAX_KM.toLocaleString()} 사이의 숫자를 입력하세요.`
      );
      return;
    }

    setHistoryMap((prev) => {
      const list = prev[id] ?? [];
      const idx = list.findIndex((e) => e.km === originalKm);
      if (idx === -1) return prev;

      const newList = [...list];
      newList[idx] = { ...newList[idx], km };
      return { ...prev, [id]: newList };
    });

    setLastChecked({ id, km });
  };

  const handleDeleteEntry = (id, km) => {
    if (!window.confirm("이 교체 기록을 삭제할까요?")) return;
    setHistoryMap((prev) => {
      const list = prev[id] ?? [];
      const newList = list.filter((e) => e.km !== km);
      const next = { ...prev };
      if (newList.length) next[id] = newList;
      else delete next[id];
      return next;
    });
  };

  // -------------------------------
  // 자동 최대 주행거리 계산
  // -------------------------------
  const computedMaxKm = (() => {
    let maxNext = 0;

    consumables.forEach((item) => {
      const list = historyMap[item.id] ?? [];
      let lastKm = 0;
      list.forEach((e) => {
        if (e.km > lastKm) lastKm = e.km;
      });
      const nextKm = lastKm + item.intervalKm;
      if (nextKm > maxNext) maxNext = nextKm;
    });

    if (maxNext === 0) maxNext = INITIAL_MAX_KM;
    const scaled = Math.ceil(maxNext * 1.2);
    return Math.min(HARD_MAX_KM, Math.max(INITIAL_MAX_KM, scaled));
  })();

  // 전체 이력에서 가장 최근 교체 시점
  const latestKm = (() => {
    let max = null;
    Object.values(historyMap).forEach((list) => {
      list.forEach((e) => {
        if (max === null || e.km > max) max = e.km;
      });
    });
    return max;
  })();

  const handleCurrentKmChange = (e) => {
    const raw = e.target.value.replace(/,/g, ""); // 콤마 제거
    const num = Number(raw);

    if (!Number.isFinite(num)) return; // 숫자가 아니면 무시

    setCurrentKm(Math.max(0, Math.min(HARD_MAX_KM, num)));
  };

  // -------------------------------
  // render
  // -------------------------------
  return (
    <div className="app">
      <header className="app-header">
        {/* 상단: 제목 + 모드 스위치 + 초기화 버튼 */}
        <div className="app-header-top">
          <div className="app-header-left">
            <div className="app-title-row">
              <h1 className="app-title">NIRO Hev 자동차 소모품 관리</h1>
              <button
                type="button"
                className="darkmode-switch"
                onClick={toggleDarkMode}
              >
                {darkMode ? "🌙 야간" : "🌞 주간"}
              </button>
            </div>
            <p className="app-subtitle">
              🛂 주행 거리 입력 후, 소모품 항목 선택
            </p>
          </div>

          {/* 🔹 가장 우측 상단 초기화 버튼 */}
          <button
            type="button"
            className="reset-btn"
            onClick={handleResetAll}
          >
            초기화
          </button>
        </div>

        {/* 두 번째 줄: 현재 주행거리 + 최근 교체 + All/Check 탭 */}
        <div className="current-row">
          <label htmlFor="current-km">🛃 현재 주행거리 [km]</label>
          <input
            id="current-km"
            type="text"
            inputMode="numeric"
            value={currentKm.toLocaleString()}
            placeholder="10,000"
            onChange={handleCurrentKmChange}
          />
          <span className="current-latest">
            최근 교체 시점:{" "}
            {latestKm != null ? `${latestKm.toLocaleString()} km` : "-"}
          </span>

          {/* 오른쪽: All / Check 탭 */}
          <Tabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* 세 번째 줄: 상단 소모품 리스트 */}
        <div className="app-header-right">
          <TopListPanel
            consumables={consumables}
            historyMap={historyMap}
            onCheck={handleCheck}
            onAdd={handleAddConsumable}
            onEditConsumable={handleEditConsumable}
            onDeleteConsumable={handleDeleteConsumable}
          />
        </div>
      </header>

      {activeTab === "all" && (
        <TimelineAllView
          consumables={consumables}
          currentKm={currentKm}
          maxKm={computedMaxKm}
          historyMap={historyMap}
          lastChecked={lastChecked}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}

      {activeTab === "check" && (
        <CheckView
          consumables={consumables}
          currentKm={currentKm}
          historyMap={historyMap}
        />
      )}
    </div>
  );
}

export default App;
