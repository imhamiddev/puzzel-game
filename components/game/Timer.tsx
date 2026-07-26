"use client";

import { useEffect, useState } from "react";

export function formatTime(ms: number): string {
  const totalMs = Math.max(0, ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = Math.floor((totalMs % 1000) / 10);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(2, "0")}`;
}

interface TimerProps {
  startedAt: Date | string | null;
  running: boolean;
  className?: string;
}

export default function Timer({ startedAt, running, className }: TimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt || !running) return;
    const start = new Date(startedAt).getTime();

    const tick = () => {
      setElapsed(Math.max(0, Date.now() - start));
    };
    tick();
    const interval = setInterval(tick, 47); // ~21fps, smooth without hammering CPU
    return () => clearInterval(interval);
  }, [startedAt, running]);

  return <span className={className}>{formatTime(elapsed)}</span>;
}
