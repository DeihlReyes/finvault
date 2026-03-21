"use client";

import { useRef, useCallback } from "react";

const SWIPE_THRESHOLD = 80;

export function useSwipeToDelete(onDelete: () => void) {
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    currentX.current = e.touches[0].clientX - startX.current;
    if (elementRef.current && currentX.current < 0) {
      elementRef.current.style.transform = `translateX(${Math.max(currentX.current, -160)}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isSwiping.current = false;
    if (Math.abs(currentX.current) >= SWIPE_THRESHOLD) {
      onDelete();
    } else if (elementRef.current) {
      elementRef.current.style.transform = "translateX(0)";
    }
    currentX.current = 0;
  }, [onDelete]);

  return { elementRef, handleTouchStart, handleTouchMove, handleTouchEnd };
}
