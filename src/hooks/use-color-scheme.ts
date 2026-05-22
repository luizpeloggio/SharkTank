import { useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let listeners: (() => void)[] = [];
let currentTheme: 'light' | 'dark' = 'dark'; // Default premium is dark

const THEME_KEY = '@app_theme_preference';

// Load stored theme initially
AsyncStorage.getItem(THEME_KEY).then((val) => {
  if (val === 'light' || val === 'dark') {
    currentTheme = val;
    listeners.forEach((l) => l());
  }
});

export const getThemePreference = () => currentTheme;

export const setThemePreference = async (theme: 'light' | 'dark') => {
  currentTheme = theme;
  await AsyncStorage.setItem(THEME_KEY, theme);
  listeners.forEach((l) => l());
};

export function useColorScheme() {
  const deviceScheme = useDeviceColorScheme();
  const [scheme, setScheme] = useState<'light' | 'dark'>(currentTheme);

  useEffect(() => {
    const handleUpdate = () => {
      setScheme(currentTheme);
    };

    listeners.push(handleUpdate);
    handleUpdate();

    return () => {
      listeners = listeners.filter((l) => l !== handleUpdate);
    };
  }, [deviceScheme]);

  return scheme;
}
