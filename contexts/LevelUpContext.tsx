import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export interface LevelUpData {
  newLevel: number;
  levelName: string;
  previousLevel: number;
}

export interface LevelUpContextType {
  levelUp: LevelUpData | null;
  setLevelUp: (data: LevelUpData | null) => void;
  clearLevelUp: () => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

export function LevelUpProvider({ children }: { children: React.ReactNode }) {
  const [levelUp, setLevelUpState] = useState<LevelUpData | null>(null);

  const setLevelUp = useCallback((data: LevelUpData | null) => {
    setLevelUpState(data);
  }, []);

  const clearLevelUp = useCallback(() => {
    setLevelUpState(null);
  }, []);

  const value: LevelUpContextType = {
    levelUp,
    setLevelUp,
    clearLevelUp,
  };

  return (
    <LevelUpContext.Provider value={value}>{children}</LevelUpContext.Provider>
  );
}

export function useLevelUp(): LevelUpContextType {
  const context = useContext(LevelUpContext);
  if (context === undefined) {
    throw new Error('useLevelUp must be used within a LevelUpProvider');
  }
  return context;
}
