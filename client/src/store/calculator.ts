import { create } from "zustand";

interface CalculatorState {
  mode: "auto" | "manual";
  liveWeight: number;
  hangingWeight: number;
  retailWeight: number;
  processingCost: number;
  customerId: string;
  speciesId: string;
  setMode: (mode: "auto" | "manual") => void;
  setLiveWeight: (weight: number) => void;
  setHangingWeight: (weight: number) => void;
  setRetailWeight: (weight: number) => void;
  setProcessingCost: (cost: number) => void;
  setCustomerId: (id: string) => void;
  setSpeciesId: (id: string) => void;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set) => ({
  mode: "auto",
  liveWeight: 0,
  hangingWeight: 0,
  retailWeight: 0,
  processingCost: 0,
  customerId: "",
  speciesId: "",
  setMode: (mode) => set({ mode }),
  setLiveWeight: (liveWeight) => set({ liveWeight }),
  setHangingWeight: (hangingWeight) => set({ hangingWeight }),
  setRetailWeight: (retailWeight) => set({ retailWeight }),
  setProcessingCost: (processingCost) => set({ processingCost }),
  setCustomerId: (customerId) => set({ customerId }),
  setSpeciesId: (speciesId) => set({ speciesId }),
  reset: () => set({
    mode: "auto",
    liveWeight: 0,
    hangingWeight: 0,
    retailWeight: 0,
    processingCost: 0,
    customerId: "",
    speciesId: "",
  }),
}));
