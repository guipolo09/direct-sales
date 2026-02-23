import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@salesStore:notifState';
const DAYS_TO_KEEP = 45;

export type NotifState = {
  dismissed: Array<{ id: string; at: string }>;
  read: Array<{ id: string; at: string }>;
};

const isExpired = (at: string): boolean => {
  const diff = Date.now() - new Date(at).getTime();
  return diff > DAYS_TO_KEEP * 24 * 60 * 60 * 1000;
};

export const NotifStateRepository = {
  async load(): Promise<NotifState> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return { dismissed: [], read: [] };
      const parsed = JSON.parse(raw) as NotifState;
      // Clean entries older than 45 days on every load
      return {
        dismissed: (parsed.dismissed ?? []).filter((e) => !isExpired(e.at)),
        read:      (parsed.read      ?? []).filter((e) => !isExpired(e.at)),
      };
    } catch {
      return { dismissed: [], read: [] };
    }
  },

  async save(state: NotifState): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  },

  async dismiss(state: NotifState, id: string): Promise<NotifState> {
    const now = new Date().toISOString();
    const next: NotifState = {
      dismissed: [...state.dismissed.filter((e) => e.id !== id), { id, at: now }],
      read:       state.read,
    };
    await NotifStateRepository.save(next);
    return next;
  },

  async markRead(state: NotifState, id: string): Promise<NotifState> {
    if (state.read.some((e) => e.id === id)) return state;
    const now = new Date().toISOString();
    const next: NotifState = {
      dismissed: state.dismissed,
      read:      [...state.read, { id, at: now }],
    };
    await NotifStateRepository.save(next);
    return next;
  },

  async markAllRead(state: NotifState, ids: string[]): Promise<NotifState> {
    const now = new Date().toISOString();
    const existingReadIds = new Set(state.read.map((e) => e.id));
    const newEntries = ids.filter((id) => !existingReadIds.has(id)).map((id) => ({ id, at: now }));
    const next: NotifState = {
      dismissed: state.dismissed,
      read:      [...state.read, ...newEntries],
    };
    await NotifStateRepository.save(next);
    return next;
  },

  async dismissAll(state: NotifState, ids: string[]): Promise<NotifState> {
    const now = new Date().toISOString();
    const existingDismissedIds = new Set(state.dismissed.map((e) => e.id));
    const newEntries = ids.filter((id) => !existingDismissedIds.has(id)).map((id) => ({ id, at: now }));
    const next: NotifState = {
      dismissed: [...state.dismissed, ...newEntries],
      read:      state.read,
    };
    await NotifStateRepository.save(next);
    return next;
  },
};
