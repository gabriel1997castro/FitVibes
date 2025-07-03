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
  variant?: 'solid' | 'link';
  underline?: boolean;
};

const COLORS = {
  primary: '#FF6B35',
  secondary: '#6B7280',
  danger: '#EF4444',
  success: '#10B981',
  disabled: '#E5E7EB',
  text: '#fff',
  link: '#FF6B35',
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
  variant = 'solid',
  underline = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const backgroundColor = isDisabled ? COLORS.disabled : COLORS[color];

  const buttonStyle = [
    styles.button,
    variant === 'solid' && { backgroundColor },
    variant === 'link' && styles.linkButton,
    style,
    isDisabled && styles.disabled,
  ];

  const textColor =
    variant === 'link'
      ? COLORS.link
      : COLORS.text;

  const linkTextStyle = [
    variant === 'link' && styles.linkText,
    underline && { textDecorationLine: 'underline' },
    !underline && { textDecorationLine: 'none' },
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && (
            <MaterialCommunityIcons name={icon} size={20} color={textColor} style={styles.icon} />
          )}
          <Text style={[styles.text, { color: textColor }, ...linkTextStyle, textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <MaterialCommunityIcons name={icon} size={20} color={textColor} style={styles.icon} />
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
  linkButton: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: undefined,
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: COLORS.link,
    fontSize: 16,
    fontWeight: '500',
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