import { useEffect, useState } from "react";

export default function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [data, ...prev]);
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h1>Meaningful Moments</h1>
      {events.map((e, i) => (
        <div key={i}>
          {e.emote} × {e.count} ({e.timestamp})
        </div>
      ))}
    </div>
  );
}