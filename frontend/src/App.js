import { useEffect, useState } from "react";
import "./style.css"

const DEFAULT_SETTINGS = { windowMs: 5000, threshold: 4 };

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
    <div className="app">
      <header className="app-header">
        <h1>Meaningful Moments</h1>
      </header>

      <section className="settings-panel">
        <h2>Aggregator Settings</h2>
        <div className="settings-row">
          <label>
            Window (ms)
            <input
              type="number"
              value={formValues.windowMs}
              onChange={(e) =>
                setFormValues((f) => ({ ...f, windowMs: Number(e.target.value) }))
              }
            />
          </label>
          <label>
            Threshold
            <input
              type="number"
              value={formValues.threshold}
              onChange={(e) =>
                setFormValues((f) => ({ ...f, threshold: Number(e.target.value) }))
              }
            />
          </label>
          <button className="btn-save" onClick={saveSettings}>Save</button>
          {settingsStatus === "saved" && <span className="status-saved">✓ Saved</span>}
          {settingsStatus === "error" && <span className="status-error">✗ Error</span>}
        </div>
        <p className="settings-active">
          Active: window=<span>{settings.windowMs}ms</span>, threshold=<span>{settings.threshold}</span>
        </p>
      </section>

      <div className="content-grid">
        <div className="media-panel">
          <video  src="/rabbit.mp4" autoPlay loop muted playsInline />
        </div>
        <section className="feed-panel">
          <h2>Live Feed</h2>
          <div className="feed-scroll">
            {events.length === 0 && (
              <p className="feed-empty">Waiting for events…</p>
            )}
            {events.map((e, i) => (
              <div
                key={i}
                className={`event-card`}
              >
                <div className="event-card-top">
                  <span className="event-emote">
                    {e.emote}
                    <span className="event-count">×{e.count}</span>
                  </span>
                  <span className="event-time">{e.timestamp}</span>
                </div>
                {e.bursts?.length > 0 && (
                  <div className="event-burst">
                    <span className="burst-icon">⚡</span>
                    Burst: {e.bursts.join(" ")}
                  </div>
                )}
              </div>
            ))}
            </div>
        </section>
      </div>
    </div>
  );
}