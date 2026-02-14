import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { TimelineAction } from '@/types/timeline';

export interface GenerationSummary {
  actionsGenerated?: number;
  calculationTime?: number;
  timeframe?: number;
  transitsUsed?: number;
}

export interface GenerationResult {
  outcome: string;
  context: string;
  timeframe: number;
  actions: TimelineAction[];
  timelineAffirmations: string[];
  summary: GenerationSummary;
  tempGenerationId: string;
}

interface GenerationResultContextType {
  result: GenerationResult | null;
  setResult: (value: GenerationResult | null) => void;
  clearResult: () => void;
}

const GenerationResultContext = createContext<GenerationResultContextType | undefined>(undefined);

export function GenerationResultProvider({ children }: { children: React.ReactNode }) {
  const [result, setResultState] = useState<GenerationResult | null>(null);

  const setResult = useCallback((value: GenerationResult | null) => {
    setResultState(value);
  }, []);

  const clearResult = useCallback(() => {
    setResultState(null);
  }, []);

  return (
    <GenerationResultContext.Provider value={{ result, setResult, clearResult }}>
      {children}
    </GenerationResultContext.Provider>
  );
}

export function useGenerationResult() {
  const context = useContext(GenerationResultContext);
  if (context === undefined) {
    throw new Error('useGenerationResult must be used within a GenerationResultProvider');
  }
  return context;
}
