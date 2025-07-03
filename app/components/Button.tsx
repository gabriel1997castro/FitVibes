import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, GestureResponderEvent } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ButtonProps = {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  loading?: boolean;
  disabled?: boolean;
  color?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap; // nome do ícone do MaterialCommunityIcons
  style?: any;
  textStyle?: any;
  iconPosition?: 'left' | 'right';
};

const COLORS = {
  primary: '#FF6B35',
  secondary: '#6B7280',
  danger: '#EF4444',
  success: '#10B981',
  disabled: '#E5E7EB',
  text: '#fff',
};

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  color = 'primary',
  icon,
  style,
  textStyle,
  iconPosition = 'left',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const backgroundColor = isDisabled ? COLORS.disabled : COLORS[color];

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style, isDisabled && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons name={icon} size={20} color={COLORS.text} style={styles.icon} />
          )}
          <Text style={[styles.text, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons name={icon} size={20} color={COLORS.text} style={styles.icon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginHorizontal: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
}); 