import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initGoogleTagManager } from "./lib/gtm";

initGoogleTagManager();

createRoot(document.getElementById("root")!).render(<App />);
