import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ?? '';
const supabaseAnonKey: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? '';

export { supabaseUrl };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
