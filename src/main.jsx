import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import { runMigrationIfNeeded } from "./migrate.js"

// Run DB migration silently on startup — moves users to structured subcollections
runMigrationIfNeeded();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
