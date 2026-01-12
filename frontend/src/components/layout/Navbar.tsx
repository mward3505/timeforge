// src/components/layout/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const linkClass = (path: string) =>
        `px-3 py-2 rounded-md text-sm font-medium ${
            location.pathname === path
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-100"
        }`;

    return (
        <header className="border-b border-zinc-800 bg-zinc-950">
            <div className="max-w-10xl mx-auto px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100">TimeForge</span>
                </div>

                <nav className="flex items-center gap-2">
                    <Link to="/dashboard" className={linkClass("/dashboard")}>
                        Dashboard
                    </Link>
                    <Link to="/activities" className={linkClass("/activities")}>
                        Activities
                    </Link>
                    <button
                        onClick={async () => {
                            await logout();
                            navigate("/login");
                        }}
                        className="ml-3 text-sm text-red-400 hover:text-red-300"
                    >
                        Logout
                    </button>
                </nav>
            </div>
        </header>
    );
}
