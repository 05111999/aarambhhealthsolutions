import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import styles
import "./index.css";

// Import component
import App from "./App.jsx";
import { initPwa } from "./lib/pwa";

// Installable app: capture the browser's install prompt early and register the service worker.
initPwa();

// Mount app
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
