"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Move, TrendingUp, Flag } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import PuzzleBoard, { type BoardPieceData } from "@/components/game/PuzzleBoard";
import PieceTray from "@/components/game/PieceTray";
import PuzzlePieceComponent from "@/components/game/PuzzlePiece";
import Timer from "@/components/game/Timer";
import WinnerModal from "@/components/game/WinnerModal";
import RoomUnavailable from "@/components/game/RoomUnavailable";
import { usePlayerSession } from "@/lib/hooks/usePlayerSession";

interface PieceData {
  id: string;
  pieceIndex: number;
  correctPosition: number;
  imageUrl: string;
  row: number;
  col: number;
}

interface RoomPiecesResponse {
  room: {
    rows: number;
    cols: number;
    status: "LOBBY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
    startedAt: string | null;
    previewUrl: string;
    hostId?: string;
  };
  pieces: PieceData[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PlayPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code.toUpperCase();
  const { session, loaded } = usePlayerSession(code);

  const [data, setData] = useState<RoomPiecesResponse | null>(null);
  const [slots, setSlots] = useState<(BoardPieceData | null)[]>([]);
  const [tray, setTray] = useState<BoardPieceData[]>([]);
  const [phase, setPhase] = useState<"loading" | "countdown" | "playing" | "finished" | "notfound">("loading");
  const [countdownVal, setCountdownVal] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rank, setRank] = useState(1);
  const [showWinner, setShowWinner] = useState(false);
  const [finishTime, setFinishTime] = useState(0);
  const [activePiece, setActivePiece] = useState<BoardPieceData | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const submittingRef = useRef(false);
  const finishedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  useEffect(() => {
    if (loaded && !session) router.replace(`/room/${code}/join`);
  }, [loaded, session, code, router]);

  const init = useCallback(async () => {
    const res = await fetch(`/api/rooms/${code}/pieces`);
    const json: RoomPiecesResponse = await res.json();
    if (!res.ok) {
      setPhase("notfound");
      return;
    }
    setData(json);

    const total = json.room.rows * json.room.cols;
    const pieceData: BoardPieceData[] = json.pieces.map((p) => ({
      id: `piece-${p.pieceIndex}`,
      pieceIndex: p.pieceIndex,
      imageUrl: p.imageUrl,
    }));
    setSlots(new Array(total).fill(null));
    setTray(shuffle(pieceData));

    if (json.room.status === "PLAYING" && json.room.startedAt) {
      const startMs = new Date(json.room.startedAt).getTime();
      setPhase(Date.now() >= startMs ? "playing" : "countdown");
    } else if (json.room.status === "FINISHED") {
      setPhase("finished");
    } else {
      setPhase("countdown");
    }
  }, [code]);

  useEffect(() => {
    if (session) init();
  }, [session, init]);

