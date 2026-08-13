import type { DashboardDataSource } from "./types";
import { mockDataSource } from "./mock-data";

// Swap this provider for a Supabase-backed implementation when live sensor
// ingestion is ready. UI components depend only on DashboardDataSource.
export const dataSource: DashboardDataSource = mockDataSource;
