import { useEffect } from 'react';

export function useHorizontalWheel(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    function handleWheel(event) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    }

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [ref]);
}
