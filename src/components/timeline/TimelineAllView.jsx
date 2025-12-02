// src/components/timeline/TimelineAllView.jsx
import { useEffect, useRef } from "react";
import { kmToPx, TRACK_HEIGHT_PX } from "../../data/consumables";
import VerticalAxis from "./VerticalAxis";

const CARD_WIDTH = 95; // 카드 가로폭
const COLUMN_WIDTH = 90; // 열 간격 (기존 110 → 25% 정도 축소)
const CARD_HEIGHT = 80; // 카드 높이(대략값)
const BASE_LEFT = 0;

export default function TimelineAllView({
  consumables,
  currentKm,
  maxKm,
  historyMap,
  lastChecked, // { id, km }
  onEditEntry,
  onDeleteEntry,
}) {
  const wrapperRef = useRef(null); // 실제 타임라인 세로 스크롤 영역
  const hScrollRef = useRef(null); // 상단 가로 스크롤 바용 더미 영역
  const syncFlag = useRef(false);

  // 1) 소모품별 "가장 처음 기록된 시간"으로 열 순서 결정
  const earliestArray = [];
  consumables.forEach((item) => {
    const list = historyMap[item.id] ?? [];
    if (!list.length) return;
    const earliest = Math.min(...list.map((e) => e.createdAt));
    earliestArray.push({ id: item.id, earliest });
  });
  earliestArray.sort((a, b) => a.earliest - b.earliest);
  const activeIds = earliestArray.map((e) => e.id);

  const columnById = {};
  earliestArray.forEach((e, idx) => {
    columnById[e.id] = idx; // 첫 번째로 클릭된 소모품이 0열
  });

  // 2) 이벤트 카드(실제 교체 기록) 계산
  let events = [];
  activeIds.forEach((id) => {
    const item = consumables.find((c) => c.id === id);
    if (!item) return;

    const rawList = historyMap[id] ?? [];
    if (!rawList.length) return;

    // km 오름차순
    const list = rawList.slice().sort((a, b) => a.km - b.km);

    const column = columnById[id];
    const x = BASE_LEFT + column * COLUMN_WIDTH;

    list.forEach((entry) => {
      const top = kmToPx(entry.km, maxKm) - 30;
      const nextKm = entry.km + item.intervalKm;

      events.push({
        item,
        itemId: id,
        km: entry.km,
        nextKm,
        x,
        top,
      });
    });
  });

  // 3) 같은 열에서 상자가 겹치면 살짝 아래로 밀어 주기
  const eventsByColumn = {};
  events.forEach((ev) => {
    const key = ev.x;
    if (!eventsByColumn[key]) eventsByColumn[key] = [];
    eventsByColumn[key].push(ev);
  });

  const adjustedEvents = [];
  const eventsByItemForConnector = {};

  Object.values(eventsByColumn).forEach((list) => {
    list.sort((a, b) => a.top - b.top);
    let lastBottom = -Infinity;

    list.forEach((ev) => {
      let newTop = ev.top;
      if (newTop < lastBottom) {
        newTop = lastBottom + 6;
      }
      const adjusted = { ...ev, top: newTop };
      adjustedEvents.push(adjusted);

      if (!eventsByItemForConnector[ev.itemId]) {
        eventsByItemForConnector[ev.itemId] = [];
      }
      eventsByItemForConnector[ev.itemId].push(adjusted);

      lastBottom = newTop + CARD_HEIGHT;
    });
  });

  events = adjustedEvents;

  // 4) 같은 소모품 이력끼리 연결선(실선) 계산 - 상자 중앙 기준
  const connectors = [];
  Object.values(eventsByItemForConnector).forEach((list) => {
    const sorted = list.slice().sort((a, b) => a.top - b.top);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];

      const y1 = prev.top + CARD_HEIGHT / 2;
      const y2 = cur.top + CARD_HEIGHT / 2;

      connectors.push({
        color: cur.item.color,
        xCenter: cur.x + CARD_WIDTH / 2,
        top: Math.min(y1, y2),
        height: Math.abs(y2 - y1),
      });
    }
  });

  // 5) 가장 최근 교체 기록 하나만 가지고
  //    "다음 권장 시점" 점선 박스 + 점선 연결선 계산
  const futureEvents = [];
  const futureConnectors = [];

  Object.values(eventsByItemForConnector).forEach((list) => {
    if (!list.length) return;

    // km 기준으로 가장 최근 기록
    const latest = list.reduce((acc, cur) => (acc.km > cur.km ? acc : cur));

    const futureKm = latest.km + latest.item.intervalKm;
    const futureTop = kmToPx(futureKm, maxKm) - 30;

    // 점선 박스(내용은 다음 권장 km 한 줄만)
    futureEvents.push({
      item: latest.item,
      itemId: latest.itemId,
      nextKm: futureKm,
      x: latest.x,
      top: futureTop,
    });

    // 최신 카드 "바닥" ↔ 점선 카드 "윗변"까지만 연결
    const startY = latest.top + CARD_HEIGHT;
    const endY = futureTop;

    if (endY > startY) {
      futureConnectors.push({
        xCenter: latest.x + CARD_WIDTH / 2,
        top: startY,
        height: endY - startY,
        color: latest.item.color,
      });
    }
  });

  // 6) 배경 모눈 (1,000km 간격)
  const grid1k = kmToPx(1000, maxKm);
  const gridBackground = {
    backgroundImage: `
      repeating-linear-gradient(
        to bottom,
        #e5e7eb 0,
        #e5e7eb 1px,
        transparent 1px,
        transparent ${grid1k}px
      )
    `,
  };

  // 7) 전체 가로 폭
  const activeColumns = Math.max(activeIds.length, 1);
  const minColumnsForWidth = 12;
  const minWidthPx = 1400;
  const computedWidth =
    BASE_LEFT + Math.max(activeColumns, minColumnsForWidth) * COLUMN_WIDTH + 40;
  const columnWidthTotal = Math.max(computedWidth, minWidthPx);

  // 8) 상단 가로 스크롤 바 ↔ 실제 타임라인 스크롤 동기화
  useEffect(() => {
    const h = hScrollRef.current;
    const v = wrapperRef.current;
    if (!h || !v) return;

    const onHScroll = () => {
      if (syncFlag.current) {
        syncFlag.current = false;
        return;
      }
      syncFlag.current = true;
      v.scrollLeft = h.scrollLeft;
    };

    const onVScroll = () => {
      if (syncFlag.current) {
        syncFlag.current = false;
        return;
      }
      syncFlag.current = true;
      h.scrollLeft = v.scrollLeft;
    };

    h.addEventListener("scroll", onHScroll);
    v.addEventListener("scroll", onVScroll);

    return () => {
      h.removeEventListener("scroll", onHScroll);
      v.removeEventListener("scroll", onVScroll);
    };
  }, [columnWidthTotal]);

  // 9) 마지막으로 클릭한 카드가 보이도록 자동 스크롤
  useEffect(() => {
    if (!lastChecked || !wrapperRef.current) return;
    const { id, km } = lastChecked;
    if (!(id in columnById)) return;

    const column = columnById[id];
    const x = BASE_LEFT + column * COLUMN_WIDTH;

    const list = (historyMap[id] ?? []).slice().sort((a, b) => a.km - b.km);
    const entry = list.find((e) => e.km === km);
    if (!entry) return;

    const top = kmToPx(entry.km, maxKm) - 30;

    const scrollTop = Math.max(top - 150, 0);
    const scrollLeft = Math.max(x - 150, 0);

    wrapperRef.current.scrollTo({
      top: scrollTop,
      left: scrollLeft,
      behavior: "smooth",
    });
  }, [lastChecked, historyMap, maxKm]);

  return (
    <div className="timeline-container">
      {/* 상단 전용 가로 스크롤 바 (하단창과 상단창 사이) */}
      <div className="timeline-scrollbar" ref={hScrollRef}>
        <div
          className="timeline-scrollbar-inner"
          style={{ width: columnWidthTotal }}
        />
      </div>

      {/* 세로 스크롤 + 실제 타임라인 */}
      <div className="timeline-wrapper" ref={wrapperRef}>
        <div
          className="timeline-main"
          style={{
            width: columnWidthTotal,
            height: TRACK_HEIGHT_PX,
            ...gridBackground, // ← 여기로 이동
          }}
        >
          {/* 현재 주행거리 가로선 */}
          <div
            className="current-line-global"
            style={{ top: `${kmToPx(currentKm, maxKm)}px` }}
          />

          {/* 왼쪽 세로 축 */}
          <VerticalAxis currentKm={currentKm} maxKm={maxKm} />

          {/* 오른쪽 카드/연결선 영역 */}
          <div
            className="events-column"
            style={{
              height: `${TRACK_HEIGHT_PX}px`,
              minWidth: columnWidthTotal - 90,
            }}
          >
            {/* 과거 이력 실선 연결 */}
            {connectors.map((c, idx) => (
              <div
                key={`conn-${idx}`}
                className="event-connector"
                style={{
                  left: `${c.xCenter}px`,
                  top: `${c.top}px`,
                  height: `${c.height}px`,
                  backgroundColor: c.color,
                }}
              />
            ))}

            {/* 점선: 최신 기록 ↔ 다음 권장 시점 연결선 */}
            {futureConnectors.map((c, idx) => (
              <div
                key={`fconn-${idx}`}
                className="event-connector-future"
                style={{
                  left: `${c.xCenter}px`,
                  top: `${c.top}px`,
                  height: `${c.height}px`,
                  "--conn-color": c.color,
                }}
              />
            ))}

            {/* 실선 이력 카드 */}
            {events.map((ev, idx) => (
              <div
                key={`evt-${idx}`}
                className="event-box"
                style={{
                  top: `${ev.top}px`,
                  left: `${ev.x}px`,
                  borderColor: ev.item.color,
                }}
              >
                <div className="event-name">{ev.item.name}</div>

                <div className="event-row">
                  <span className="event-label">교체</span>
                  <span className="event-value">{ev.km.toLocaleString()}</span>
                </div>

                <div className="event-row">
                  <span className="event-label">다음</span>
                  <span className="event-value">
                    {ev.nextKm.toLocaleString()}
                  </span>
                </div>

                <div className="event-actions-wide">
                  <button onClick={() => onEditEntry(ev.itemId, ev.km)}>
                    🔧
                  </button>
                  <button onClick={() => onDeleteEntry(ev.itemId, ev.km)}>
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {/* 다음 권장 시점 점선 카드 (한 소모품당 1개) */}
            {futureEvents.map((ev, idx) => (
              <div
                key={`future-${idx}`}
                className="event-box event-box-future"
                style={{
                  top: `${ev.top}px`,
                  left: `${ev.x}px`,
                  borderColor: ev.item.color,
                }}
              >
                <div className="event-row">
                  <span className="event-label">권장</span>
                  <span className="event-value">
                    {ev.nextKm.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
