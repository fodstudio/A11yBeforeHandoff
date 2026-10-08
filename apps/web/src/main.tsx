import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ProgressProvider } from "./progress";
import { PreferencesProvider } from "./preferences";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ProgressProvider><App /></ProgressProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>
);
