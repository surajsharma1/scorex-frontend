import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePreviewScaleProps {
  containerRef: React.RefObject<HTMLDivElement>;
  initialZoom?: number;
}

/**
 * Computes scale so 1920x1080 overlay fits perfectly inside the container,
 * then multiplies by userZoom (same model as browser Ctrl+scroll).
 */
export const usePreviewScale = ({ containerRef, initialZoom = 1 }: UsePreviewScaleProps) => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [userZoom, setUserZoom] = useState(initialZoom);
  const rafRef = useRef<number>();

  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    updateContainerSize();
    const ro = new ResizeObserver(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateContainerSize);
    });
    ro.observe(container);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateContainerSize]);

  // idealScale: makes 1920x1080 fit inside container
  const idealScale = containerSize.width > 0
    ? Math.min(containerSize.width / 1920, containerSize.height > 0 ? containerSize.height / 1080 : 1)
    : 0.1;

  const effectiveZoom = idealScale * userZoom;

  const clamp = (v: number) => Math.max(0.1, Math.min(3.0, v));
  const setZoomMultiplier = useCallback((v: number) => setUserZoom(clamp(v)), []);
  const zoomIn  = useCallback(() => setUserZoom(z => clamp(z * 1.25)), []);
  const zoomOut = useCallback(() => setUserZoom(z => clamp(z * 0.8)), []);
  const resetZoom = useCallback(() => setUserZoom(1), []);

  return {
    scale: effectiveZoom,
    idealScale,
    userZoom,
    containerSize,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomMultiplier,
  };
};
