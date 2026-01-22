// Removed unused Card imports - component doesn't use Card wrapper

type AvailRow = {
    day_of_week: number;
    hours: number;
    minutes: number;
};

type Props = {
    avail: AvailRow[];
    setAvail: React.Dispatch<React.SetStateAction<AvailRow[]>>;
};

export default function WeeklyAvailabilityCard({ avail, setAvail }: Props) {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
        <div className="grid grid-cols-7 gap-4">
            {avail.map((row) => (
                <div key={row.day_of_week} className="space-y-2 text-center">
                    <div className="font-semibold">
                        {dayNames[row.day_of_week]}
                    </div>

                    <div className="flex justify-center gap-1">
                        <input
                            type="number"
                            min={0}
                            max={12}
                            value={row.hours}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setAvail((curr) =>
                                    curr.map((x) =>
                                        x.day_of_week === row.day_of_week
                                            ? { ...x, hours: val }
                                            : x
                                    )
                                );
                            }}
                            className="w-14 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded text-center"
                        />
                        <span className="text-sm text-zinc-400 self-center">
                            h
                        </span>
                    </div>

                    <div className="flex justify-center gap-1">
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={row.minutes}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setAvail((curr) =>
                                    curr.map((x) =>
                                        x.day_of_week === row.day_of_week
                                            ? { ...x, minutes: val }
                                            : x
                                    )
                                );
                            }}
                            className="w-14 bg-zinc-800 text-zinc-100 border border-zinc-700 rounded text-center"
                        />
                        <span className="text-sm text-zinc-400 self-center">
                            m
                        </span>
                    </div>
                </div>
            ))}
        </div>

        // <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
        // 	<CardHeader>
        // 		<CardTitle className="text-zinc-50">
        // 			Weekly Availability
        // 		</CardTitle>
        // 	</CardHeader>

        // 	<CardContent>
        // 		<div className="grid grid-cols-7 gap-4">
        // 			{avail.map((row) => (
        // 				<div
        // 					key={row.day_of_week}
        // 					className="space-y-2 text-center"
        // 				>
        // 					<div className="font-semibold">
        // 						{dayNames[row.day_of_week]}
        // 					</div>

        // 					<div className="flex justify-center gap-1">
        // 						<input
        // 							type="number"
        // 							min={0}
        // 							max={12}
        // 							value={row.hours}
        // 							onChange={(e) => {
        // 								const val = Number(e.target.value);
        // 								setAvail((curr) =>
        // 									curr.map((x) =>
        // 										x.day_of_week ===
        // 										row.day_of_week
        // 											? { ...x, hours: val }
        // 											: x
        // 									)
        // 								);
        // 							}}
        // 							className="w-14 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 border border-zinc-700 rounded text-center focus:outline-none focus:ring-2 focus:ring-zinc-600"
        // 						/>
        // 						<span className="text-sm text-zinc-400 self-center">
        // 							h
        // 						</span>
        // 					</div>

        // 					<div className="flex justify-center gap-1">
        // 						<input
        // 							type="number"
        // 							min={0}
        // 							max={59}
        // 							value={row.minutes}
        // 							onChange={(e) => {
        // 								const val = Number(e.target.value);
        // 								setAvail((curr) =>
        // 									curr.map((x) =>
        // 										x.day_of_week ===
        // 										row.day_of_week
        // 											? { ...x, minutes: val }
        // 											: x
        // 									)
        // 								);
        // 							}}
        // 							className="w-14 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 border border-zinc-700 rounded text-center focus:outline-none focus:ring-2 focus:ring-zinc-600"
        // 						/>
        // 						<span className="text-sm text-zinc-400 self-center">
        // 							m
        // 						</span>
        // 					</div>
        // 				</div>
        // 			))}
        // 		</div>
        // 	</CardContent>
        // </Card>
    );
}
