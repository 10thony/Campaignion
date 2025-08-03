import { useEffect, useRef, useState } from 'react';
import { 
  FocusManagement, 
  ScreenReader, 
  AccessibilityValidator,
  ReducedMotion,
  HighContrast 
} from '@/lib/accessibility';

/**
 * Hook for managing focus traps in modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus
    restoreFocusRef.current = FocusManagement.saveFocus();

    // Focus first element in container
    FocusManagement.focusFirst(containerRef.current);

    // Create focus trap
    const removeFocusTrap = FocusManagement.createFocusTrap(containerRef.current);

    return () => {
      removeFocusTrap();
      // Restore focus when component unmounts or becomes inactive
      if (restoreFocusRef.current) {
        restoreFocusRef.current();
        restoreFocusRef.current = null;
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for announcing messages to screen readers
 */
export function useScreenReaderAnnouncements() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    ScreenReader.announce(message, priority);
  };

  return { announce };
}

/**
 * Hook for keyboard navigation in lists
 */
export function useKeyboardNavigation(itemCount: number, initialIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        event.preventDefault();
        setCurrentIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setCurrentIndex(itemCount - 1);
        break;
    }
  };

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  };
}

/**
 * Hook for accessibility validation in development
 */
export function useAccessibilityValidation(componentName?: string) {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && elementRef.current) {
      // Delay validation to allow component to fully render
      const timer = setTimeout(() => {
        if (elementRef.current) {
          AccessibilityValidator.logIssues(elementRef.current, componentName);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [componentName]);

  return elementRef;
}

/**
 * Hook for detecting user preferences
 */
export function useUserPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => ReducedMotion.prefersReducedMotion()
  );
  
  const [prefersHighContrast, setPrefersHighContrast] = useState(
    () => HighContrast.isHighContrastMode()
  );

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    highContrastQuery.addEventListener('change', handleHighContrastChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  return {
    prefersReducedMotion,
    prefersHighContrast,
  };
}

/**
 * Hook for managing live regions for dynamic content
 */
export function useLiveRegion() {
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (newMessage: string, newPriority: 'polite' | 'assertive' = 'polite') => {
    setMessage(newMessage);
    setPriority(newPriority);
    
    // Clear message after announcement
    setTimeout(() => setMessage(''), 1000);
  };

  return {
    message,
    priority,
    announce,
  };
}

/**
 * Hook for managing ARIA expanded state
 */
export function useAriaExpanded(initialState: boolean = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);

  const toggle = () => setIsExpanded(prev => !prev);
  const expand = () => setIsExpanded(true);
  const collapse = () => setIsExpanded(false);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
    ariaExpanded: isExpanded,
  };
}

/**
 * Hook for managing roving tabindex in component groups
 */
export function useRovingTabIndex(itemCount: number, initialIndex: number = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const getTabIndex = (index: number) => index === activeIndex ? 0 : -1;
  
  const handleKeyDown = (event: KeyboardEvent, currentIndex: number) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((currentIndex + 1) % itemCount);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((currentIndex - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(itemCount - 1);
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    getTabIndex,
    handleKeyDown,
  };
}