import { useEffect, useState, useRef } from "react";
import "./style.css"
import { triggerEmojiBurst } from "./burst";

const DEFAULT_SETTINGS = { windowMs: 5000, threshold: 4 };

export default function App() {
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [formValues, setFormValues] = useState(DEFAULT_SETTINGS);
  const [settingsStatus, setSettingsStatus] = useState(null); // 'saved' | 'error'
  const mediaPanelRef = useRef(null);

  //WebSocket: receive aggregated events from Server A
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [data, ...prev]);
      // here activate the emoji burst animation
      if (mediaPanelRef.current) {
        triggerEmojiBurst(mediaPanelRef.current, data.emote, data.count);
      }
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

  // Function for timestamp formatting
  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meaningful Moments</h1>
      </header>

      <section className="settings-panel">
        <h2>Aggregator Settings</h2>

        <form className="settings-row"
          onSubmit={(e) => {
            e.preventDefault();
            saveSettings();
          }}
        >
          <label>
            Window (ms)
            <input
              type="number"
              min={100}
              step={100}
              inputMode="numeric"
              value={formValues.windowMs}
              onChange={(e) =>
                setFormValues((f) => ({
                  ...f,
                  windowMs:
                    e.target.value === ""
                      ? ""
                      : e.target.valueAsNumber,
                }))
              }
            />
          </label>

          <label>
            Threshold
            <input type="number"
              min={1} step={1}
              inputMode="numeric"
              value={formValues.threshold}
              onChange={(e) =>
                setFormValues((f) => ({
                  ...f,
                  threshold:
                    e.target.value === ""
                      ? ""
                      : e.target.valueAsNumber,
                }))
              }
            />
          </label>

          <button className="btn-save" type="submit">
            Save
          </button>

          {settingsStatus === "saved" && (
            <span className="status-saved">✓ Saved</span>
          )}

          {settingsStatus === "error" && (
            <span className="status-error">✗ Error</span>
          )}
        </form>

        <p className="settings-active">
          Window = <span>{settings.windowMs} ms</span>, Threshold ={" "}
          <span>{settings.threshold}</span>
        </p>
      </section>

      <div className="content-grid">
        <div className="media-panel"
          ref={mediaPanelRef}
          style ={{position: "relative"}}
        >
          <video  src="/rabbit.mp4" autoPlay loop muted playsInline />
        </div>
        <section className="feed-panel">
          <h2>Live Feed</h2>
          <div className="feed-scroll">
            {events.length === 0 && (
              <p className="feed-empty">Waiting for events…</p>
            )}
            {events.map((e, i) => (
              <div className={`event-card`}
                key={i}
              >
                <div className="event-card-top">
                  <span className="event-emote">
                    {e.emote}
                    <span className="event-count">×{e.count}</span>
                  </span>
                  <span className="event-time">{formatTime(e.timestamp)}</span>
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