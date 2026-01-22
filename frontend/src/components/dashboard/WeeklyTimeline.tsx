// React import not needed with newer React versions

type AvailRow = {
	day_of_week: number;
	hours: number;
	minutes: number;
};

type ApiTimeBlock = {
	id: number;
	day_of_week: number; // 0=Mon, 6=Sun
	start_minutes: number;
	duration_minutes: number;
	title: string;
};

type WeeklyTimelineProps = {
	avail: AvailRow[];
	timeBlocks: ApiTimeBlock[];
	loading: boolean;
	onSelectDay?: (dayIndex: number) => void;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function minutesToTime(minutes: number) {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	const period = h >= 12 ? "PM" : "AM";
	const displayHour = h % 12 === 0 ? 12 : h % 12;
	return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

function TimeBlockCard({
	block,
}: {
	block: { id: number; title: string; start: string; end: string };
}) {
	return (
		<div className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 cursor-pointer hover:border-zinc-500">
			<div className="text-sm font-medium">{block.title}</div>
			<div className="text-xs text-muted-foreground">
				{block.start} – {block.end}
			</div>
		</div>
	);
}

export default function WeeklyTimeline({
	avail = [],
	timeBlocks,
	loading,
	onSelectDay,
}: WeeklyTimelineProps) {
	if (loading) {
		return <div className="text-zinc-400 p-4">Loading schedule…</div>;
	}
	return (
		<div className="space-y-3">
			{DAY_LABELS.map((day, index) => {
				const availability = avail.find((a) => a.day_of_week === index);

				const availableMinutes = availability
					? availability.hours * 60 + availability.minutes
					: 0;
				const blocksForDay = timeBlocks
					.filter((b) => b.day_of_week === index)
					.map((b) => ({
						id: b.id,
						title: b.title,
						start: minutesToTime(b.start_minutes),
						end: minutesToTime(
							b.start_minutes + b.duration_minutes
						),
					}));

				return (
					<div key={day} className="flex items-start gap-4">
						<div className="w-16 pt-1">
							<div className="text-sm font-medium text-zinc-300">
								{day}
							</div>
							<div className="text-xs text-zinc-500">
								{availableMinutes > 0
									? (() => {
											const h = Math.floor(
												availableMinutes / 60
											);
											const m = availableMinutes % 60;

											if (h > 0 && m > 0)
												return `${h}h ${m}m available`;
											if (h > 0) return `${h}h available`;
											return `${m}m available`;
									  })()
									: "No availability"}
							</div>
						</div>

						<div
							onClick={() => onSelectDay?.(index)}
							className={`flex-1 rounded-lg border p-2 ${
								availableMinutes === 0
									? "border-zinc-800 bg-zinc-950"
									: "border-zinc-700 bg-zinc-900"
							}`}
						>
							{blocksForDay.length === 0 ? (
								<div className="px-2 py-2 text-sm text-zinc-500 italic">
									No time blocked
								</div>
							) : (
								<div className="space-y-2">
									{blocksForDay.map((block) => (
										<TimeBlockCard
											key={block.id}
											block={block}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
