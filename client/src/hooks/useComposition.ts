import { useRef, useCallback } from "react";

export interface UseCompositionOptions<T extends HTMLElement> {
  onKeyDown?: (e: React.KeyboardEvent<T>) => void;
  onCompositionStart?: (e: React.CompositionEvent<T>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<T>) => void;
}

export function useComposition<T extends HTMLElement>(options?: UseCompositionOptions<T>) {
  const isComposingRef = useRef(false);

  const onCompositionStart = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposingRef.current = true;
      options?.onCompositionStart?.(e);
    },
    [options]
  );

  const onCompositionEnd = useCallback(
    (e: React.CompositionEvent<T>) => {
      isComposingRef.current = false;
      options?.onCompositionEnd?.(e);
    },
    [options]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<T>) => {
      options?.onKeyDown?.(e);
    },
    [options]
  );

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing: isComposingRef,
  };
}

export default useComposition;
