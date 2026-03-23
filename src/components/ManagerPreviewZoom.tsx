import React from 'react';
import { usePreviewScale } from '../hooks/usePreviewScale';

interface ManagerPreviewZoomProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const ManagerPreviewZoom: React.FC<ManagerPreviewZoomProps> = ({ containerRef }) => {
  const { userZoom, idealScale, zoomIn, zoomOut, resetZoom } = usePreviewScale({ 
    containerRef, 
    initialZoom: 0.25 
  });

  React.useEffect(() => {
    const element = document.getElementById('manager-zoom-display');
    if (element) {
      element.textContent = `${Math.round((idealScale * userZoom) * 100)}%`;
    }
  }, [idealScale, userZoom]);

  return (
    <>
      <button onClick={zoomOut} className="p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-all" title="Zoom Out">-</button>
      <button onClick={zoomIn} className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm" title="Zoom In">+</button>
      <button onClick={resetZoom} className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm ml-1" title="Reset">1x</button>
    </>
  );
};

export default ManagerPreviewZoom;

