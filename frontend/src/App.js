import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = { windowMs: 5000, treshold: 4 };

export default function App() {
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [formValues, setFormValues] = useState(DEFAULT_SETTINGS);
  const [settingsStatus, setSettingsStatus] = useState(null); // 'saved' | 'error'

  //WebSocket: receive aggregated events from Server A
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [data, ...prev]);
    };

    return () => ws.close();
  }, []);

  //REST: load current settings from Server B on mount
    useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setFormValues(data);
      })
      .catch(console.error);
  }, []);

  //REST: save updated settings to Server B
  async function saveSettings() {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();
      setSettings(data);
      setSettingsStatus("saved");
    } catch {
      setSettingsStatus("error");
    } finally {
      setTimeout(() => setSettingsStatus(null), 2000);
    }
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h1>Meaningful Moments</h1>

      {/* Settings Panel */}
      <section style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Aggregator Settings</h2>
        <label>
          Window (ms):&nbsp;
          <input
            type="number"
            value={formValues.windowMs}
            onChange={(e) => setFormValues((f) => ({ ...f, windowMs: Number(e.target.value) }))}
          />
        </label>
        &nbsp;&nbsp;
        <label>
          Treshold:&nbsp;
          <input
            type="number"
            value={formValues.treshold}
            onChange={(e) => setFormValues((f) => ({ ...f, treshold: Number(e.target.value) }))}
          />
        </label>
        &nbsp;&nbsp;
        <button onClick={saveSettings}>Save</button>
        {settingsStatus === "saved" && <span style={{ color: "green", marginLeft: 8 }}>✓ Saved</span>}
        {settingsStatus === "error" && <span style={{ color: "red", marginLeft: 8 }}>✗ Error</span>}
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#666" }}>
          Active: window={settings.windowMs}ms, treshold={settings.treshold}
        </p>
      </section>

      {/* Live Event Feed */}
      <section>
        <h2>Live Feed</h2>
        {events.length === 0 && <p style={{ color: "#999" }}>Waiting for events...</p>}
        {events.map((e, i) => (
          <div key={i} style={{
            border: "1px solid #eee", borderRadius: 6, padding: 12, marginBottom: 8,
            background: i === 0 ? "#fffbea" : "white"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 20 }}>
                {e.emote} <strong>×{e.count}</strong>
              </span>
              <span style={{ color: "#999", fontSize: 12 }}>{e.timestamp}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 13 }}>
              Total: {e.totalCount} &nbsp;|&nbsp;
              Breakdown: {Object.entries(e.breakdown || {}).map(([emote, count]) => (
                <span key={emote} style={{ marginRight: 8 }}>{emote} {count}</span>
              ))}
            </div>
            {e.bursts?.length > 0 && (
              <div style={{ marginTop: 4, color: "orange", fontSize: 12 }}>
                ⚡ Burst: {e.bursts.join(" ")}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}