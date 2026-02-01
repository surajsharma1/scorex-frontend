import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  isDark: true, // Set to true by default for dark theme like frontpage
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(true); // Always dark

  useEffect(() => {
    document.documentElement.classList.add('dark'); // Force dark class
  }, []);

  const toggleTheme = () => {}; // No-op since no toggle

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};