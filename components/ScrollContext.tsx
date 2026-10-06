import React, { createContext, useContext, useState, useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface ScrollContextType {
  isNavVisible: boolean;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  isNavVisible: true,
  onScroll: () => {},
});

export const useScrollNav = () => useContext(ScrollContext);

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    
    // Determine scroll direction
    if (currentScrollY > lastScrollY.current + 10) {
      // Scrolling down - hide nav
      if (isNavVisible) setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY.current - 10) {
      // Scrolling up - show nav
      if (!isNavVisible) setIsNavVisible(true);
    }
    
    // Always show nav at the very top
    if (currentScrollY <= 20 && !isNavVisible) {
      setIsNavVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  return (
    <ScrollContext.Provider value={{ isNavVisible, onScroll }}>
      {children}
    </ScrollContext.Provider>
  );
};
