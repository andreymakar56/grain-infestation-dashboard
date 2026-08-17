"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BatteryMedium,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Database,
  Droplets,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Radio,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Thermometer,
  Warehouse,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, EmptyState, SectionHeading } from "./ui";
import {
  activityHistory,
  alertHistory,
  facility,
  facilityActivity,
  initialAlerts,
  sensors as seedSensors,
  silos as seedSilos,
} from "@/lib/mock-data";
import type { Alert, Sensor, Silo, SystemStatus } from "@/lib/types";

type View = "overview" | "silos" | "silo-detail" | "sensors" | "alerts" | "analytics" | "settings";

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "silos" as const, label: "Silos", icon: Warehouse },
  { id: "alerts" as const, label: "Alerts", icon: Bell },
];

const statusMeta: Record<SystemStatus, { label: string; tone: "normal" | "warning" | "critical" | "offline" }> = {
  normal: { label: "Normal", tone: "normal" },
  suspicious: { label: "Attention", tone: "warning" },
  critical: { label: "High activity", tone: "critical" },
  offline: { label: "No data", tone: "offline" },
};

function StatusBadge({ status }: { status: SystemStatus }) {
  const meta = statusMeta[status];
  return <Badge tone={meta.tone}><span className="status-dot" />{meta.label}</Badge>;
}

function formatSiloId(id: string) {
  return `Silo ${id.replace("silo-", "")}`;
}

function ChartTooltip({ active, payload, label, suffix = "%" }: { active?: boolean; payload?: Array<{ value?: number; name?: string; color?: string }>; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span>{label}</span>
      {payload.map((entry) => (
        <strong key={entry.name} style={{ color: entry.color }}>{entry.name}: {entry.value}{suffix}</strong>
      ))}
    </div>
  );
}

export function GrainDashboard() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [selectedSiloId, setSelectedSiloId] = useState("silo-04");
  const [mobileOpen, setMobileOpen] = useState(false);
  const alerts = initialAlerts;
  const silos = seedSilos;
  const sensors = seedSensors;

  const selectedSilo = silos.find((silo) => silo.id === selectedSiloId) ?? silos[3];
  const selectedSensors = sensors.filter((sensor) => sensor.siloId === selectedSilo.id);
  const unreadAlerts = alerts.filter((alert) => alert.state === "new").length;
  const activeSensors = sensors.filter((sensor) => sensor.connectivity === "online").length;

  const detailHistory = useMemo(() => {
    if (selectedSilo.id === "silo-04") return activityHistory;
    return activityHistory.map((point, index) => ({ ...point, activity: Math.max(4, Math.round(selectedSilo.maxActivity * (0.55 + index * 0.06))) }));
  }, [selectedSilo]);

  const goTo = (view: View) => {
    setActiveView(view);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSilo = (id: string) => {
    setSelectedSiloId(id);
    goTo("silo-detail");
  };

  const title = activeView === "silo-detail" ? selectedSilo.name : navigation.find((item) => item.id === activeView)?.label ?? "Overview";

  return (
    <div className="dashboard-shell">
      <Sidebar activeView={activeView} mobileOpen={mobileOpen} unreadAlerts={unreadAlerts} goTo={goTo} close={() => setMobileOpen(false)} />

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
            <div>
              <div className="mobile-facility">{facility.name}</div>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <Badge tone="neutral">Prototype</Badge>
            <span className="mock-data-label">Mock data</span>
          </div>
        </header>

        <main className="content">
          {activeView === "overview" ? <OverviewPage silos={silos} activeSensors={activeSensors} alertCount={alerts.length} openSilo={openSilo} /> : null}
          {activeView === "silos" ? <SilosPage silos={silos} openSilo={openSilo} /> : null}
          {activeView === "silo-detail" ? <SiloDetailPage silo={selectedSilo} sensors={selectedSensors} history={detailHistory} goBack={() => goTo("overview")} /> : null}
          {activeView === "alerts" ? <AlertsPage alerts={alerts} openSilo={openSilo} /> : null}
          {activeView === "sensors" ? <SensorsPage sensors={sensors} /> : null}
          {activeView === "analytics" ? <AnalyticsPage silos={silos} /> : null}
          {activeView === "settings" ? <SettingsPage /> : null}
        </main>
      </div>
    </div>
  );
}

