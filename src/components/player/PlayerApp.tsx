"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseYouTubeId } from "@/lib/youtube";
import { Scene } from "./Scene";
import { YT_STATE, useYouTubePlayer } from "./useYouTubePlayer";

interface Track {
  id: string;
  title: string;
  author: string;
}

const ERROR_TEXT: Partial<Record<number, string>> = {
  2: "That video id isn't valid.",
  5: "The player hit an HTML5 error.",
  100: "That video was removed or is private.",
  101: "The owner doesn't allow this video to be embedded.",
  150: "The owner doesn't allow this video to be embedded.",
};

const VOLUME_KEY = "player-volume";

function readStoredVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_KEY);
    if (stored !== null) {
      const value = Number(stored);
      if (Number.isFinite(value)) return Math.min(100, Math.max(0, Math.round(value)));
    }
  } catch {}
  return 80;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function PlayerApp() {
  const [input, setInput] = useState("");
  const [record, setRecord] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [seated, setSeated] = useState(false);
  const [want, setWant] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const [clock, setClock] = useState({ time: 0, duration: 0 });
  const [volume, setVolumeUI] = useState(readStoredVolume);

  const wantRef = useRef(false);
  const seatedRef = useRef(false);
  const freshRef = useRef(true);
  const volumeRef = useRef(volume);
  const audibleRef = useRef(false);
  const progressRef = useRef(0);
  const requestRef = useRef(0);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateWant = useCallback((value: boolean) => {
    wantRef.current = value;
    setWant(value);
  }, []);
  const updateSeated = useCallback((value: boolean) => {
    seatedRef.current = value;
    setSeated(value);
  }, []);

  const handlersRef = useRef<{
    onState: (state: number) => void;
    onError: (code: number) => void;
  }>({ onState: () => {}, onError: () => {} });
  const { containerRef, playerRef, status } = useYouTubePlayer({
    onState: (s) => handlersRef.current.onState(s),
    onError: (c) => handlersRef.current.onError(c),
  });

  const clearTimers = useCallback(() => {
    if (fadeRef.current) clearInterval(fadeRef.current);
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    fadeRef.current = watchdogRef.current = null;
  }, []);

  // Runs inside a user gesture (drop / button), so the browser allows playback.
  // Starts silent; the volume fades in once the needle touches down.
  const startPlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    audibleRef.current = false;
    player.setVolume(0);
    player.playVideo();
  }, [playerRef]);

  const stopPlayback = useCallback(() => {
    clearTimers();
    audibleRef.current = false;
    try {
      playerRef.current?.pauseVideo();
    } catch {}
  }, [clearTimers, playerRef]);

  useEffect(() => {
    handlersRef.current = {
      onState: (state) => {
        if (state === YT_STATE.ENDED) {
          progressRef.current = 0;
          freshRef.current = true;
          updateWant(false);
        } else if (state === YT_STATE.PAUSED && wantRef.current) {
          // Paused from the embed's own controls.
          freshRef.current = false;
          updateWant(false);
        } else if (state === YT_STATE.PLAYING && !wantRef.current) {
          if (seatedRef.current) updateWant(true);
          else playerRef.current?.pauseVideo();
        }
      },
      onError: (code) => {
        stopPlayback();
        updateWant(false);
        updateSeated(false);
        setResetToken((t) => t + 1);
        setMessage(ERROR_TEXT[code] ?? "This video can't be played here.");
      },
    };
  });

  // Cue the video as soon as the record is loaded and the player is ready.
  const recordId = record?.id;
  useEffect(() => {
    if (status === "ready" && recordId) {
      playerRef.current?.cueVideoById(recordId);
      progressRef.current = 0;
      freshRef.current = true;
    }
  }, [status, recordId, playerRef]);

  // Track playback position for the tonearm and the progress bar.
  useEffect(() => {
    const timer = setInterval(() => {
      const player = playerRef.current;
      if (!player || !wantRef.current) return;
      try {
        const duration = player.getDuration();
        const time = player.getCurrentTime();
        if (duration > 0) {
          progressRef.current = time / duration;
          setClock({ time, duration });
        }
      } catch {}
    }, 250);
    return () => clearInterval(timer);
  }, [playerRef]);

  useEffect(() => clearTimers, [clearTimers]);

  const onSeat = useCallback(() => {
    setMessage(null);
    updateSeated(true);
    freshRef.current = progressRef.current < 0.02;
    updateWant(true);
    startPlayback();
  }, [startPlayback, updateSeated, updateWant]);

  const onUnseat = useCallback(() => {
    updateSeated(false);
    updateWant(false);
    stopPlayback();
    progressRef.current = 0;
    freshRef.current = true;
    setClock((c) => ({ ...c, time: 0 }));
  }, [stopPlayback, updateSeated, updateWant]);

  const onNeedleDown = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (freshRef.current) {
      player.seekTo(0, true);
      freshRef.current = false;
    }
    player.playVideo();
    if (fadeRef.current) clearInterval(fadeRef.current);
    let level = 0;
    fadeRef.current = setInterval(() => {
      const target = volumeRef.current;
      level = Math.min(target, level + 8);
      player.setVolume(level);
      if (level >= target && fadeRef.current) {
        clearInterval(fadeRef.current);
        fadeRef.current = null;
        audibleRef.current = true;
      }
    }, 40);
    if (watchdogRef.current) clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      const state = player.getPlayerState();
      if (wantRef.current && state !== YT_STATE.PLAYING && state !== YT_STATE.BUFFERING) {
        setMessage("Your browser blocked autoplay. Press play on the video or the Play button.");
      }
    }, 2500);
  }, [playerRef]);

  const onLiftOff = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  async function loadRecord(event: React.FormEvent) {
    event.preventDefault();
    const id = parseYouTubeId(input);
    if (!id) {
      setMessage("That doesn't look like a YouTube or YouTube Music link.");
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/youtube/meta?id=${id}`);
      const data = (await res.json()) as {
        title?: string;
        author?: string;
        error?: string;
      };
      if (request !== requestRef.current) return;
      if (!res.ok) throw new Error(data.error ?? "Could not load that video.");

      stopPlayback();
      updateWant(false);
      updateSeated(false);
      progressRef.current = 0;
      setClock({ time: 0, duration: 0 });
      setRecord({
        id,
        title: data.title ?? "Untitled",
        author: data.author ?? "Unknown artist",
      });
    } catch (error) {
      if (request === requestRef.current) {
        setMessage(error instanceof Error ? error.message : "Could not load that video.");
      }
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  function changeVolume(value: number) {
    setVolumeUI(value);
    volumeRef.current = value;
    try {
      localStorage.setItem(VOLUME_KEY, String(value));
    } catch {}
    // Until the needle is down the video is deliberately silent; the fade-in
    // picks up the new level by itself.
    if (audibleRef.current) {
      try {
        playerRef.current?.setVolume(value);
      } catch {}
    }
  }

  function togglePlay() {
    if (!record) return;
    if (!seated) {
      setMessage("Drag the record onto the platter first.");
      return;
    }
    setMessage(null);
    if (want) {
      updateWant(false);
    } else {
      updateWant(true);
      startPlayback();
    }
  }

  const progress = clock.duration > 0 ? clock.time / clock.duration : 0;

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden lg:block">
      <div className="relative order-2 min-h-0 flex-1 lg:absolute lg:inset-0 lg:order-none">
        <Scene
          videoId={record?.id ?? null}
          want={want}
          progressRef={progressRef}
          resetToken={resetToken}
          onSeat={onSeat}
          onUnseat={onUnseat}
          onNeedleDown={onNeedleDown}
          onLiftOff={onLiftOff}
        />
      </div>

      <header className="pointer-events-none relative order-1 flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 lg:absolute lg:inset-x-0 lg:top-0 lg:order-none">
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← aftarfadilah.com
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Vinyl Player</h1>
          <p className="max-w-xs text-xs text-muted-foreground">
            Paste a YouTube or YouTube Music link, then drag the record onto the platter.
          </p>
        </div>

        <form
          onSubmit={loadRecord}
          className="pointer-events-auto flex w-full max-w-md gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://music.youtube.com/watch?v=…"
            aria-label="YouTube link"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-md border border-border bg-card/90 px-3 py-2 font-mono text-xs text-foreground outline-none backdrop-blur placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {loading ? "Pressing…" : "Press record"}
          </button>
        </form>
      </header>

      {message && (
        <div
          role="status"
          className="absolute left-1/2 top-28 z-10 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border border-border bg-card/95 px-3 py-2 text-center text-xs text-foreground backdrop-blur sm:top-24"
        >
          {message}
        </div>
      )}

      <div className="pointer-events-none relative order-3 flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:justify-between sm:p-6 lg:absolute lg:inset-x-0 lg:bottom-0 lg:order-none">
        <div className="pointer-events-auto w-full rounded-lg border border-border bg-card/90 p-4 backdrop-blur sm:w-80">
          {record ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {want ? "Now playing" : seated ? "On the platter" : "On the shelf"}
              </p>
              <p className="mt-1 truncate text-sm font-medium" title={record.title}>
                {record.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">{record.author}</p>
              <div className="mt-3 h-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${Math.min(100, progress * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
                <span>{formatTime(clock.time)}</span>
                <span>{formatTime(clock.duration)}</span>
              </div>
              <label className="mt-3 flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <span className="w-12 uppercase tracking-widest">Volume</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  aria-label="Volume"
                  className="h-1 flex-1 cursor-pointer accent-primary"
                />
                <span className="w-8 text-right tabular-nums">{volume}</span>
              </label>
              <button
                onClick={togglePlay}
                className="mt-3 w-full rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium transition-colors hover:border-primary"
              >
                {want ? "Pause (lift the needle)" : "Play (drop the needle)"}
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No record yet. Paste a link above to press one.
            </p>
          )}
        </div>

        <div className="pointer-events-auto w-full sm:w-[356px]">
          <p className="mb-1 font-mono text-[10px] text-muted-foreground">
            {status === "failed"
              ? "Couldn't load the YouTube player. Check your connection or ad blocker."
              : "YouTube embed — this is what actually plays the audio"}
          </p>
          <div
            ref={containerRef}
            className="h-[200px] w-full overflow-hidden rounded-lg border border-border bg-black"
          />
        </div>
      </div>
    </div>
  );
}
