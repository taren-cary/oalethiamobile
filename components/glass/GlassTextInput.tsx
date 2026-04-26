import React from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  Text,
} from 'react-native';

import { glassBorderRadius, glassColors, glassSpacing, glassTypography } from '@/theme';

const MIN_INPUT_HEIGHT = 44;

export interface GlassTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: object;
  inputStyle?: object;
  rightAccessory?: React.ReactNode;
}

export function GlassTextInput({
  label,
  error,
  containerStyle,
  inputStyle,
  rightAccessory,
  placeholderTextColor = glassColors.text.tertiary,
  ...rest
}: GlassTextInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      {rightAccessory ? (
        <View style={[styles.inputRow, error ? styles.inputError : null]}>
          <TextInput
            placeholderTextColor={placeholderTextColor}
            style={[styles.inputInner, inputStyle]}
            accessibilityLabel={label}
            {...rest}
          />
          {rightAccessory}
        </View>
      ) : (
        <TextInput
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, error ? styles.inputError : null, inputStyle]}
          accessibilityLabel={label}
          {...rest}
        />
      )}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: glassSpacing.md,
  },
  label: {
    ...glassTypography.labelSmall,
    color: glassColors.text.primary,
    marginBottom: 4,
  },
  input: {
    ...glassTypography.body,
    color: glassColors.text.primary,
    backgroundColor: glassColors.glass.light,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
    borderRadius: glassBorderRadius.input,
    paddingHorizontal: glassSpacing.md,
    paddingVertical: glassSpacing.sm,
    minHeight: MIN_INPUT_HEIGHT,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glassColors.glass.light,
    borderWidth: 1,
    borderColor: glassColors.glassBorder.default,
    borderRadius: glassBorderRadius.input,
    minHeight: MIN_INPUT_HEIGHT,
    paddingHorizontal: glassSpacing.md,
  },
  inputInner: {
    ...glassTypography.body,
    color: glassColors.text.primary,
    flex: 1,
    paddingVertical: glassSpacing.sm,
  },
  inputError: {
    borderColor: glassColors.error,
  },
  errorText: {
    ...glassTypography.bodySmall,
    color: glassColors.error,
    marginTop: 4,
  },
});
