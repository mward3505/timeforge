import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import App from "./App.tsx";
import LandingPage from "./LandingPage.tsx";
import Dashboard from "./Dashboard.tsx";
import LoginPage from "./pages/LoginPage.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				{/* Landing page */}
				<Route path="/" element={<LandingPage />} />

				{/* Login page */}
				<Route path="/login" element={<LoginPage />} />

				{/* Authenticated main UI */}
				<Route path="/dashboard" element={<Dashboard />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>
);
