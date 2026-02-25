import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton } from '@/components/glass/GlassButton';
import {
  glassBorderRadius,
  glassColors,
  glassSpacing,
  glassTypography,
} from '@/theme';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'OalethiaMobile/1.0';

export interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  const res = await fetch(
    `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1`,
    { headers: { 'User-Agent': USER_AGENT } }
  );
  if (!res.ok) throw new Error('Location search failed');
  const data = await res.json();
  return (data as { display_name: string; lat: string; lon: string }[]).map((item) => ({
    display_name: item.display_name,
    lat: item.lat,
    lon: item.lon,
  }));
}

interface BirthLocationPickerScreenProps {
  onDone: () => void;
}

export function BirthLocationPickerScreen({ onDone }: BirthLocationPickerScreenProps) {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChangeText = useCallback((text: string) => {
    setLocation(text);
    setError('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      setLoading(true);
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
      } catch {
        setError('Location search unavailable. Try again.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: LocationSuggestion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setLocation(suggestion.display_name);
    setSuggestions([]);
  }, []);

  const handleDone = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDone();
  }, [onDone]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: glassSpacing.screenPadding,
        },
      ]}
    >
      <Image
        source={require('@/assets/images/oalethiamobilebackground.jpeg')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      <View style={styles.cardWrap}>
        <LinearGradient
          colors={glassColors.gradientBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <BlurView intensity={1} tint="light" style={styles.glassCard}>
            <Text style={styles.title}>Enter your birth location</Text>
            <Text style={styles.subtitle}>
              City and country (or place name) for accurate chart calculation.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Start typing a city, country, or address..."
              placeholderTextColor={glassColors.text.tertiary}
              value={location}
              onChangeText={handleChangeText}
              autoCapitalize="words"
              autoCorrect={false}
              accessibilityLabel="Birth location"
            />

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={glassColors.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {suggestions.length > 0 ? (
              <View style={styles.suggestionsList}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => `${item.lat}-${item.lon}`}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={suggestions.length > 3}
                  style={styles.suggestionsScroll}
                  renderItem={({ item }) => (
                    <Pressable
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        pressed && styles.suggestionItemPressed,
                      ]}
                      onPress={() => handleSelectSuggestion(item)}
                    >
                      <Text style={styles.suggestionText} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </Pressable>
                  )}
                />
              </View>
            ) : null}

            <GlassButton
              title="Done"
              onPress={handleDone}
              accessibilityLabel="Continue"
              style={styles.doneButton}
            />
          </BlurView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cardGradient: {
    padding: 1,
    borderRadius: glassBorderRadius.card,
  },
  glassCard: {
    padding: glassSpacing.cardPadding,
    borderRadius: glassBorderRadius.card,
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    ...glassTypography.h2,
    color: '#fbbf24',
    marginBottom: glassSpacing.sm,
  },
  subtitle: {
    ...glassTypography.body,
    color: glassColors.text.secondary,
    marginBottom: glassSpacing.lg,
  },
  input: {
    ...glassTypography.body,
    color: glassColors.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: glassSpacing.md,
    paddingVertical: 14,
    marginBottom: glassSpacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: glassSpacing.sm,
    marginBottom: glassSpacing.sm,
  },
  loadingText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.tertiary,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.error,
    marginBottom: glassSpacing.sm,
  },
  suggestionsList: {
    maxHeight: 180,
    marginBottom: glassSpacing.md,
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: glassSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionItemPressed: {
    opacity: 0.8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  suggestionText: {
    ...glassTypography.bodySmall,
    color: glassColors.text.secondary,
  },
  doneButton: {
    marginTop: glassSpacing.xs,
  },
});
