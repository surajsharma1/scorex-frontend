import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext({
    isDark: true,
    toggleTheme: () => { },
});
export const useTheme = () => useContext(ThemeContext);
export default function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to dark
    });
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        }
        else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);
    const toggleTheme = () => {
        setIsDark(!isDark);
    };
    return (_jsx(ThemeContext.Provider, { value: { isDark, toggleTheme }, children: children }));
}
