import { useEffect, useRef, useCallback } from 'react';

function useDebounce<T>(callback: (value: T) => void, delay: number) {
  const timeoutRef = useRef<number | null>(null);


  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(value), delay);
  }, [callback, delay]);
}

export default useDebounce;

