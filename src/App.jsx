import React from "react";
import { Button } from "./components/ui/button";
import { ModeToggle } from "./components/ModeToggle";
import { ThemeProvider } from "./components/ui/ThemeProvider";
import PatternMatchingSimulator from "./components/simulator/PatternMatchingSimulator";

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="p-4">
        <ModeToggle/>
        <PatternMatchingSimulator/>
      </div>
    </ThemeProvider>
  );
};

export default App;
