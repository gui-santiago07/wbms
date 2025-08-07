import { create } from 'zustand';

interface TimelineStore {
  selectedLines: string[];
  hasGeneratedTimeline: boolean;
  setSelectedLines: (lines: string[]) => void;
  setHasGeneratedTimeline: (hasGenerated: boolean) => void;
  clearTimelineData: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  selectedLines: [],
  hasGeneratedTimeline: false,
  
  setSelectedLines: (lines: string[]) => {
    set({ selectedLines: lines });
  },
  
  setHasGeneratedTimeline: (hasGenerated: boolean) => {
    set({ hasGeneratedTimeline: hasGenerated });
  },
  
  clearTimelineData: () => {
    set({ selectedLines: [], hasGeneratedTimeline: false });
  }
})); 