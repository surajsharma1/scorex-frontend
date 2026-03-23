import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePreviewScaleProps {
  containerRef: React.RefObject<HTMLDivElement>;
  initialZoom?: number;
}

export const usePreviewScale = ({ containerRef, initialZoom = 1 }: UsePreviewScaleProps) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [userZoom, setUserZoom] = useState(initialZoom);
  const rafRef = useRef<number>();

  const computeIdealScale = useCallback((w: number, h: number) => {
    const targetW = 1920;
    const targetH = 1080;
    return Math.min(w / targetW, h / targetH, 1); // Cap at 1x for large screens
  }, []);

  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, [containerRef]);

  // ResizeObserver for precise sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateContainerSize();

    const resizeObserver = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateContainerSize);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateContainerSize]);

  const idealScale = computeIdealScale(containerSize.width, containerSize.height);
  const effectiveScale = idealScale * userZoom;

  const setZoomMultiplier = useCallback((multiplier: number) => {
    setUserZoom(Math.max(0.25, Math.min(2.0, multiplier)));
  }, []);

  const zoomIn = useCallback(() => setZoomMultiplier(userZoom * 1.25), [userZoom, setZoomMultiplier]);
  const zoomOut = useCallback(() => setZoomMultiplier(userZoom * 0.8), [userZoom, setZoomMultiplier]);
  const resetZoom = useCallback(() => setZoomMultiplier(1), [setZoomMultiplier]);

  // CSS var for component-local scaling (avoid documentElement)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--preview-scale', effectiveScale.toString());
      containerRef.current.style.setProperty('--ideal-scale', idealScale.toString());
      containerRef.current.style.setProperty('--user-zoom', userZoom.toString());
    }
  }, [effectiveScale, idealScale, userZoom, containerRef]);

  return {
    scale: effectiveScale,
    idealScale,
    userZoom,
    containerSize,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomMultiplier,
  };
};

