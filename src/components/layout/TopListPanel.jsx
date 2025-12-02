// src/components/layout/TopListPanel.jsx
import React from "react";

/**
 상단 소모품 요약 패널
 소모품 데이터는 App에서 props로 내려받아서 사용합니다.
 */
export default function TopListPanel({
  consumables,
  historyMap,
  onCheck,
  onAdd,
  onEditConsumable,
  onDeleteConsumable,
}) {
  return (
    <div className="top-list">
      <div className="top-list-header">
        <div className="top-list-title">
          🔎 소모품 : 권장 교체 주기 [km] / 마지막 교체 시점 → 다음 권장 교체
          시점
        </div>
        <button
          type="button"
          className="top-list-add"
          onClick={onAdd}
          title="소모품 항목 추가"
        >
          추가
        </button>
      </div>

      <div className="top-list-body">
        {consumables.map((item) => {
          const list = historyMap[item.id] ?? [];
          const lastEntry = list[list.length - 1] || null;
          const lastKm = lastEntry ? lastEntry.km : null;
          const interval = item.intervalKm;
          const nextKm = (lastKm ?? 0) + interval;

          return (
            <div
              key={item.id}
              className="top-list-row"
              style={{ borderColor: item.color }}
            >
              {/* 1·2 줄: 클릭 시 하단 타임라인에 이력 추가 */}
              <button
                type="button"
                className="top-list-main"
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "block",
                }}
                onClick={() => onCheck(item.id)}
              >
                {/* 1줄 : 이름 + 권장주기 */}
                <div className="top-list-name">
                  {item.name} : {interval.toLocaleString()}
                </div>

                {/* 2줄 : 마지막 교체 km → 다음 권장 km */}
                <div className="top-list-text">
                  {lastKm != null ? lastKm.toLocaleString() : "-"} →{" "}
                  {nextKm.toLocaleString()}
                </div>
              </button>

              {/* 3줄 : 우측에 수정/삭제 아이콘 버튼 */}
              <div className="top-list-footer">
                <div className="top-list-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onEditConsumable(item.id)}
                    title="소모품 정보 수정"
                  >
                    🔧
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onDeleteConsumable(item.id)}
                    title="소모품 삭제"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
