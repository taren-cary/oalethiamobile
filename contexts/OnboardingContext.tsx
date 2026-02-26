import {
  createContext,
  useCallback,
  useContext,
  useState,
} from 'react';

export interface OnboardingBirthData {
  birthDate: string;
  birthTime: string;
  location: string;
  latitude: number;
  longitude: number;
}

interface OnboardingContextType {
  birthDate: string;
  birthTime: string;
  location: string;
  latitude: number;
  longitude: number;
  setBirthDate: (value: string) => void;
  setBirthTime: (value: string) => void;
  setBirthLocation: (location: string, lat: number, lon: number) => void;
  hasBirthData: boolean;
  clearBirthData: () => void;
}

const defaultBirthData: Omit<OnboardingBirthData, 'latitude' | 'longitude'> & { latitude: number; longitude: number } = {
  birthDate: '',
  birthTime: '12:00',
  location: '',
  latitude: 0,
  longitude: 0,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [birthDate, setBirthDateState] = useState(defaultBirthData.birthDate);
  const [birthTime, setBirthTimeState] = useState(defaultBirthData.birthTime);
  const [location, setLocationState] = useState(defaultBirthData.location);
  const [latitude, setLatitudeState] = useState(defaultBirthData.latitude);
  const [longitude, setLongitudeState] = useState(defaultBirthData.longitude);

  const setBirthDate = useCallback((value: string) => {
    setBirthDateState(value);
  }, []);

  const setBirthTime = useCallback((value: string) => {
    setBirthTimeState(value);
  }, []);

  const setBirthLocation = useCallback((loc: string, lat: number, lon: number) => {
    setLocationState(loc);
    setLatitudeState(lat);
    setLongitudeState(lon);
  }, []);

  const hasBirthData = Boolean(
    birthDate.trim() && location.trim()
  );

  const clearBirthData = useCallback(() => {
    setBirthDateState(defaultBirthData.birthDate);
    setBirthTimeState(defaultBirthData.birthTime);
    setLocationState(defaultBirthData.location);
    setLatitudeState(defaultBirthData.latitude);
    setLongitudeState(defaultBirthData.longitude);
  }, []);

  const value: OnboardingContextType = {
    birthDate,
    birthTime,
    location,
    latitude,
    longitude,
    setBirthDate,
    setBirthTime,
    setBirthLocation,
    hasBirthData,
    clearBirthData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
