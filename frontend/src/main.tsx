import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// import App from "./App.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
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
		</AuthProvider>
	</StrictMode>
);
