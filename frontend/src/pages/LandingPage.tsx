import { Link } from "react-router-dom";

export default function LandingPage() {
	return (
		<div className="min-h-screen bg-neutral-900 flex items-center justify-center px-6">
			<div className="text-center max-w-xl">
				<h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
					TimeForge
				</h1>

				<p className="text-neutral-300 text-lg mb-12 leading-relaxed">
					Build a smarter daily routine. Turn your goals into
					scheduled wins — one day at a time.
				</p>

				<div className="flex gap-4 justify-center">
					<Link
						to="/signup"
						className="px-6 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-500 transition"
					>
						Sign Up
					</Link>

					<Link
						to="/login"
						className="px-6 py-3 rounded-md border border-neutral-600 text-neutral-200 font-medium hover:bg-neutral-800 transition"
					>
						Log In
					</Link>
				</div>
			</div>
		</div>
	);
}
