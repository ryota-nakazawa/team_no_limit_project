import { useState, useEffect } from 'react';

const useMedia = () => {
  const [isMobile, setIsMobile] = useState(window.matchMedia('(max-width: 519px)').matches);
  const [isTablet, setIsTablet] = useState(window.matchMedia('(min-width: 520px) and (max-width: 959px)').matches);
  const [isPC, setIsPC] = useState(window.matchMedia('(min-width: 960px)').matches);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 519px)').matches);
      setIsTablet(window.matchMedia('(min-width: 520px) and (max-width: 959px)').matches);
      setIsPC(window.matchMedia('(min-width: 960px)').matches);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isTablet, isPC };
};

export default useMedia;
