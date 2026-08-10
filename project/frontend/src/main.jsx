import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { UserProvider } from "./context/UserContext";
import { FarmDataProvider } from "./context/FarmDataContext";
import { ApiProvider } from "./context/ApiContext";

import { ToastProvider } from "./context/ToastContext";

console.log("🚀 main.jsx loading...");

// Global error handler
window.addEventListener('error', (event) => {
  console.error('❌ Global Error:', event.error);
  // Ignore removeChild DOM errors typically caused by browser extensions or Google Translate
  if (event.message?.includes('removeChild') || event.error?.message?.includes('removeChild')) {
    return;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
});

try {
  console.log("Root element:", document.getElementById("root"));
  
  const root = createRoot(document.getElementById("root"));
  console.log("✓ React root created");

  root.render(
    <StrictMode>
      <ApiProvider>
        <UserProvider>
          <FarmDataProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </FarmDataProvider>
        </UserProvider>
      </ApiProvider>
    </StrictMode>
  );

  console.log("✓ App rendered successfully");
} catch (error) {
  console.error("❌ Fatal Error:", error);
  document.getElementById('root').innerHTML = `<div style="padding: 2rem; font-family: monospace; color: red;"><h1>Critical Error</h1><pre>${error.stack}</pre></div>`;
}
