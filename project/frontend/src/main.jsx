import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { UserProvider } from "./context/UserContext";
import { FarmDataProvider } from "./context/FarmDataContext";
import { ApiProvider } from "./context/ApiContext";

console.log("🚀 main.jsx loading...");
console.log("Root element:", document.getElementById("root"));

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <ApiProvider>
      <UserProvider>
        <FarmDataProvider>
          <App />
        </FarmDataProvider>
      </UserProvider>
    </ApiProvider>
  </StrictMode>
);

console.log("✓ App rendered successfully");