function Sidebar({ activeView, mobileOpen, unreadAlerts, goTo, close }: { activeView: View; mobileOpen: boolean; unreadAlerts: number; goTo: (view: View) => void; close: () => void }) {
  return (
    <>
      {mobileOpen ? <button className="sidebar-backdrop" aria-label="Close navigation" onClick={close} /> : null}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand-block">
          <div className="brand-mark"><Activity size={22} strokeWidth={2.4} /></div>
          <div><strong>GrainGuard</strong><span>Acoustic monitoring</span></div>
          <button className="sidebar-close" aria-label="Close navigation" onClick={close}><X size={20} /></button>
        </div>
        <div className="facility-block">
          <span>Current facility</span>
          <strong>{facility.name}</strong>
          <small><MapPin size={12} />{facility.location}</small>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = item.id === activeView || (activeView === "silo-detail" && item.id === "silos");
            return (
              <button key={item.id} className={selected ? "nav-active" : ""} onClick={() => goTo(item.id)}>
                <Icon size={18} /><span>{item.label}</span>
                {item.id === "alerts" && unreadAlerts > 0 ? <b>{unreadAlerts}</b> : null}
              </button>
            );
          })}
        </nav>
        <p className="sidebar-version">Early dashboard prototype</p>
      </aside>
    </>
  );
}

function OverviewPage({ silos, activeSensors, alertCount, openSilo }: { silos: Silo[]; activeSensors: number; alertCount: number; openSilo: (id: string) => void }) {
  return (
    <div className="page-stack">
      <div className="overview-heading">
        <div>
          <p className="eyebrow">Acoustic monitoring prototype</p>
          <h2>Storage overview</h2>
          <p>Static demonstration of how sensor readings could be shown to an elevator operator.</p>
        </div>
      </div>

      <Card className="decision-banner decision-critical">
        <div className="decision-icon"><AlertTriangle size={24} /></div>
        <div className="decision-copy">
          <span>Demo alert</span>
          <strong>High acoustic activity in Silo 04</strong>
          <small>Sensor C · lower-middle section · activity level 87%</small>
        </div>
        <button onClick={() => openSilo("silo-04")}>Open Silo 04 <ChevronRight size={17} /></button>
      </Card>

      <section className="kpi-grid" aria-label="Facility key metrics">
        <KpiCard label="Silos" value={silos.length.toString()} icon={<Warehouse size={19} />} note="Demo facility" />
        <KpiCard label="Sensors online" value={`${activeSensors} / 48`} icon={<Radio size={19} />} note="Simulated status" />
        <KpiCard label="Alerts" value={alertCount.toString()} status="critical" note="Demo events" />
      </section>

      <section>
        <SectionHeading title="Silo status" description="Current mock activity level for each silo." action={<div className="legend"><span><i className="legend-normal" />Normal</span><span><i className="legend-warning" />Attention</span><span><i className="legend-critical" />High activity</span><span><i className="legend-offline" />Offline</span></div>} />
        <div className="silo-grid">
          {silos.map((silo) => <SiloCard key={silo.id} silo={silo} onClick={() => openSilo(silo.id)} />)}
        </div>
      </section>
    </div>
  );
}

function KpiCard({ label, value, note, status, icon }: { label: string; value: string; note: string; status?: SystemStatus; icon?: React.ReactNode }) {
  return (
    <Card className={`kpi-card ${status ? `kpi-${status}` : ""}`}>
      <div className="kpi-top"><span>{label}</span>{status ? <i className={`kpi-dot kpi-dot-${status}`} /> : <div className="kpi-icon">{icon}</div>}</div>
      <strong>{value}</strong>
      <small>{note}</small>
    </Card>
  );
}

