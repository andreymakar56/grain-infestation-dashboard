export type SystemStatus = "normal" | "suspicious" | "critical" | "offline";
export type AlertState = "new" | "acknowledged" | "resolved";

export interface Facility {
  id: string;
  name: string;
  location: string;
}

export interface Silo {
  id: string;
  facilityId: string;
  name: string;
  capacityTonnes: number;
  fillPercent: number;
  grain: string;
  status: SystemStatus;
  maxActivity: number;
  activeSensors: number;
  lastUpdate: string;
  temperature: number;
  humidity: number;
}

export interface Sensor {
  id: string;
  siloId: string;
  name: string;
  position: string;
  depthPercent: number;
  activityScore: number;
  status: SystemStatus;
  connectivity: "online" | "offline";
  battery: number;
  lastReading: string;
}

export interface Reading {
  id: string;
  sensorId: string;
  timestamp: string;
  activityScore: number;
  temperature: number;
  humidity: number;
}

export interface Alert {
  id: string;
  sensorId: string;
  siloId: string;
  timestamp: string;
  severity: "warning" | "critical";
  title: string;
  message: string;
  position: string;
  activityScore: number;
  durationMinutes: number;
  state: AlertState;
  recommendation: string;
}

export interface DashboardDataSource {
  getFacility(): Promise<Facility>;
  getSilos(): Promise<Silo[]>;
  getSensors(): Promise<Sensor[]>;
  getReadings(sensorId: string): Promise<Reading[]>;
  getAlerts(): Promise<Alert[]>;
}
