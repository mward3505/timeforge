import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Signup failed");
            }

            // After signup, log them in
            const loginRes = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!loginRes.ok) {
                throw new Error("Login after signup failed");
            }

            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm space-y-4 bg-zinc-900 p-6 rounded-lg border border-zinc-800"
            >
                <h1 className="text-2xl font-bold">Create account</h1>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <input
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    disabled={loading}
                    className="w-full py-2 rounded bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 disabled:opacity-50"
                >
                    {loading ? "Creating account..." : "Sign up"}
                </button>

                <p className="text-sm text-zinc-400">
                    Already have an account?{" "}
                    <Link to="/login" className="text-zinc-200 underline">
                        Log in
                    </Link>
                </p>
            </form>
        </div>
    );
}
