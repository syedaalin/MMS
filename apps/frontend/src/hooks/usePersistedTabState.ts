import { useCallback, useState } from "react";

/**
 * Tab state synced to sessionStorage so module navigation does not reset the active tier.
 */
export function usePersistedTabState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key);
      return saved ? (saved as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setPersisted = useCallback(
    (next: T) => {
      setValue(next);
      try {
        sessionStorage.setItem(key, next);
      } catch {
        /* sessionStorage unavailable */
      }
    },
    [key],
  );

  return [value, setPersisted];
}
