/**
 * Accessibility utilities and validation helpers
 */

// WCAG 2.1 AA color contrast ratio requirement
const MIN_CONTRAST_RATIO = 4.5;
const MIN_CONTRAST_RATIO_LARGE = 3.0;

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 guidelines
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Convert hex colors to RGB
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substr(0, 2), 16);
  const g1 = parseInt(hex1.substr(2, 2), 16);
  const b1 = parseInt(hex1.substr(4, 2), 16);
  
  const r2 = parseInt(hex2.substr(0, 2), 16);
  const g2 = parseInt(hex2.substr(2, 2), 16);
  const b2 = parseInt(hex2.substr(4, 2), 16);
  
  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsContrastRequirement(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = isLargeText ? MIN_CONTRAST_RATIO_LARGE : MIN_CONTRAST_RATIO;
  return ratio >= minRatio;
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardNavigation = {
  /**
   * Handle arrow key navigation in a list
   */
  handleArrowNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    itemCount: number,
    onIndexChange: (index: number) => void
  ) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        onIndexChange((currentIndex + 1) % itemCount);
        break;
      case 'ArrowUp':
        event.preventDefault();
        onIndexChange((currentIndex - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        event.preventDefault();
        onIndexChange(0);
        break;
      case 'End':
        event.preventDefault();
        onIndexChange(itemCount - 1);
        break;
    }
  },

  /**
   * Handle tab navigation with custom logic
   */
  handleTabNavigation: (
    event: KeyboardEvent,
    elements: HTMLElement[],
    currentIndex: number
  ) => {
    if (event.key === 'Tab') {
      const nextIndex = event.shiftKey 
        ? (currentIndex - 1 + elements.length) % elements.length
        : (currentIndex + 1) % elements.length;
      
      event.preventDefault();
      elements[nextIndex]?.focus();
    }
  },

  /**
   * Trap focus within a container
   */
  trapFocus: (container: HTMLElement, event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

/**
 * Screen reader utilities
 */
export const ScreenReader = {
  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create accessible description for complex UI elements
   */
  createDescription: (element: HTMLElement, description: string) => {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    element.setAttribute('aria-describedby', descId);
    element.appendChild(descElement);
    
    return descId;
  }
};

/**
 * Focus management utilities
 */
export const FocusManagement = {
  /**
   * Save and restore focus for modal dialogs
   */
  saveFocus: (): (() => void) => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },

  /**
   * Set focus to first focusable element in container
   */
  focusFirst: (container: HTMLElement) => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
    }
  },

  /**
   * Create a focus trap for modal dialogs
   */
  createFocusTrap: (container: HTMLElement) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      KeyboardNavigation.trapFocus(container, event);
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }
};

/**
 * Accessibility validation for development
 */
export const AccessibilityValidator = {
  /**
   * Check for common accessibility issues
   */
  validateElement: (element: HTMLElement): string[] => {
    const issues: string[] = [];

    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach(img => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image missing alt text: ${img.src}`);
      }
    });

    // Check for buttons without accessible names
    const buttons = element.querySelectorAll('button');
    buttons.forEach(button => {
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
      
      if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push('Button without accessible name found');
      }
    });

    // Check for form inputs without labels
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = element.querySelector(`label[for="${input.id}"]`);
      const hasAriaLabel = input.getAttribute('aria-label');
      const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
      
      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push(`Form input without label: ${input.tagName}`);
      }
    });

    // Check for proper heading hierarchy
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push(`Heading level skipped: ${heading.tagName} after h${lastLevel}`);
      }
      lastLevel = level;
    });

    return issues;
  },

  /**
   * Log accessibility issues to console in development
   */
  logIssues: (element: HTMLElement, componentName?: string) => {
    if (process.env.NODE_ENV === 'development') {
      const issues = AccessibilityValidator.validateElement(element);
      if (issues.length > 0) {
        console.warn(`Accessibility issues in ${componentName || 'component'}:`, issues);
      }
    }
  }
};

/**
 * Reduced motion utilities
 */
export const ReducedMotion = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Apply animation only if user doesn't prefer reduced motion
   */
  conditionalAnimation: (element: HTMLElement, animationClass: string) => {
    if (!ReducedMotion.prefersReducedMotion()) {
      element.classList.add(animationClass);
    }
  }
};

/**
 * High contrast mode utilities
 */
export const HighContrast = {
  /**
   * Detect if high contrast mode is enabled
   */
  isHighContrastMode: (): boolean => {
    // Check for Windows high contrast mode
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches;
  },

  /**
   * Apply high contrast styles conditionally
   */
  applyHighContrastStyles: (element: HTMLElement, styles: Record<string, string>) => {
    if (HighContrast.isHighContrastMode()) {
      Object.assign(element.style, styles);
    }
  }
};