import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ProgressProvider } from "./progress";
import { PreferencesProvider } from "./preferences";
import "./styles.css";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ProgressProvider><App /></ProgressProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </StrictMode>
);

root.hasChildNodes() ? hydrateRoot(root, app) : createRoot(root).render(app);
