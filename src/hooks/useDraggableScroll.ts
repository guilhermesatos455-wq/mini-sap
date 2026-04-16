import { useState, useRef } from 'react';

export const useDraggableScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    // Only drag with left mouse button
    if (e.button !== 0) return;
    
    // Don't drag if clicking on an input, select, or button
    const target = e.target as HTMLElement;
    if (['INPUT', 'SELECT', 'BUTTON', 'A', 'TEXTAREA'].includes(target.tagName) || target.closest('button') || target.closest('a')) {
      return;
    }
    
    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setStartY(e.pageY - ref.current.offsetTop);
    setScrollLeft(ref.current.scrollLeft);
    setScrollTop(ref.current.scrollTop);
    
    ref.current.style.cursor = 'grabbing';
    ref.current.style.userSelect = 'none';
  };

  const onMouseLeave = () => {
    if (!isDragging || !ref.current) return;
    setIsDragging(false);
    ref.current.style.cursor = 'grab';
    ref.current.style.removeProperty('user-select');
  };

  const onMouseUp = () => {
    if (!isDragging || !ref.current) return;
    setIsDragging(false);
    ref.current.style.cursor = 'grab';
    ref.current.style.removeProperty('user-select');
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const y = e.pageY - ref.current.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    ref.current.scrollLeft = scrollLeft - walkX;
    ref.current.scrollTop = scrollTop - walkY;
  };

  return {
    ref,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onMouseMove,
    style: { cursor: 'grab' }
  };
};