  // Determine host status from the room record (pieces endpoint doesn't
  // include hostId, so fetch the lightweight room endpoint once).
  useEffect(() => {
    if (!session) return;
    fetch(`/api/rooms/${code}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.room?.hostId) setIsHost(d.room.hostId === session.playerId);
      })
      .catch(() => {});
  }, [code, session]);

  useEffect(() => {
    if (phase !== "countdown" || !data?.room.startedAt) return;
    const startMs = new Date(data.room.startedAt).getTime();

    const tick = () => {
      const remaining = startMs - Date.now();
      if (remaining <= 0) {
        setCountdownVal(0);
        setPhase("playing");
        return;
      }
      setCountdownVal(Math.ceil(remaining / 1000));
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [phase, data]);

  // Poll room status while playing so everyone moves to results once the
  // host force-ends the game (or all players finish organically).
  useEffect(() => {
    if (phase !== "playing" && phase !== "countdown") return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/rooms/${code}`);
      const json = await res.json();
      if (res.ok && json.room?.status === "FINISHED") {
        router.push(`/room/${code}/results`);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, code, router]);

  const correctSet = useMemo(() => {
    const set = new Set<number>();
    slots.forEach((piece, position) => {
      if (piece && piece.pieceIndex === position) set.add(position);
    });
    return set;
  }, [slots]);

  const submitMove = useCallback(
    async (board: (BoardPieceData | null)[]) => {
      if (!session || submittingRef.current || finishedRef.current) return;
      submittingRef.current = true;
      const boardPayload = board
        .map((piece, position) => (piece ? { position, pieceIndex: piece.pieceIndex } : null))
        .filter((x): x is { position: number; pieceIndex: number } => x !== null);

      try {
        const res = await fetch(`/api/rooms/${code}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: session.playerId, board: boardPayload }),
        });
        const json = await res.json();
        if (res.ok) {
          setMoves(json.moves);
          setProgress(json.progress);
          if (json.finished && !finishedRef.current) {
            finishedRef.current = true;
            setFinishTime(json.finishTime);
            setPhase("finished");
            const lbRes = await fetch(`/api/rooms/${code}/leaderboard`);
            const lb = await lbRes.json();
            const idx = lb.players.findIndex((p: { id: string }) => p.id === session.playerId);
            setRank(idx >= 0 ? idx + 1 : 1);
            setShowWinner(true);
          }
        }
      } finally {
        submittingRef.current = false;
      }
    },
    [code, session]
  );

  const handleEndGame = async () => {
    if (!session) return;
    setEnding(true);
    try {
      await fetch(`/api/rooms/${code}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: session.playerId }),
      });
      router.push(`/room/${code}/results`);
    } catch {
      setEnding(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const fromTray = tray.find((p) => p.id === id);
    const fromSlot = slots.find((p) => p?.id === id);
    setActivePiece(fromTray || fromSlot || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActivePiece(null);
    const { active, over } = event;
    if (!over) return;

    const pieceId = active.id as string;
    const overId = over.id as string;

    let piece: BoardPieceData | null = null;
    let fromTray = false;
    let fromPosition = -1;

    const trayIdx = tray.findIndex((p) => p.id === pieceId);
    if (trayIdx >= 0) {
      piece = tray[trayIdx];
      fromTray = true;
    } else {
      fromPosition = slots.findIndex((p) => p?.id === pieceId);
      if (fromPosition >= 0) piece = slots[fromPosition];
    }
    if (!piece) return;

    const newSlots = [...slots];
    let newTray = [...tray];

    if (overId === "tray") {
      if (!fromTray) {
        newSlots[fromPosition] = null;
        newTray = [...newTray, piece];
      }
    } else if (overId.startsWith("slot-")) {
      const targetPos = parseInt(overId.replace("slot-", ""), 10);
      if (fromPosition >= 0 && slots[fromPosition]?.pieceIndex === fromPosition) return;

      const displaced = newSlots[targetPos];
      if (displaced && displaced.pieceIndex === targetPos) return;

      newSlots[targetPos] = piece;

      if (fromTray) {
        newTray = newTray.filter((p) => p.id !== pieceId);
        if (displaced) newTray = [...newTray, displaced];
      } else {
        newSlots[fromPosition] = displaced || null;
      }
    } else {
      return;
    }

    setSlots(newSlots);
    setTray(newTray);
    submitMove(newSlots);
  };

  const boardSize = useMemo(
    () => (typeof window !== "undefined" ? Math.min(window.innerWidth - 40, 420) : 380),
    []
  );
  const pieceSize = useMemo(
    () => (data ? (boardSize - 3 * (data.room.cols - 1)) / data.room.cols : 40),
    [data, boardSize]
  );
  const trayPieceSize = useMemo(() => Math.min(pieceSize, 64), [pieceSize]);

  if (phase === "notfound") {
    return (
      <RoomUnavailable
        title="اتاق پیدا نشد"
        description="اتاقی با این کد پیدا نشد یا دیگر در دسترس نیست."
      />
    );
  }

  if (phase === "loading" || !data) {
    return (
      <main className="relative min-h-screen px-5 py-6 safe-top safe-bottom">
        <div className="max-w-md mx-auto space-y-5">
          <Skeleton className="h-10 w-40 mx-auto" />
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (phase === "countdown") {
    return (
      <main className="relative min-h-screen flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={countdownVal}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-white font-bold animate-count-pop"
          >
            {countdownVal && countdownVal > 0 ? (
              <p className="text-9xl text-gradient">{countdownVal}</p>
            ) : (
              <p className="text-7xl text-accent">شروع!</p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen px-4 pt-4 pb-2 game-lock-scroll safe-top flex flex-col">
      <div className="grid grid-cols-3 gap-2.5 mb-3 max-w-md mx-auto w-full shrink-0">
        <div className="glass rounded-2xl py-3 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">زمان</p>
          <Timer
            startedAt={data.room.startedAt}
            running={phase === "playing"}
            className="font-mono font-bold text-white text-lg"
          />
        </div>
        <div className="glass rounded-2xl py-3 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5 flex items-center justify-center gap-1">
            <Move className="h-2.5 w-2.5" /> حرکت‌ها
          </p>
          <p className="font-mono font-bold text-white text-lg">{moves}</p>
        </div>
        <div className="glass rounded-2xl py-3 text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5 flex items-center justify-center gap-1">
            <TrendingUp className="h-2.5 w-2.5" /> پیشرفت
          </p>
          <p className="font-mono font-bold text-accent text-lg">{progress}٪</p>
        </div>
      </div>

      {isHost && (
        <div className="max-w-md mx-auto w-full mb-2 shrink-0">
          {showEndConfirm ? (
            <div className="glass rounded-2xl p-3 flex items-center gap-2">
              <p className="text-xs text-white/70 flex-1">
                بازی برای همه پایان می‌یابد. مطمئن هستید؟
              </p>
              <button
                onClick={() => setShowEndConfirm(false)}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-white/60 bg-white/5"
              >
                انصراف
              </button>
              <button
                onClick={handleEndGame}
                disabled={ending}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-white bg-red-500/90 disabled:opacity-50"
              >
                {ending ? "در حال پایان…" : "پایان بازی"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="w-full h-10 rounded-2xl glass flex items-center justify-center gap-2 text-xs font-semibold text-white/60"
            >
              <Flag className="h-3.5 w-3.5" /> پایان دادن به بازی برای همه
            </button>
          )}
        </div>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full min-h-0">
          <PuzzleBoard
            rows={data.room.rows}
            cols={data.room.cols}
            boardSize={boardSize}
            slots={slots}
            correctSet={correctSet}
          />
        </div>

        <div className="max-w-md mx-auto w-full mt-2 mb-2 shrink-0 safe-bottom">
          <PieceTray pieces={tray} pieceSize={trayPieceSize} />
        </div>

        <DragOverlay>
          {activePiece && (
            <PuzzlePieceComponent id={activePiece.id} imageUrl={activePiece.imageUrl} size={pieceSize} />
          )}
        </DragOverlay>
      </DndContext>

      <WinnerModal
        open={showWinner}
        onClose={() => setShowWinner(false)}
        rank={rank}
        finishTime={finishTime}
        moves={moves}
        onViewLeaderboard={() => router.push(`/room/${code}/results`)}
      />
    </main>
  );
}
