import { type ReactNode, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { IconChevronLeft, IconChevronRight } from '../icons';

export interface SliderProps<T> {
  /** Items to display in the slider. */
  items: T[];
  /** Index of the currently selected item. */
  selectedIndex: number;
  /** Called when the user navigates to a different item. */
  onSelect: (index: number) => void;
  /** Render each slide's content. */
  renderSlide: (item: T, index: number) => ReactNode;
  /** Unique key for each item. */
  getKey: (item: T, index: number) => string | number;
  /** Show dot indicators below slides. */
  showDots?: boolean;
  /** Max width of the slider container (default: 420px). */
  maxWidth?: string;
}

export function Slider<T>({
  items,
  selectedIndex,
  onSelect,
  renderSlide,
  getKey,
  showDots = false,
  maxWidth = '420px',
}: SliderProps<T>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: selectedIndex,
    align: 'center',
    containScroll: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const handler = () => onSelect(emblaApi.selectedScrollSnap());
    emblaApi.on('select', handler);
    return () => {
      emblaApi.off('select', handler);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="flex flex-col items-center gap-2 w-full select-none" style={{ maxWidth }}>
      <div className="flex items-center gap-2 w-full">
        <button
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded bg-surface-alt text-text-muted hover:text-text-primary cursor-pointer border-none transition-colors"
          onClick={scrollPrev}
        >
          <IconChevronLeft size={16} />
        </button>

        <div className="overflow-hidden flex-1" ref={emblaRef}>
          <div className="flex">
            {items.map((item, i) => (
              <div
                key={getKey(item, i)}
                className="flex-[0_0_100%] min-w-0 flex flex-col items-center gap-1.5 px-2"
              >
                {renderSlide(item, i)}
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded bg-surface-alt text-text-muted hover:text-text-primary cursor-pointer border-none transition-colors"
          onClick={scrollNext}
        >
          <IconChevronRight size={16} />
        </button>
      </div>

      {showDots && (
        <DotIndicator total={items.length} active={selectedIndex} />
      )}
    </div>
  );
}

function DotIndicator({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? 'bg-accent' : 'bg-surface-alt'}`}
        />
      ))}
    </div>
  );
}
