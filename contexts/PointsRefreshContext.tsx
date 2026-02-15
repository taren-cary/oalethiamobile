import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export interface PointsRefreshContextType {
  invalidateAt: number;
  invalidate: () => void;
}

const PointsRefreshContext = createContext<PointsRefreshContextType | undefined>(
  undefined
);

export function PointsRefreshProvider({ children }: { children: React.ReactNode }) {
  const [invalidateAt, setInvalidateAt] = useState(0);

  const invalidate = useCallback(() => {
    setInvalidateAt((t) => t + 1);
  }, []);

  const value: PointsRefreshContextType = {
    invalidateAt,
    invalidate,
  };

  return (
    <PointsRefreshContext.Provider value={value}>
      {children}
    </PointsRefreshContext.Provider>
  );
}

export function usePointsRefresh(): PointsRefreshContextType {
  const context = useContext(PointsRefreshContext);
  if (context === undefined) {
    throw new Error('usePointsRefresh must be used within a PointsRefreshProvider');
  }
  return context;
}