function SiloCard({ silo, onClick }: { silo: Silo; onClick: () => void }) {
  return (
    <button className={`silo-card silo-card-${silo.status}`} onClick={onClick}>
      <div className="silo-card-top">
        <div><span className="silo-number">{silo.name.replace("Silo ", "")}</span><div><strong>{silo.name}</strong><small>{silo.grain} · {silo.fillPercent}% full</small></div></div>
        <ChevronRight size={18} />
      </div>
      <StatusBadge status={silo.status} />
      <div className="activity-reading"><span>Maximum activity</span><strong>{silo.maxActivity}%</strong></div>
      <div className="activity-meter"><i style={{ width: `${silo.maxActivity}%` }} /></div>
      <div className="silo-card-meta"><span><Radio size={14} />{silo.activeSensors}/4 active</span><span><Clock size={14} />{silo.lastUpdate}</span></div>
    </button>
  );
}

function SilosPage({ silos, openSilo }: { silos: Silo[]; openSilo: (id: string) => void }) {
  return (
    <div className="page-stack">
      <SectionHeading eyebrow="Prototype view" title="All silos" description="Static monitoring data used for the presentation." />
      <div className="silo-inventory-grid">
        {silos.map((silo) => (
          <Card key={silo.id} className={`inventory-card inventory-${silo.status}`}>
            <div className="inventory-head"><div className="mini-silo"><i style={{ height: `${silo.fillPercent}%` }} /></div><div><h3>{silo.name}</h3><p>{silo.grain} · {silo.capacityTonnes.toLocaleString()} t capacity</p><StatusBadge status={silo.status} /></div></div>
            <div className="inventory-metrics"><span><small>Filled</small><strong>{silo.fillPercent}%</strong></span><span><small>Activity</small><strong>{silo.maxActivity}%</strong></span><span><small>Temperature</small><strong>{silo.temperature}°C</strong></span></div>
            <button className="card-link" onClick={() => openSilo(silo.id)}>View monitoring detail <ChevronRight size={16} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SiloDetailPage({ silo, sensors, history, goBack }: { silo: Silo; sensors: Sensor[]; history: { time: string; activity: number }[]; goBack: () => void }) {
  const highest = sensors.reduce((max, sensor) => sensor.activityScore > max.activityScore ? sensor : max, sensors[0]);
  return (
    <div className="page-stack">
      <button className="back-link" onClick={goBack}><ArrowLeft size={16} />Back to overview</button>
      <div className="detail-heading">
        <div><p className="eyebrow">Silo prototype view</p><div className="title-with-status"><h2>{silo.name}</h2><StatusBadge status={silo.status} /></div><p>{silo.grain} · {silo.fillPercent}% full · {silo.capacityTonnes.toLocaleString()} t capacity</p></div>
      </div>

      <div className="detail-primary-grid">
        <Card className="silo-visual-card">
          <div className="card-title-row"><div><span className="eyebrow">Activity location</span><h3>Sensor depth profile</h3></div><Badge tone="neutral">Demo data</Badge></div>
          <SiloVisualization sensors={sensors} fillPercent={silo.fillPercent} />
          <div className="visual-callout"><MapPin size={17} /><div><span>Highest activity detected</span><strong>{highest.position} · {highest.name}</strong></div><b>{highest.activityScore}%</b></div>
        </Card>

        <div className="detail-side">
          <Card className={`risk-card risk-${silo.status}`}>
            <span>Current demo reading</span><StatusBadge status={silo.status} />
            <strong>{silo.status === "critical" ? "High acoustic activity" : silo.status === "suspicious" ? "Activity above baseline" : "Activity within baseline"}</strong>
            <p>{silo.status === "normal" ? "No unusual acoustic activity is shown in the mock readings." : `${highest.name} shows the highest activity near the ${highest.position.toLowerCase()}.`}</p>
          </Card>
          <div className="detail-metric-grid">
            <Metric label="Highest activity" value={`${silo.maxActivity}%`} icon={<Activity size={18} />} />
            <Metric label="Active sensors" value={`${silo.activeSensors} / 4`} icon={<Radio size={18} />} />
            <Metric label="Temperature" value={`${silo.temperature}°C`} icon={<Thermometer size={18} />} />
            <Metric label="Humidity" value={`${silo.humidity}% RH`} icon={<Droplets size={18} />} />
          </div>
        </div>
      </div>

      <Card className="chart-card">
        <div className="card-title-row"><div><span className="eyebrow">Example history</span><h3>Acoustic activity over time</h3><p>Static readings prepared for the prototype presentation.</p></div><div className="threshold-legend"><span><i className="normal-zone" />Normal &lt;40%</span><span><i className="warning-zone" />Attention 40–70%</span><span><i className="critical-zone" />High &gt;70%</span></div></div>
        <div className="activity-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#e7e9e5" strokeDasharray="3 4" vertical={false} />
              <ReferenceArea y1={0} y2={40} fill="#e8f3ea" fillOpacity={0.75} />
              <ReferenceArea y1={40} y2={70} fill="#fff4cf" fillOpacity={0.68} />
              <ReferenceArea y1={70} y2={100} fill="#fde9e5" fillOpacity={0.72} />
              <XAxis dataKey="time" tick={{ fill: "#6d746d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#6d746d", fontSize: 12 }} axisLine={false} tickLine={false} />
              <ReferenceLine y={40} stroke="#d69c13" strokeDasharray="5 5" />
              <ReferenceLine y={70} stroke="#c84d37" strokeDasharray="5 5" />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="activity" name="Activity" stroke="#263f32" strokeWidth={3} dot={{ r: 4, fill: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <section>
        <SectionHeading title="Sensor readings" description="Mock acoustic readings at four depths." />
        <div className="sensor-detail-grid">{sensors.map((sensor) => <SensorDetailCard key={sensor.id} sensor={sensor} />)}</div>
      </section>
    </div>
  );
}

function SiloVisualization({ sensors, fillPercent }: { sensors: Sensor[]; fillPercent: number }) {
  return (
    <div className="silo-visualization">
      <div className="depth-scale"><span>0 m</span><span>4 m</span><span>8 m</span><span>12 m</span><span>16 m</span></div>
      <div className="silo-vessel">
        <div className="silo-lid" />
        <div className="grain-fill" style={{ height: `${fillPercent}%` }} />
        {sensors.map((sensor) => (
          <div key={sensor.id} className={`sensor-node sensor-node-${sensor.status}`} style={{ top: `${sensor.depthPercent}%` }}>
            <span><Radio size={14} /></span><div><strong>{sensor.name}</strong><small>{sensor.position}</small></div><b>{sensor.activityScore}%</b>
          </div>
        ))}
        <div className="silo-cone" />
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card className="metric-card"><div>{icon}</div><span>{label}</span><strong>{value}</strong></Card>;
}

function SensorDetailCard({ sensor }: { sensor: Sensor }) {
  return (
    <Card className={`sensor-detail-card sensor-${sensor.status}`}>
      <div className="sensor-detail-head"><div><span>{sensor.id}</span><strong>{sensor.name}</strong></div><StatusBadge status={sensor.status} /></div>
      <p>{sensor.position}</p>
      <div className="sensor-score"><span>Activity score</span><strong>{sensor.activityScore}%</strong></div>
      <div className="activity-meter"><i style={{ width: `${sensor.activityScore}%` }} /></div>
      <div className="sensor-hardware"><span>{sensor.connectivity === "online" ? <Wifi size={15} /> : <WifiOff size={15} />}{sensor.connectivity}</span><span><BatteryMedium size={15} />{sensor.battery}%</span><span><Clock size={15} />{sensor.lastReading}</span></div>
    </Card>
  );
}

function AlertsPage({ alerts, openSilo }: { alerts: Alert[]; openSilo: (id: string) => void }) {
  return (
    <div className="page-stack">
      <SectionHeading eyebrow="Prototype view" title="Alerts" description="Example events used to demonstrate how an operator could locate unusual activity." action={<Badge tone="neutral">Mock data</Badge>} />
      <div className="alerts-list">
        {alerts.length ? alerts.map((alert) => <AlertCard key={alert.id} alert={alert} openSilo={openSilo} />) : <EmptyState>No demo alerts.</EmptyState>}
      </div>
    </div>
  );
}

function AlertCard({ alert, openSilo }: { alert: Alert; openSilo: (id: string) => void }) {
  return (
    <Card className={`alert-card alert-${alert.severity} alert-state-${alert.state}`}>
      <div className="alert-rail"><AlertTriangle size={20} /></div>
      <div className="alert-body">
        <div className="alert-head"><div><Badge tone={alert.severity === "critical" ? "critical" : "warning"}>{alert.severity === "critical" ? "HIGH ACTIVITY" : "ATTENTION"}</Badge></div><span>{alert.timestamp}</span></div>
        <h3>{alert.title}</h3>
        <p>{alert.message}</p>
        <div className="alert-facts"><span><small>Silo</small><strong>{formatSiloId(alert.siloId)}</strong></span><span><small>Sensor</small><strong>{alert.sensorId}</strong></span><span><small>Location</small><strong>{alert.position}</strong></span><span><small>Activity</small><strong>{alert.activityScore}%</strong></span></div>
        <div className="alert-actions">
          <Button variant="secondary" onClick={() => openSilo(alert.siloId)}>View silo</Button>
        </div>
      </div>
    </Card>
  );
}

function SensorsPage({ sensors }: { sensors: Sensor[] }) {
  const [query, setQuery] = useState("");
  const [siloFilter, setSiloFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [connectivityFilter, setConnectivityFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const filtered = sensors.filter((sensor) => {
    const matchesQuery = sensor.id.toLowerCase().includes(query.toLowerCase()) || sensor.position.toLowerCase().includes(query.toLowerCase());
    const matchesSilo = siloFilter === "all" || sensor.siloId === siloFilter;
    const matchesStatus = statusFilter === "all" || sensor.status === statusFilter;
    const matchesConnectivity = connectivityFilter === "all" || sensor.connectivity === connectivityFilter;
    const matchesActivity = activityFilter === "all" || (activityFilter === "low" && sensor.activityScore < 40) || (activityFilter === "medium" && sensor.activityScore >= 40 && sensor.activityScore <= 70) || (activityFilter === "high" && sensor.activityScore > 70);
    return matchesQuery && matchesSilo && matchesStatus && matchesConnectivity && matchesActivity;
  });
  return (
    <div className="page-stack">
      <SectionHeading eyebrow="Device fleet" title="Sensors" description="Connectivity, power, and latest acoustic activity for all 48 probes." action={<div className="fleet-health"><span><i />46 online</span><span>2 offline</span></div>} />
      <Card className="filters-card">
        <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sensor or position" aria-label="Search sensors" /></div>
        <FilterSelect label="Silo" value={siloFilter} onChange={setSiloFilter}><option value="all">All silos</option>{seedSilos.map((silo) => <option key={silo.id} value={silo.id}>{silo.name}</option>)}</FilterSelect>
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All statuses</option><option value="normal">Normal</option><option value="suspicious">Suspicious</option><option value="critical">Critical</option><option value="offline">Offline</option></FilterSelect>
        <FilterSelect label="Connectivity" value={connectivityFilter} onChange={setConnectivityFilter}><option value="all">Online & offline</option><option value="online">Online</option><option value="offline">Offline</option></FilterSelect>
        <FilterSelect label="Activity" value={activityFilter} onChange={setActivityFilter}><option value="all">All activity</option><option value="low">Below 40%</option><option value="medium">40–70%</option><option value="high">Above 70%</option></FilterSelect>
        <button className="clear-filters" onClick={() => { setQuery(""); setSiloFilter("all"); setStatusFilter("all"); setConnectivityFilter("all"); setActivityFilter("all"); }}>Clear</button>
      </Card>
      <Card className="table-card">
        <div className="table-meta"><span><SlidersHorizontal size={15} />Showing {filtered.length} of {sensors.length} sensors</span><small>Sorted by activity score</small></div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Sensor ID</th><th>Silo</th><th>Position</th><th>Activity score</th><th>Status</th><th>Connectivity</th><th>Battery</th><th>Last reading</th></tr></thead>
            <tbody>{[...filtered].sort((a, b) => b.activityScore - a.activityScore).map((sensor) => (
              <tr key={sensor.id}><td><strong>{sensor.id}</strong></td><td>{formatSiloId(sensor.siloId)}</td><td>{sensor.position}</td><td><div className="table-activity"><strong>{sensor.activityScore}%</strong><span><i style={{ width: `${sensor.activityScore}%` }} /></span></div></td><td><StatusBadge status={sensor.status} /></td><td><span className={`connectivity connectivity-${sensor.connectivity}`}>{sensor.connectivity === "online" ? <Wifi size={14} /> : <WifiOff size={14} />}{sensor.connectivity}</span></td><td><span className="battery"><BatteryMedium size={15} />{sensor.battery}%</span></td><td>{sensor.lastReading}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="filter-select"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function AnalyticsPage({ silos }: { silos: Silo[] }) {
  const bySilo = silos.map((silo) => ({ silo: silo.name.replace("Silo ", "S"), activity: silo.maxActivity, status: silo.status }));
  return (
    <div className="page-stack">
      <SectionHeading eyebrow="Operational trends" title="Analytics" description="Practical acoustic activity and alert trends for intervention planning." action={<div className="date-range"><Clock size={15} />Last 30 days</div>} />
      <div className="analytics-summary"><Card><span>Average facility activity</span><strong>24.6%</strong><small className="trend-up">↑ 4.2% vs previous period</small></Card><Card><span>Warning events</span><strong>19</strong><small>Across 5 silos</small></Card><Card><span>Critical events</span><strong>3</strong><small>2 physically inspected</small></Card><Card><span>Median response time</span><strong>18 min</strong><small className="trend-good">↓ 6 min improvement</small></Card></div>
      <Card className="chart-card">
        <div className="card-title-row"><div><h3>Insect activity over time</h3><p>Average validated acoustic activity across the facility.</p></div><Badge tone="normal">Facility average</Badge></div>
        <div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={facilityActivity} margin={{ top: 12, right: 12, left: -14, bottom: 0 }}><CartesianGrid stroke="#e7e9e5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#6d746d", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 60]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#6d746d", fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} /><Line dataKey="average" name="Average" type="monotone" stroke="#2f6146" strokeWidth={3} dot={{ fill: "#fff", stroke: "#2f6146", strokeWidth: 2, r: 3 }} /></LineChart></ResponsiveContainer></div>
      </Card>
      <div className="analytics-grid">
        <Card className="chart-card"><div className="card-title-row"><div><h3>Activity by silo</h3><p>Current maximum validated score.</p></div></div><div className="small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={bySilo} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><CartesianGrid stroke="#e7e9e5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="silo" tick={{ fill: "#6d746d", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#6d746d", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ChartTooltip />} /><ReferenceLine y={70} stroke="#c84d37" strokeDasharray="4 4" /><Bar dataKey="activity" name="Activity" fill="#4f745e" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card className="chart-card"><div className="card-title-row"><div><h3>Alerts history</h3><p>Validated warning and critical events.</p></div></div><div className="small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={alertHistory} margin={{ top: 10, right: 4, left: -22, bottom: 0 }}><CartesianGrid stroke="#e7e9e5" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="week" tick={{ fill: "#6d746d", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#6d746d", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} /><Tooltip content={<ChartTooltip suffix="" />} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="warning" name="Warning" stackId="a" fill="#d8a72d" radius={[0, 0, 0, 0]} /><Bar dataKey="critical" name="Critical" stackId="a" fill="#c84d37" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
    </div>
  );
}

function SettingsPage() {
  const [channels, setChannels] = useState({ telegram: true, sms: false, email: true, push: true });
  const [saved, setSaved] = useState(false);
  const channelRows = [
    { id: "telegram" as const, label: "Telegram", description: "Immediate alerts to the facility operations channel", icon: <MessageCircle size={19} /> },
    { id: "sms" as const, label: "SMS", description: "Critical events to the on-call operator", icon: <Smartphone size={19} /> },
    { id: "email" as const, label: "Email", description: "Alert details and daily monitoring summary", icon: <Mail size={19} /> },
    { id: "push" as const, label: "Push notifications", description: "Browser and mobile notifications for signed-in operators", icon: <Bell size={19} /> },
  ];
  return (
    <div className="page-stack settings-page">
      <SectionHeading eyebrow="System configuration" title="Settings" description="Monitoring rules, delivery channels, and future data connection settings." />
      <div className="settings-grid">
        <Card className="settings-card">
          <div className="settings-title"><Bell size={20} /><div><h3>Notification channels</h3><p>Choose how validated alerts should reach the operations team.</p></div></div>
          <div className="channel-list">{channelRows.map((channel) => <div key={channel.id} className="channel-row"><div className="channel-icon">{channel.icon}</div><div><strong>{channel.label}</strong><span>{channel.description}</span></div><button className={`toggle ${channels[channel.id] ? "toggle-on" : ""}`} role="switch" aria-checked={channels[channel.id]} onClick={() => { setSaved(false); setChannels((current) => ({ ...current, [channel.id]: !current[channel.id] })); }}><i /></button></div>)}</div>
          <Button onClick={() => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); }}>{saved ? <Check size={16} /> : null}{saved ? "Saved" : "Save notification settings"}</Button>
        </Card>
        <Card className="settings-card">
          <div className="settings-title"><Activity size={20} /><div><h3>Detection thresholds</h3><p>Server-side validation rules used to suppress isolated acoustic noise.</p></div></div>
          <div className="threshold-settings"><div><span><i className="legend-normal" />Normal</span><strong>Below 40%</strong></div><div><span><i className="legend-warning" />Warning</span><strong>40–70%</strong></div><div><span><i className="legend-critical" />Critical</span><strong>Above 70% + persistence</strong></div></div>
          <div className="logic-note"><ShieldCheck size={18} /><p><strong>False-alarm protection enabled</strong><br />A critical alert requires repeated elevated readings over time. One spike from machinery or grain movement will not trigger intervention.</p></div>
        </Card>
        <Card className="settings-card settings-wide">
          <div className="settings-title"><Database size={20} /><div><h3>Sensor data connection</h3><p>The prototype currently uses local simulated data through a replaceable provider.</p></div><Badge tone="blue">Demo data</Badge></div>
          <div className="data-flow"><span><Radio size={18} /><b>48 acoustic sensors</b></span><ChevronRight size={17} /><span><Wifi size={18} /><b>Gateway KZN-01</b></span><ChevronRight size={17} /><span><Database size={18} /><b>API / Supabase ready</b></span><ChevronRight size={17} /><span><LayoutDashboard size={18} /><b>Dashboard</b></span></div>
        </Card>
      </div>
    </div>
  );
}
