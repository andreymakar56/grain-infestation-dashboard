"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, FileText, Upload } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { activityHistory, facility, initialAlerts, sensors, silos } from "@/lib/mock-data";
import type { Sensor, Silo, SystemStatus } from "@/lib/types";

type View = "overview" | "detail" | "alerts" | "journal";

const statusText: Record<SystemStatus, string> = {
  normal: "Норма",
  suspicious: "Внимание",
  critical: "Тревога",
  offline: "Нет связи",
};

const firmwareStatus: Record<SystemStatus, string> = {
  normal: "NORMAL",
  suspicious: "ATTENTION",
  critical: "ALERT",
  offline: "OFFLINE",
};

const numberFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

function formatNumber(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function Status({ status, showCode = false }: { status: SystemStatus; showCode?: boolean }) {
  return (
    <span className={`status status-${status}`} title={`Код прошивки: ${firmwareStatus[status]}`}>
      <i />
      <span>{statusText[status]}</span>
      {showCode ? <small>{firmwareStatus[status]}</small> : null}
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

  const navigate = (nextView: View) => {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openSilo = (id: string) => {
    setSelectedId(id);
    navigate("detail");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="wordmark" onClick={() => navigate("overview")} aria-label="Открыть обзор элеватора">
          <strong>KOLOS</strong>
          <span>акустический мониторинг зерна</span>
        </button>

        <nav aria-label="Основная навигация">
          <button className={view === "overview" || view === "detail" ? "nav-current" : ""} onClick={() => navigate("overview")}>Обзор</button>
          <button className={view === "alerts" ? "nav-current" : ""} onClick={() => navigate("alerts")}>Тревоги</button>
          <button className={view === "journal" ? "nav-current" : ""} onClick={() => navigate("journal")}>Журнал прототипа</button>
        </nav>

        <span className="prototype-tag">Прототип · тестовые данные</span>
      </header>

      <main>
        {view === "overview" ? <Overview openSilo={openSilo} /> : null}
        {view === "detail" ? <SiloDetail silo={selectedSilo} sensors={selectedSensors} history={history} goBack={() => navigate("overview")} /> : null}
        {view === "alerts" ? <Alerts openSilo={openSilo} /> : null}
        {view === "journal" ? <PrototypeJournal /> : null}
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
        eyebrow={`${facility.name} · ${facility.location}`}
        title="Обзор элеватора"
        description="Тестовая панель оператора. Все показания на этой странице являются тестовыми."
      />

      <button className="alert-strip" onClick={() => openSilo("silo-04")} aria-label="Открыть Силос 04 с тревогой">
        <AlertTriangle size={19} aria-hidden="true" />
        <div>
          <strong>Высокая акустическая активность в Силосе 04</strong>
          <span>Датчик C · средняя часть, ниже центра · 10 событий из 20</span>
        </div>
        <b>Открыть силос</b>
      </button>

      <div className="summary-row">
        <div><span>Силосы</span><strong>{integerFormatter.format(silos.length)}</strong></div>
        <div><span>Датчики на связи</span><strong>{integerFormatter.format(online)} / 48</strong></div>
        <div><span>Тестовые тревоги</span><strong>{integerFormatter.format(initialAlerts.length)}</strong></div>
      </div>

      <section className="silo-section">
        <div className="section-title">
          <div><h2>Силосы</h2><p>Для каждого силоса показана максимальная акустическая активность среди его датчиков.</p></div>
          <div className="simple-legend" aria-label="Обозначения статусов">
            <span><i className="dot-normal" />Норма</span>
            <span><i className="dot-warning" />Внимание</span>
            <span><i className="dot-critical" />Тревога</span>
          </div>
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
    <button className={`silo-tile silo-tile-${silo.status}`} onClick={onClick} aria-label={`Открыть ${silo.name}, статус: ${statusText[silo.status]}`}>
      <div className="tile-head"><strong>{silo.name}</strong><Status status={silo.status} /></div>
      <p>{silo.grain} · заполнение {integerFormatter.format(silo.fillPercent)}&nbsp;%</p>
      <div className="tile-reading"><span>Активность</span><b>{integerFormatter.format(silo.maxActivity)}&nbsp;%</b></div>
    </button>
  );
}

function SiloDetail({ silo, sensors: siloSensors, history, goBack }: { silo: Silo; sensors: Sensor[]; history: { time: string; activity: number }[]; goBack: () => void }) {
  const alert = initialAlerts.find((item) => item.siloId === silo.id);

  return (
    <div className="page">
      <button className="back-button" onClick={goBack}><ArrowLeft size={16} aria-hidden="true" />К обзору</button>

      <div className="detail-heading">
        <div>
          <p>МОНИТОРИНГ СИЛОСА</p>
          <h1>{silo.name}</h1>
          <span>{silo.grain} · заполнение {integerFormatter.format(silo.fillPercent)}&nbsp;% · тестовые показания</span>
        </div>
        <Status status={silo.status} showCode />
      </div>

      <div className="silo-detail-grid">
        <section className="panel silo-panel">
          <div className="panel-heading"><h2>Глубина датчиков</h2><span>Акустическая активность</span></div>
          <CapsuleSilo sensors={siloSensors} fillPercent={silo.fillPercent} />
        </section>

        <section className="panel readings-panel">
          <div className="panel-heading"><h2>Показания</h2><span>Четыре положения зонда</span></div>
          <div className="reading-list">
            {siloSensors.map((sensor) => (
              <div className="reading-row" key={sensor.id}>
                <div><strong>{sensor.name}</strong><span>{sensor.position}</span></div>
                <b>{integerFormatter.format(sensor.activityScore)}&nbsp;%</b>
                <span className="reading-events">События: <strong>{integerFormatter.format(sensor.eventCount)} из 20</strong></span>
                <Status status={sensor.status} />
              </div>
            ))}
          </div>
          <div className="environment-row">
            <div><span>Температура</span><strong>{formatNumber(silo.temperature)}&nbsp;°C</strong></div>
            <div><span>Влажность</span><strong>{integerFormatter.format(silo.humidity)}&nbsp;%</strong></div>
          </div>
        </section>
      </div>

      <section className="panel decision-panel">
        <div className="panel-heading"><h2>Как зонд принимает решение</h2><span>Логика прототипа</span></div>
        <ol>
          <li>После включения зонд 10 секунд слушает фон и определяет базовый уровень RMS.</li>
          <li>Порог устанавливается в 1,25 раза выше фонового уровня.</li>
          <li>Каждое короткое окно, в котором RMS выше порога, считается событием.</li>
          <li>Статус зависит от числа событий среди последних 20 окон: NORMAL, ATTENTION или ALERT.</li>
        </ol>
      </section>

      {alert ? (
        <section className={`recommendation-card recommendation-${alert.severity}`} aria-label="Рекомендация оператору">
          <AlertTriangle size={20} aria-hidden="true" />
          <div><strong>Что делать оператору</strong><p>{alert.recommendation}</p></div>
        </section>
      ) : null}

      <section className="panel history-panel">
        <div className="panel-heading"><h2>История активности</h2><span>Тестовые показания</span></div>
        <div className="history-chart" role="img" aria-label="График акустической активности по времени">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#d2cdb6" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${integerFormatter.format(Number(value))}\u00a0%`, "Активность"]} labelFormatter={(label) => `Время: ${label}`} />
              <Line type="monotone" dataKey="activity" stroke="#484b3a" strokeWidth={3} dot={{ r: 3, fill: "#fbf5d8", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

function CapsuleSilo({ sensors: siloSensors, fillPercent }: { sensors: Sensor[]; fillPercent: number }) {
  return (
    <div className="capsule-layout">
      <div className="capsule-silo" aria-label={`Схема силоса, заполнение ${fillPercent} процентов`}>
        <div className="capsule-fill" style={{ height: `${fillPercent}%` }} />
        <div className="probe-line" />
        {siloSensors.map((sensor) => (
          <span
            key={sensor.id}
            className={`capsule-node capsule-node-${sensor.status}`}
            style={{ top: `${sensor.depthPercent}%` }}
            aria-label={`${sensor.name}: активность ${sensor.activityScore} процентов, ${sensor.eventCount} событий из 20`}
          />
        ))}
      </div>
      <div className="depth-labels">
        {siloSensors.map((sensor) => (
          <div key={sensor.id} style={{ top: `${sensor.depthPercent}%` }}>
            <strong>{sensor.name}</strong><span>{integerFormatter.format(sensor.activityScore)}&nbsp;%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Alerts({ openSilo }: { openSilo: (id: string) => void }) {
  return (
    <div className="page">
      <PageHeading eyebrow="ПРОТОТИП · ТЕСТОВЫЕ ДАННЫЕ" title="Журнал тревог" description="Примеры уведомлений, которые может получать оператор элеватора." />
      <div className="alerts-list">
        {initialAlerts.map((alert) => (
          <button key={alert.id} className="alert-row" onClick={() => openSilo(alert.siloId)} aria-label={`Открыть ${alert.title}, ${alert.timestamp}`}>
            <span className={`alert-level alert-level-${alert.severity}`}>{alert.severity === "critical" ? "Тревога" : "Внимание"}</span>
            <div>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
              <span>{alert.position} · {alert.sensorId}</span>
              <p className="alert-recommendation"><b>Рекомендация:</b> {alert.recommendation}</p>
            </div>
            <b>{integerFormatter.format(alert.activityScore)}&nbsp;%</b>
            <time>{alert.timestamp}</time>
          </button>
        ))}
      </div>
    </div>
  );
}

type LogStatus = "normal" | "suspicious" | "critical";

interface PrototypePoint {
  time: number;
  impact: boolean;
  label: string;
  amp: number;
  rms: number;
  activity: number;
  events: number;
  status: LogStatus;
  normalRms: number | null;
  attentionRms: number | null;
  alertRms: number | null;
}

interface ParsedLog {
  points: PrototypePoint[];
  baseline: number | null;
  threshold: number | null;
}

function parsePrototypeLog(text: string): ParsedLog {
  let baseline: number | null = null;
  let threshold: number | null = null;
  const points: PrototypePoint[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const baselineMatch = line.match(/Baseline RMS:\s*([\d.,]+)/i);
    if (baselineMatch) {
      baseline = Number(baselineMatch[1].replace(",", "."));
      continue;
    }

    const thresholdMatch = line.match(/Detection threshold:\s*([\d.,]+)/i);
    if (thresholdMatch) {
      threshold = Number(thresholdMatch[1].replace(",", "."));
      continue;
    }

    const fields = rawLine.split("\t");
    if (fields.length < 4) continue;
    const time = Number(fields[0].replace(",", "."));
    const impact = fields[1].trim() === "1";
    const label = fields[2].trim() || "Без метки";
    const firmwareLine = fields.slice(3).join("\t");
    const reading = firmwareLine.match(/AMP:\s*([\d.,]+)\s+RMS:\s*([\d.,]+)\s+ACTIVITY:\s*([\d.,]+)%\s+EVENTS:\s*(\d+)\/20\s+STATUS:\s*(NORMAL|ATTENTION|ALERT)/i);
    if (!reading || Number.isNaN(time)) continue;

    const statusMap: Record<string, LogStatus> = { NORMAL: "normal", ATTENTION: "suspicious", ALERT: "critical" };
    const status = statusMap[reading[5].toUpperCase()];
    const rms = Number(reading[2].replace(",", "."));
    points.push({
      time,
      impact,
      label,
      amp: Number(reading[1].replace(",", ".")),
      rms,
      activity: Number(reading[3].replace(",", ".")),
      events: Number(reading[4]),
      status,
      normalRms: status === "normal" ? rms : null,
      attentionRms: status === "suspicious" ? rms : null,
      alertRms: status === "critical" ? rms : null,
    });
  }

  return { points, baseline, threshold };
}

function PrototypeJournal() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [points, setPoints] = useState<PrototypePoint[]>([]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const impactRanges = useMemo(() => {
    const ranges: { start: number; end: number }[] = [];
    let start: number | null = null;
    points.forEach((point, index) => {
      if (point.impact && start === null) start = point.time;
      const nextIsImpact = points[index + 1]?.impact ?? false;
      if (point.impact && !nextIsImpact && start !== null) {
        ranges.push({ start, end: point.time });
        start = null;
      }
    });
    return ranges;
  }, [points]);

  const loadFile = async (file: File) => {
    setError("");
    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Выберите текстовый файл в формате .txt.");
      return;
    }
    try {
      const parsed = parsePrototypeLog(await file.text());
      if (parsed.points.length === 0) {
        setError("В файле не найдено строк с показаниями AMP, RMS, EVENTS и STATUS.");
        return;
      }
      setPoints(parsed.points);
      setBaseline(parsed.baseline);
      setThreshold(parsed.threshold);
      setFileName(file.name);
    } catch {
      setError("Не удалось прочитать файл. Проверьте его формат и попробуйте снова.");
    }
  };

  const latest = points.at(-1);
  const maximumEvents = points.reduce((maximum, point) => Math.max(maximum, point.events), 0);

  return (
    <div className="page">
      <PageHeading
        eyebrow="ДАННЫЕ ФИЗИЧЕСКОГО ПРОТОТИПА"
        title="Журнал прототипа"
        description="Файл обрабатывается только в браузере и никуда не отправляется."
      />

      <section
        className={`upload-zone ${dragging ? "upload-zone-dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) void loadFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
          aria-label="Выбрать текстовый журнал зонда"
        />
        <Upload size={25} aria-hidden="true" />
        <div><strong>Перетащите журнал зонда сюда</strong><span>или выберите текстовый файл на устройстве</span></div>
        <button type="button" onClick={() => inputRef.current?.click()}>Выбрать файл</button>
      </section>

      {error ? <p className="file-error" role="alert">{error}</p> : null}

      {points.length === 0 ? (
        <div className="empty-journal">
          <FileText size={28} aria-hidden="true" />
          <strong>Запись пока не загружена</strong>
          <p>Ожидаемый формат строки: время в секундах, воздействие 0 или 1, метка и строка прошивки. Поля разделяются табуляцией.</p>
        </div>
      ) : (
        <>
          <div className="journal-summary">
            <div><span>Файл</span><strong>{fileName}</strong></div>
            <div><span>Базовый RMS</span><strong>{baseline === null ? "Не найден" : numberFormatter.format(baseline)}</strong></div>
            <div><span>Порог</span><strong>{threshold === null ? "Не найден" : numberFormatter.format(threshold)}</strong></div>
            <div><span>Максимум событий</span><strong>{maximumEvents} из 20</strong></div>
            <div><span>Последний статус</span>{latest ? <Status status={latest.status} showCode /> : null}</div>
          </div>

          <section className="panel journal-chart-panel">
            <div className="panel-heading"><h2>RMS по времени</h2><span>Бежевым отмечено внешнее воздействие</span></div>
            <div className="journal-chart" role="img" aria-label="График RMS из загруженного журнала прототипа">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 18, right: 18, left: -8, bottom: 4 }}>
                  <CartesianGrid stroke="#d2cdb6" vertical={false} />
                  {impactRanges.map((range, index) => <ReferenceArea key={`${range.start}-${index}`} x1={range.start} x2={range.end} fill="#d5c58d" fillOpacity={0.32} />)}
                  {threshold !== null ? <ReferenceLine y={threshold} stroke="#a94f3b" strokeDasharray="5 4" label={{ value: `Порог ${numberFormatter.format(threshold)}`, fill: "#a94f3b", fontSize: 11, position: "insideTopRight" }} /> : null}
                  <XAxis type="number" dataKey="time" domain={["dataMin", "dataMax"]} tickFormatter={(value) => `${numberFormatter.format(Number(value))} с`} tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#747361", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value, name) => [numberFormatter.format(Number(value)), name === "rms" ? "RMS" : String(name)]} labelFormatter={(label) => `${numberFormatter.format(Number(label))} с`} />
                  <Line type="monotone" dataKey="rms" stroke="#484b3a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="normalRms" stroke="transparent" dot={{ r: 3, fill: "#66734f", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="attentionRms" stroke="transparent" dot={{ r: 3, fill: "#b08a35", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="alertRms" stroke="transparent" dot={{ r: 3, fill: "#a94f3b", strokeWidth: 0 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              <span><i className="dot-normal" />NORMAL</span>
              <span><i className="dot-warning" />ATTENTION</span>
              <span><i className="dot-critical" />ALERT</span>
              <span><i className="impact-swatch" />Воздействие</span>
            </div>
          </section>

          <section className="panel log-table-panel">
            <div className="panel-heading"><h2>Последние записи</h2><span>{integerFormatter.format(points.length)} распознанных строк</span></div>
            <div className="log-table-wrap">
              <table>
                <thead><tr><th>Время</th><th>Метка</th><th>RMS</th><th>События</th><th>Статус</th></tr></thead>
                <tbody>
                  {points.slice(-8).reverse().map((point, index) => (
                    <tr key={`${point.time}-${index}`}>
                      <td>{numberFormatter.format(point.time)}&nbsp;с</td>
                      <td>{point.label}</td>
                      <td>{numberFormatter.format(point.rms)}</td>
                      <td>{point.events} из 20</td>
                      <td><Status status={point.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
