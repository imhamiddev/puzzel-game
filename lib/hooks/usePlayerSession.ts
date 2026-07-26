"use client";

import { useEffect, useState } from "react";

interface PlayerSession {
  playerId: string;
  nickname: string;
}

function storageKey(roomCode: string) {
  return `puzzle-race:${roomCode.toUpperCase()}`;
}

export function savePlayerSession(roomCode: string, session: PlayerSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(roomCode), JSON.stringify(session));
}

export function getPlayerSession(roomCode: string): PlayerSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(roomCode));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerSession;
  } catch {
    return null;
  }
}

export function usePlayerSession(roomCode: string) {
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSession(getPlayerSession(roomCode));
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]);

  const save = (s: PlayerSession) => {
    savePlayerSession(roomCode, s);
    setSession(s);
  };

  return { session, loaded, save };
}
