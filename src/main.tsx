import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HeliaProvider } from "./providers/HeliaProviders.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HeliaProvider>
      <App />
    </HeliaProvider>
  </React.StrictMode>
);
