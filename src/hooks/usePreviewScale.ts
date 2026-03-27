import React, { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';

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

    let rafId: number;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      // Skip if size is zero or unchanged to prevent infinite loops
      if (rect.width > 0 && rect.height > 0) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setContainerSize({ width: rect.width, height: rect.height });
        });
      }
    };

    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateSize);
    });

    // Initial
    updateSize();
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Memoized idealScale
  const idealScale = React.useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 0.1;
    return Math.min(
      containerSize.width / 1920,
      containerSize.height / 1080
    );
  }, [containerSize.width, containerSize.height]);

  const effectiveZoom = React.useMemo(() => 
    idealScale * userZoom, 
    [idealScale, userZoom]
  );

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
