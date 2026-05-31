import React from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, Users } from "lucide-react";

interface SessionData {
  name: string;
  time: string;
  room: string;
  students: number;
  status: "In Progress" | "Upcoming" | string;
}

const sessions: SessionData[] = [
  { name: "Quran Hifz - Level 3", time: "09:00 AM", room: "Room A", students: 12, status: "In Progress" },
  { name: "Tajweed Basics", time: "10:30 AM", room: "Room B", students: 18, status: "Upcoming" },
  { name: "Islamic Studies", time: "01:00 PM", room: "Room C", students: 24, status: "Upcoming" },
];

/**
 * UpcomingSessions Component
 *
 * Displays a list of today's upcoming and in-progress sessions.
 *
 * @returns {React.ReactElement} The upcoming sessions widget.
 */
export default function UpcomingSessions() {
  return (
    <motion.section
      aria-labelledby="upcoming-sessions-heading"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.4 }}
      className="bg-card rounded-xl border border-border"
    >
      <header className="px-5 py-4 border-b border-border">
        <h3 id="upcoming-sessions-heading" className="text-sm font-semibold text-foreground m-0">Today's Sessions</h3>
      </header>
      <div className="divide-y divide-border/50">
        {sessions.map((session, i) => (
          <article key={i} className="px-5 py-3.5 hover:bg-muted/30 transition-colors">
            <header className="flex items-center justify-between mb-1.5">
              <h4 className="text-sm font-medium text-foreground m-0">{session.name}</h4>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                session.status === "In Progress"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {session.status}
              </span>
            </header>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Time:</span> {session.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Room:</span> {session.room}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" aria-hidden="true" />
                <span className="sr-only">Students:</span> {session.students}
              </span>
            </div>
          </article>
        ))}
      </div>
      <footer className="px-5 py-3 border-t border-border">
        <button className="text-xs text-primary font-medium hover:underline">
          View all sessions
        </button>
      </footer>
    </motion.section>
  );
}
