import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface State {
  language?: string | undefined;
}
export const i18nStore = create<State, [['zustand/persist', State]]>(
  persist(
    () => ({
    }),
    {
      name: 'persist-i18n',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
