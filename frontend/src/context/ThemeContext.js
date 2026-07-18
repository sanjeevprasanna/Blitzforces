import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect, } from "react";
const ThemeContext = createContext({
    theme: "dark",
    toggle: () => { },
});
export function ThemeProvider({ children }) {
    const [theme] = useState("dark");
    useEffect(() => {
        const root = document.documentElement;
        // Force dark mode
        root.classList.add("dark");
    }, []);
    const toggle = () => { }; // No-op
    return (_jsx(ThemeContext.Provider, { value: { theme, toggle }, children: children }));
}
export function useTheme() {
    return useContext(ThemeContext);
}
