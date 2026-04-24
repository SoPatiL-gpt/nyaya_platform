import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import { runMigrationIfNeeded } from "./migrate.js"

if (import.meta.env.VITE_RUN_STARTUP_MIGRATION === "true") {
  runMigrationIfNeeded();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
