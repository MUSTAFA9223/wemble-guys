import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { insertCoin } from "playroomkit";

insertCoin({
  skipLobby: true,
}).then(() =>
  createRoot(document.body).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
