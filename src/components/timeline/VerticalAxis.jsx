// src/components/timeline/VerticalAxis.jsx
import { kmToPx } from "../../data/consumables";

export default function VerticalAxis({ currentKm, maxKm, trackHeight }) {
  const ticks = [];

  // 1,000 km 마다 눈금 + 숫자
  for (let km = 0; km <= maxKm; km += 1000) {
    let type = "thin";
    if (km % 10000 === 0) type = "strong";
    else if (km % 5000 === 0) type = "medium";

    ticks.push({ km, type, label: km.toLocaleString() });
  }

  return (
    <div className="axis" style={{ height: `${trackHeight}px` }}>
      <div className="axis-line" />
      {ticks.map((t) => (
        <div
          key={t.km}
          className="axis-tick"
          style={{ top: `${kmToPx(t.km, maxKm)}px` }}
        >
          <div className={`axis-tick-line ${t.type}`} />
          <div className="axis-tick-label">{t.label}</div>
        </div>
      ))}

      {/* 현재 주행거리 (숫자를 세로 라인 위에 겹쳐서 표시) */}
      <div
        className="axis-current"
        style={{ top: `${kmToPx(currentKm, maxKm)}px` }}
      >
        <div className="axis-current-line" />
        <div className="axis-current-label">
          {currentKm.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
