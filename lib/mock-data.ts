import type { Alert, Facility, Sensor, Silo } from "./types";

export const facility: Facility = {
  id: "facility-kzn-demo",
  name: "Демо-элеватор",
  location: "Оренбург, Оренбургская область",
};

const siloSeed = [
  ["01", "normal", 8, 4, "2 мин назад", 21.4, 52, 84, "Пшеница"],
  ["02", "normal", 11, 4, "48 с назад", 20.9, 49, 71, "Ячмень"],
  ["03", "normal", 17, 4, "1 мин назад", 22.1, 54, 90, "Пшеница"],
  ["04", "critical", 87, 4, "20 с назад", 21.8, 53, 78, "Пшеница"],
  ["05", "normal", 13, 4, "35 с назад", 21.7, 51, 66, "Рожь"],
  ["06", "normal", 22, 4, "1 мин назад", 22.4, 55, 88, "Пшеница"],
  ["07", "suspicious", 56, 4, "42 с назад", 21.6, 54, 73, "Ячмень"],
  ["08", "normal", 19, 4, "3 мин назад", 21.2, 53, 81, "Пшеница"],
  ["09", "normal", 9, 3, "2 мин назад", 20.6, 48, 59, "Овёс"],
  ["10", "suspicious", 43, 4, "55 с назад", 21.9, 55, 76, "Пшеница"],
  ["11", "normal", 15, 3, "4 мин назад", 21.9, 52, 69, "Рожь"],
  ["12", "normal", 12, 4, "1 мин назад", 20.8, 50, 86, "Пшеница"],
] as const;

export const silos: Silo[] = siloSeed.map(
  ([number, status, maxActivity, activeSensors, lastUpdate, temperature, humidity, fillPercent, grain]) => ({
    id: `silo-${number}`,
    facilityId: facility.id,
    name: `Силос ${number}`,
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
  ["A", "верхняя часть", 16],
  ["B", "средняя часть, выше центра", 38],
  ["C", "средняя часть, ниже центра", 65],
  ["D", "нижняя часть", 88],
] as const;

const scoreFor = (siloNumber: number, sensorIndex: number) => {
  if (siloNumber === 4) return [12, 19, 87, 24][sensorIndex];
  if (siloNumber === 7) return [18, 56, 31, 22][sensorIndex];
  if (siloNumber === 10) return [14, 21, 29, 43][sensorIndex];
  return Math.min(38, 5 + ((siloNumber * 7 + sensorIndex * 4) % 22));
};

const eventsFor = (siloNumber: number, sensorIndex: number, score: number) => {
  if (siloNumber === 4 && sensorIndex === 2) return 10;
  if (siloNumber === 7 && sensorIndex === 1) return 6;
  if (siloNumber === 10 && sensorIndex === 3) return 5;
  return Math.min(4, Math.floor(score / 9));
};

export const sensors: Sensor[] = silos.flatMap((silo, siloIndex) =>
  positions.map(([letter, position, depthPercent], sensorIndex) => {
    const number = siloIndex + 1;
    const offline = (number === 9 && letter === "D") || (number === 11 && letter === "B");
    const activityScore = scoreFor(number, sensorIndex);
    const eventCount = offline ? 0 : eventsFor(number, sensorIndex, activityScore);
    const baselineRms = Number((59 + ((number * 3 + sensorIndex * 2) % 11) + sensorIndex * 0.4).toFixed(1));
    const thresholdRms = Number((baselineRms * 1.25).toFixed(1));
    const status = offline
      ? "offline"
      : eventCount >= 10
        ? "critical"
        : eventCount >= 5
          ? "suspicious"
          : "normal";
    return {
      id: `S${number}-${letter}`,
      siloId: silo.id,
      name: `Датчик ${letter}`,
      position,
      depthPercent,
      activityScore,
      eventCount,
      baselineRms,
      thresholdRms,
      status,
      connectivity: offline ? "offline" : "online",
      battery: offline ? 0 : 58 + ((number * 9 + sensorIndex * 11) % 40),
      lastReading: offline ? (number === 9 ? "3 ч назад" : "48 мин назад") : silo.lastUpdate,
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
  { day: "14 июля", average: 14 }, { day: "17 июля", average: 16 },
  { day: "20 июля", average: 15 }, { day: "23 июля", average: 19 },
  { day: "26 июля", average: 18 }, { day: "29 июля", average: 23 },
  { day: "1 августа", average: 21 }, { day: "4 августа", average: 27 },
  { day: "7 августа", average: 25 }, { day: "10 августа", average: 31 },
  { day: "12 августа", average: 36 },
];

export const alertHistory = [
  { week: "15–21 июля", warning: 3, critical: 0 },
  { week: "22–28 июля", warning: 5, critical: 1 },
  { week: "29 июля–4 августа", warning: 4, critical: 0 },
  { week: "5–12 августа", warning: 7, critical: 2 },
];

export const initialAlerts: Alert[] = [
  {
    id: "alert-1042",
    sensorId: "S4-C",
    siloId: "silo-04",
    timestamp: "18:26",
    severity: "critical",
    title: "Высокая акустическая активность",
    message: "За последние 20 окон датчик зарегистрировал 10 событий выше порога.",
    position: "средняя часть, ниже центра",
    activityScore: 87,
    durationMinutes: 42,
    state: "new",
    recommendation: "Отберите пробу зерна щупом в зоне датчика C на указанной глубине и проверьте заражённость по ГОСТ 13586.6-93. Если заражение подтвердится, проведите обработку. После обработки несколько дней контролируйте акустическую активность, чтобы убедиться, что фумигация сработала.",
  },
  {
    id: "alert-1041",
    sensorId: "S7-B",
    siloId: "silo-07",
    timestamp: "16:12",
    severity: "warning",
    title: "Активность выше фонового уровня",
    message: "Датчик зарегистрировал 6 событий в последних 20 окнах.",
    position: "средняя часть, выше центра",
    activityScore: 56,
    durationMinutes: 18,
    state: "acknowledged",
    recommendation: "Продолжайте наблюдение. Если число событий растёт, отберите пробу щупом в зоне датчика и проверьте её по ГОСТ 13586.6-93.",
  },
  {
    id: "alert-1038",
    sensorId: "S10-D",
    siloId: "silo-10",
    timestamp: "вчера, 09:40",
    severity: "warning",
    title: "Событие акустической активности",
    message: "Исторический пример события, включённый в тестовую панель.",
    position: "нижняя часть",
    activityScore: 43,
    durationMinutes: 12,
    state: "resolved",
    recommendation: "Активность вернулась к норме. Продолжайте обычный мониторинг.",
  },
];

export const mockDataSource = {
  async getFacility() { return facility; },
  async getSilos() { return silos; },
  async getSensors() { return sensors; },
  async getReadings() { return []; },
  async getAlerts() { return initialAlerts; },
};
