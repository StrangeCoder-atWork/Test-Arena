import { useTheme } from '../context/ThemeContext';
import { Colors } from '../constants/Colors';

export function useAppTheme() {
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];

  return {
    theme,
    colors,
    toggleTheme,
    isDark: theme === 'dark'
  };
}