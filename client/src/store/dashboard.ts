import { create } from "zustand";
import { type ProcessingRecord, type Invoice } from "@shared/schema";

interface DashboardMetrics {
  totalAnimals: number;
  revenue: number;
  averageYield: number;
  activeCustomers: number;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  processingRecords: ProcessingRecord[];
  invoices: Invoice[];
  setMetrics: (metrics: DashboardMetrics) => void;
  setProcessingRecords: (records: ProcessingRecord[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  processingRecords: [],
  invoices: [],
  setMetrics: (metrics) => set({ metrics }),
  setProcessingRecords: (processingRecords) => set({ processingRecords }),
  setInvoices: (invoices) => set({ invoices }),
}));
