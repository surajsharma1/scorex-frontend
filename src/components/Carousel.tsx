import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselItem {
  id: string;
  content: React.ReactNode;
  bgColor?: string;
  bgGradient?: string;
}

interface CarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToNext = useCallback(() => {
    if (isTransitioning || items.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [items.length, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || items.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [items.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentIndex, isTransitioning]);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;

    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goToNext, items.length]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`w-full flex-shrink-0 ${item.bgColor || ''}`}
            style={item.bgGradient ? { background: item.bgGradient } : {}}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-dark-bg/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-dark-bg transition-colors z-10"
            disabled={isTransitioning}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-dark-light" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-dark-bg/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-dark-bg transition-colors z-10"
            disabled={isTransitioning}
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 text-gray-800 dark:text-dark-light" />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
