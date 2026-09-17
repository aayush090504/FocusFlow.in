import React, { createContext, useContext, useState, useCallback } from 'react';

interface AriaLiveContextType {
  announce: (message: string) => void;
}

const AriaLiveContext = createContext<AriaLiveContextType>({
  announce: () => {},
});

export const AriaLiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcement, setAnnouncement] = useState<string>('');

  const announce = useCallback((message: string) => {
    setAnnouncement('');
    // Slight timeout ensures screen readers detect text replacement
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  return (
    <AriaLiveContext.Provider value={{ announce }}>
      {children}
      {/* Invisible polite live region for screen readers */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </AriaLiveContext.Provider>
  );
};

export const useAriaAnnounce = () => useContext(AriaLiveContext);
