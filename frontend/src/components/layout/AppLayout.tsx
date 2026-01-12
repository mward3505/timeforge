// src/components/layout/AppLayout.tsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <main className="pt-6">
        <Outlet />
      </main>
    </div>
  );
}
