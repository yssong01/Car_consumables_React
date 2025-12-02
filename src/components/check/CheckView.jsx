// src/components/check/CheckView.jsx

export default function CheckView({ consumables, currentKm, historyMap }) {
  const rows = consumables.map((item) => {
    const list = historyMap[item.id] ?? [];
    const hasRecord = list.length > 0;

    let lastKm = null;
    if (hasRecord) {
      lastKm = Math.max(...list.map((e) => e.km));
    }

    const nextKm = (lastKm ?? 0) + item.intervalKm;
    const diff = nextKm - currentKm;

    let statusClass;
    let diffText;
    if (diff < 0) {
      statusClass = "overdue";
      diffText = `${(-diff).toLocaleString()} 초과`;
    } else if (diff === 0) {
      statusClass = "soon";
      diffText = "0 남음";
    } else {
      statusClass = "ok";
      diffText = `${diff.toLocaleString()} 남음`;
    }

    const statusPrefix = hasRecord ? "" : "기록 없음, ";

    return {
      name: item.name,
      intervalKm: item.intervalKm,
      lastKm,
      nextKm,
      statusClass,
      statusText: statusPrefix + diffText,
    };
  });

  return (
    <section className="panel">
      <h3> 🚗 소모품의 권장 교체 주기 & 마지막 교체 시점, 현황 </h3>
      <table className="check-table">
        <thead>
          <tr>
            <th>소모품</th>
            <th>권장 주기</th>
            <th>마지막 교체</th>
            <th>다음 교체</th>
            <th>현재 상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.intervalKm.toLocaleString()}</td>
              <td>
                {row.lastKm != null
                  ? row.lastKm.toLocaleString()
                  : "기록 없음"}
              </td>
              <td>{row.nextKm.toLocaleString()}</td>
              <td className={`status ${row.statusClass}`}>
                {row.statusText}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="check-tip">
        ✔️ 교체 시점 기준은 주행 거리(km)에 대응됨. 거리 단위 "km" 는 생략함.
      </p>
    </section>
  );
}
