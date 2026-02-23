import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DEFAULT_SETTINGS } from '../types/models';

const SETTINGS_KEY = '@salesStore:settings';

export const SettingsRepository = {
  async load(): Promise<AppSettings> {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      // Merge with defaults to handle new keys added over time
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        notificacoes: {
          ...DEFAULT_SETTINGS.notificacoes,
          ...(parsed.notificacoes ?? {}),
        },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async save(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
};
