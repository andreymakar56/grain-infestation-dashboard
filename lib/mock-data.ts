import type { Alert, Facility, Sensor, Silo } from "./types";

export const facility: Facility = {
  id: "facility-kzn-01",
  name: "Kazan Grain Elevator #1",
  location: "Kazan, Republic of Tatarstan",
};

const siloSeed = [
  ["01", "normal", 8, 4, "2 min ago", 21.4, 52, 84, "Wheat"],
  ["02", "normal", 11, 4, "48 sec ago", 20.9, 49, 71, "Barley"],
  ["03", "normal", 17, 4, "1 min ago", 22.1, 54, 90, "Wheat"],
  ["04", "critical", 87, 4, "20 sec ago", 26.8, 66, 78, "Wheat"],
  ["05", "normal", 13, 4, "35 sec ago", 21.7, 51, 66, "Rye"],
  ["06", "normal", 22, 4, "1 min ago", 22.4, 55, 88, "Wheat"],
  ["07", "suspicious", 56, 4, "42 sec ago", 24.6, 61, 73, "Barley"],
  ["08", "normal", 19, 4, "3 min ago", 21.2, 53, 81, "Wheat"],
  ["09", "normal", 9, 3, "2 min ago", 20.6, 48, 59, "Oats"],
  ["10", "suspicious", 43, 4, "55 sec ago", 24.1, 59, 76, "Wheat"],
  ["11", "normal", 15, 3, "4 min ago", 21.9, 52, 69, "Rye"],
  ["12", "normal", 12, 4, "1 min ago", 20.8, 50, 86, "Wheat"],
] as const;

export const silos: Silo[] = siloSeed.map(
  ([number, status, maxActivity, activeSensors, lastUpdate, temperature, humidity, fillPercent, grain]) => ({
    id: `silo-${number}`,
    facilityId: facility.id,
    name: `Silo ${number}`,
    capacityTonnes: 5000,
    fillPercent,
    grain,
    status,
    maxActivity,
    activeSensors,
    lastUpdate,
    temperature,
    humidity,
  }),
);

const positions = [
  ["A", "Upper section", 16],
  ["B", "Upper-middle section", 38],
  ["C", "Lower-middle section", 65],
  ["D", "Lower section", 88],
] as const;

const scoreFor = (siloNumber: number, sensorIndex: number) => {
  if (siloNumber === 4) return [12, 19, 87, 24][sensorIndex];
  if (siloNumber === 7) return [18, 56, 31, 22][sensorIndex];
  if (siloNumber === 10) return [14, 21, 29, 43][sensorIndex];
  return Math.min(38, 5 + ((siloNumber * 7 + sensorIndex * 4) % 22));
};

export const sensors: Sensor[] = silos.flatMap((silo, siloIndex) =>
  positions.map(([letter, position, depthPercent], sensorIndex) => {
    const number = siloIndex + 1;
    const offline = (number === 9 && letter === "D") || (number === 11 && letter === "B");
    const activityScore = scoreFor(number, sensorIndex);
    const status = offline
      ? "offline"
      : activityScore > 70
        ? "critical"
        : activityScore >= 40
          ? "suspicious"
          : "normal";
    return {
      id: `S${number}-${letter}`,
      siloId: silo.id,
      name: `Sensor ${letter}`,
      position,
      depthPercent,
      activityScore,
      status,
      connectivity: offline ? "offline" : "online",
      battery: offline ? 0 : 58 + ((number * 9 + sensorIndex * 11) % 40),
      lastReading: offline ? (number === 9 ? "3 hr ago" : "48 min ago") : silo.lastUpdate,
    };
  }),
);

export const activityHistory = [
  { time: "12:00", activity: 12 },
  { time: "13:00", activity: 15 },
  { time: "14:00", activity: 19 },
  { time: "15:00", activity: 25 },
  { time: "16:00", activity: 38 },
  { time: "17:00", activity: 52 },
  { time: "18:00", activity: 67 },
  { time: "18:48", activity: 87 },
];

export const facilityActivity = [
  { day: "14 Jul", average: 14 }, { day: "17 Jul", average: 16 },
  { day: "20 Jul", average: 15 }, { day: "23 Jul", average: 19 },
  { day: "26 Jul", average: 18 }, { day: "29 Jul", average: 23 },
  { day: "01 Aug", average: 21 }, { day: "04 Aug", average: 27 },
  { day: "07 Aug", average: 25 }, { day: "10 Aug", average: 31 },
  { day: "12 Aug", average: 36 },
];

export const alertHistory = [
  { week: "15–21 Jul", warning: 3, critical: 0 },
  { week: "22–28 Jul", warning: 5, critical: 1 },
  { week: "29 Jul–4 Aug", warning: 4, critical: 0 },
  { week: "5–12 Aug", warning: 7, critical: 2 },
];

export const initialAlerts: Alert[] = [
  {
    id: "alert-1042",
    sensorId: "S4-C",
    siloId: "silo-04",
    timestamp: "18:26",
    severity: "critical",
    title: "Possible insect infestation detected",
    message: "Persistent elevated acoustic activity has been detected for 42 minutes.",
    position: "Lower-middle section",
    activityScore: 87,
    durationMinutes: 42,
    state: "new",
    recommendation: "Inspect the lower-middle section of Silo 04 and take a physical grain sample before deciding on treatment.",
  },
  {
    id: "alert-1041",
    sensorId: "S7-B",
    siloId: "silo-07",
    timestamp: "16:12",
    severity: "warning",
    title: "Sustained activity above baseline",
    message: "Acoustic activity remained above the warning threshold for 18 minutes.",
    position: "Upper-middle section",
    activityScore: 56,
    durationMinutes: 18,
    state: "acknowledged",
    recommendation: "Review the next two readings and schedule a sample if activity continues to rise.",
  },
  {
    id: "alert-1038",
    sensorId: "S10-D",
    siloId: "silo-10",
    timestamp: "Yesterday, 09:40",
    severity: "warning",
    title: "Elevated acoustic activity",
    message: "Activity exceeded the local baseline during a quiet machinery period.",
    position: "Lower section",
    activityScore: 43,
    durationMinutes: 12,
    state: "resolved",
    recommendation: "No further action required. Continue normal monitoring.",
  },
];

export const mockDataSource = {
  async getFacility() { return facility; },
  async getSilos() { return silos; },
  async getSensors() { return sensors; },
  async getReadings() { return []; },
  async getAlerts() { return initialAlerts; },
};
