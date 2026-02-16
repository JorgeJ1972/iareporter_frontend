import { useCallback } from 'react';
import { KeyboardEvent } from 'react';

export const useEnterKeyPress = (callback: () => void) => {
  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      callback();
    }
  }, [callback]);

  return { onKeyDown };
};