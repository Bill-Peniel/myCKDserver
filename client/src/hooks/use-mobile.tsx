import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is mobile sized
 * @returns boolean indicating if the screen is mobile-sized (<768px)
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  function checkIfMobile() {
    setIsMobile(window.innerWidth < 768);
  }

  return isMobile;
}
