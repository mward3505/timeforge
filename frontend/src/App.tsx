import { Outlet } from "react-router-dom";

export default function App() {
	return (
		<div style={{ fontFamily: "system-ui, sans-serif" }}>
			<Outlet />
		</div>
	);
}
