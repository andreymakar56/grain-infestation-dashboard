"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  activityHistory,
  facility,
  initialAlerts,
  sensors,
  silos,
} from "@/lib/mock-data";
import type { Sensor, Silo, SystemStatus } from "@/lib/types";

type View = "overview" | "detail" | "alerts";

const statusText: Record<SystemStatus, string> = {
  normal: "Normal",
  suspicious: "Attention",
  critical: "High activity",
  offline: "No data",
};

function Status({ status }: { status: SystemStatus }) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {statusText[status]}
    </span>
  );
}

export function GrainDashboard() {
  const [view, setView] = useState<View>("overview");
  const [selectedId, setSelectedId] = useState("silo-04");

  const selectedSilo = silos.find((silo) => silo.id === selectedId) ?? silos[3];
  const selectedSensors = sensors.filter((sensor) => sensor.siloId === selectedSilo.id);

  const history = useMemo(() => {
    if (selectedSilo.id === "silo-04") return activityHistory;
    return activityHistory.map((point, index) => ({
      ...point,
      activity: Math.max(4, Math.round(selectedSilo.maxActivity * (0.55 + index * 0.06))),
    }));
  }, [selectedSilo]);

  const openSilo = (id: string) => {
    setSelectedId(id);
    setView("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="wordmark" onClick={() => setView("overview")}>
          <strong>KOLOS</strong>
          <span>grain acoustic monitor</span>
        </button>

        <nav aria-label="Main navigation">
          <button className={view !== "alerts" ? "nav-current" : ""} onClick={() => setView("overview")}>Overview</button>
          <button className={view === "alerts" ? "nav-current" : ""} onClick={() => setView("alerts")}>Alerts</button>
        </nav>

        <span className="prototype-tag">Prototype · mock data</span>
      </header>

      <main>
        {view === "overview" ? <Overview openSilo={openSilo} /> : null}
        {view === "detail" ? <SiloDetail silo={selectedSilo} sensors={selectedSensors} history={history} goBack={() => setView("overview")} /> : null}
        {view === "alerts" ? <Alerts openSilo={openSilo} /> : null}
      </main>
    </div>
  );
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-heading">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <span>{description}</span>
    </div>
  );
}

function Overview({ openSilo }: { openSilo: (id: string) => void }) {
  const online = sensors.filter((sensor) => sensor.connectivity === "online").length;

  return (
    <div className="page">
      <PageHeading
        eyebrow={facility.name}
        title="Facility overview"
        description={`${facility.location}. Static data for the competition prototype.`}
      />

      <button className="alert-strip" onClick={() => openSilo("silo-04")}>
        <AlertTriangle size={19} />
        <div>
          <strong>High acoustic activity in Silo 04</strong>
          <span>Sensor C · lower-middle section · activity level 87%</span>
        </div>
        <b>View silo</b>
      </button>

      <div className="summary-row">
        <div><span>Silos</span><strong>12</strong></div>
        <div><span>Sensors online</span><strong>{online} / 48</strong></div>
        <div><span>Demo alerts</span><strong>{initialAlerts.length}</strong></div>
      </div>

      <section className="silo-section">
        <div className="section-title">
          <div><h2>Silos</h2><p>Maximum acoustic activity shown for each storage unit.</p></div>
          <div className="simple-legend"><span><i className="dot-normal" />Normal</span><span><i className="dot-warning" />Attention</span><span><i className="dot-critical" />High</span></div>
        </div>

        <div className="silo-grid">
          {silos.map((silo) => <SiloTile key={silo.id} silo={silo} onClick={() => openSilo(silo.id)} />)}
        </div>
      </section>
    </div>
  );
}

function SiloTile({ silo, onClick }: { silo: Silo; onClick: () => void }) {
  return (
    <button className={`silo-tile silo-tile-${silo.status}`} onClick={onClick}>
      <div className="tile-head"><strong>{silo.name}</strong><Status status={silo.status} /></div>
      <p>{silo.grain} · {silo.fillPercent}% full</p>
      <div className="tile-reading"><span>Activity</span><b>{silo.maxActivity}%</b></div>
    </button>
  );
}

function SiloDetail({ silo, sensors, history, goBack }: { silo: Silo; sensors: Sensor[]; history: { time: string; activity: number }[]; goBack: () => void }) {
  return (
    <div className="page">
      <button className="back-button" onClick={goBack}><ArrowLeft size={16} />Overview</button>

      <div className="detail-heading">
        <div>
          <p>SILO MONITORING</p>
          <h1>{silo.name}</h1>
          <span>{silo.grain} · {silo.fillPercent}% full · mock readings</span>
        </div>
        <Status status={silo.status} />
      </div>

      <div className="silo-detail-grid">
        <section className="panel silo-panel">
          <div className="panel-heading"><h2>Sensor depth</h2><span>Activity level</span></div>
          <CapsuleSilo sensors={sensors} fillPercent={silo.fillPercent} />
        </section>

        <section className="panel readings-panel">
          <div className="panel-heading"><h2>Readings</h2><span>Four sensor positions</span></div>
          <div className="reading-list">
            {sensors.map((sensor) => (
              <div className="reading-row" key={sensor.id}>
                <div><strong>{sensor.name}</strong><span>{sensor.position}</span></div>
                <b>{sensor.activityScore}%</b>
                <Status status={sensor.status} />
              </div>
            ))}
          </div>
          <div className="environment-row">
            <div><span>Temperature</span><strong>{silo.temperature}°C</strong></div>
            <div><span>Humidity</span><strong>{silo.humidity}% RH</strong></div>
          </div>
        </section>
      </div>

      <section className="panel history-panel">
        <div className="panel-heading"><h2>Activity history</h2><span>Example readings for the presentation</span></div>
        <div className="history-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#d2cdb6" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="activity" stroke="#484b3a" strokeWidth={3} dot={{ r: 3, fill: "#fbf5d8", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function CapsuleSilo({ sensors, fillPercent }: { sensors: Sensor[]; fillPercent: number }) {
  return (
    <div className="capsule-layout">
      <div className="capsule-silo">
        <div className="capsule-fill" style={{ height: `${fillPercent}%` }} />
        <div className="probe-line" />
        {sensors.map((sensor) => (
          <span
            key={sensor.id}
            className={`capsule-node capsule-node-${sensor.status}`}
            style={{ top: `${sensor.depthPercent}%` }}
            aria-label={`${sensor.name}: ${sensor.activityScore}%`}
          />
        ))}
      </div>
      <div className="depth-labels">
        {sensors.map((sensor) => (
          <div key={sensor.id} style={{ top: `${sensor.depthPercent}%` }}>
            <strong>{sensor.name}</strong><span>{sensor.activityScore}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Alerts({ openSilo }: { openSilo: (id: string) => void }) {
  return (
    <div className="page">
      <PageHeading eyebrow="PROTOTYPE EVENTS" title="Alerts" description="Static examples of what an elevator operator could receive." />
      <div className="alerts-list">
        {initialAlerts.map((alert) => (
          <button key={alert.id} className="alert-row" onClick={() => openSilo(alert.siloId)}>
            <span className={`alert-level alert-level-${alert.severity}`}>{alert.severity === "critical" ? "High" : "Attention"}</span>
            <div><strong>{alert.title}</strong><p>{alert.message}</p><span>{alert.position} · {alert.sensorId}</span></div>
            <b>{alert.activityScore}%</b>
            <time>{alert.timestamp}</time>
          </button>
        ))}
      </div>
    </div>
  );
}
