import React from "react";

type TimeBlock = {
    id: string;
    day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
    start: string; // display string for now
    end: string; // display string for now
    title: string;
};

const DAYS: TimeBlock["day"][] = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
];

const mockBlocks: TimeBlock[] = [
    {
        id: "1",
        day: "Mon",
        start: "7:00 PM",
        end: "10:00 PM",
        title: "Raid Night",
    },
    { id: "2", day: "Tue", start: "6:00 PM", end: "7:00 PM", title: "Gym" },
    {
        id: "3",
        day: "Wed",
        start: "8:00 PM",
        end: "10:00 PM",
        title: "Mythic+",
    },
];

function TimeBlockCard({ block }: { block: TimeBlock }) {
    return (
        <div className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2">
            <div className="text-sm font-medium">{block.title}</div>
            <div className="text-xs text-muted-foreground">
                {block.start} – {block.end}
            </div>
        </div>
    );
}

export default function WeeklyTimeline() {
    return (
        <div className="space-y-3">
            {DAYS.map((day) => {
                const blocksForDay = mockBlocks.filter((b) => b.day === day);

                return (
                    <div key={day} className="flex items-start gap-4">
                        <div className="w-12 pt-2 text-sm font-medium text-muted-foreground">
                            {day}
                        </div>

                        <div className="flex-1 rounded-lg border p-2">
                            {blocksForDay.length === 0 ? (
                                <div className="px-2 py-2 text-sm text-muted-foreground">
                                    —
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
