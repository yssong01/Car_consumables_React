// src/components/layout/Tabs.jsx
export default function Tabs({ activeTab, onChange }) {
  return (
    <div className="tab-bar">
      <button
        type="button"
        className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
        onClick={() => onChange("all")}
      >
        All
      </button>
      <button
        type="button"
        className={`tab-btn ${activeTab === "check" ? "active" : ""}`}
        onClick={() => onChange("check")}
      >
        Check
      </button>
    </div>
  );
}
