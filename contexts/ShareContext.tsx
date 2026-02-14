import { createContext, useCallback, useContext, useState } from 'react';

interface ShareContextType {
  text: string;
  title: string;
  setShare: (text: string, title?: string) => void;
  clearShare: () => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export function ShareProvider({ children }: { children: React.ReactNode }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState("Today's cosmic affirmation");

  const setShare = useCallback((t: string, titleOverride?: string) => {
    setText(t);
    setTitle(titleOverride ?? "Today's cosmic affirmation");
  }, []);

  const clearShare = useCallback(() => {
    setText('');
    setTitle("Today's cosmic affirmation");
  }, []);

  return (
    <ShareContext.Provider value={{ text, title, setShare, clearShare }}>
      {children}
    </ShareContext.Provider>
  );
}

export function useShare() {
  const context = useContext(ShareContext);
  if (context === undefined) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}
