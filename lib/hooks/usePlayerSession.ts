"use client";

import { useEffect, useState } from "react";

interface PlayerSession {
  playerId: string;
  nickname: string;
}

interface PlayerAccount {
  accountId: string;
  nickname: string;
}

function storageKey(roomCode: string) {
  return `puzzle-race:${roomCode.toUpperCase()}`;
}

const ACCOUNT_KEY = "puzzle-race:account";

function randomId() {
  return `acc_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
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

/**
 * Device-wide account: a nickname (and a stable local accountId) persisted
 * once and reused across every room, so the user only has to type their
 * name the first time. Distinct from the per-room PlayerSession above,
 * which stores the server-issued playerId for a specific room's game.
 */
export function getPlayerAccount(): PlayerAccount | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACCOUNT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlayerAccount;
  } catch {
    return null;
  }
}

/** Creates the account on first nickname entry, or updates the nickname on an existing one. */
export function savePlayerAccount(nickname: string): PlayerAccount {
  const existing = getPlayerAccount();
  const account: PlayerAccount = {
    accountId: existing?.accountId || randomId(),
    nickname,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  }
  return account;
}

export function usePlayerAccount() {
  const [account, setAccount] = useState<PlayerAccount | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAccount(getPlayerAccount());
    setLoaded(true);
  }, []);

  const save = (nickname: string) => {
    const acc = savePlayerAccount(nickname);
    setAccount(acc);
    return acc;
  };

  return { account, loaded, save };
}
