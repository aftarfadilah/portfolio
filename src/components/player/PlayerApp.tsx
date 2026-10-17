"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { parseYouTubeLink } from "@/lib/youtube";
import { addToLibrary, readLibrary, writeLibrary, type Track } from "./library";
import { Scene, type View } from "./Scene";
import { YT_STATE, useYouTubePlayer } from "./useYouTubePlayer";

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
      if (Number.isFinite(value))
        return Math.min(100, Math.max(0, Math.round(value)));
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
  const [library, setLibrary] = useState<Track[]>(readLibrary);
  const [view, setView] = useState<View>("deck");
  const [focus, setFocus] = useState(0);
  const [inspecting, setInspecting] = useState(false);
  const [loaded, setLoaded] = useState<Track | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [want, setWant] = useState(false);
  const [clock, setClock] = useState({ time: 0, duration: 0 });
  const [volume, setVolumeUI] = useState(readStoredVolume);

  const wantRef = useRef(false);
  const freshRef = useRef(true);
  const volumeRef = useRef(volume);
  const audibleRef = useRef(false);
  const progressRef = useRef(0);
  const requestRef = useRef(0);
  const pendingRef = useRef<string | null>(null);
  const pausedByUsRef = useRef(0);
  const ejectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateWant = useCallback((value: boolean) => {
    wantRef.current = value;
    setWant(value);
  }, []);

  useEffect(() => writeLibrary(library), [library]);

  // Notices fade away on their own.
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);

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

  // Runs inside a user gesture (Play / pick a record), so the browser allows playback.
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
    pausedByUsRef.current = performance.now();
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
          // Paused from the embed's own controls (ignore our own pauses).
          if (performance.now() - pausedByUsRef.current < 1000) return;
          freshRef.current = false;
          updateWant(false);
        } else if (state === YT_STATE.PLAYING && !wantRef.current) {
          if (loaded && !leaving) updateWant(true);
          else playerRef.current?.pauseVideo();
        }
      },
      onError: (code) => {
        stopPlayback();
        updateWant(false);
        setLoaded(null);
        setLeaving(false);
        setMessage(ERROR_TEXT[code] ?? "This video can't be played here.");
      },
    };
  });

  // A record picked before the YouTube player finished loading.
  useEffect(() => {
    if (status === "ready" && pendingRef.current) {
      const id = pendingRef.current;
      pendingRef.current = null;
      playerRef.current?.setVolume(0);
      playerRef.current?.loadVideoById(id);
    }
  }, [status, playerRef]);

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

  useEffect(
    () => () => {
      clearTimers();
      if (ejectRef.current) clearTimeout(ejectRef.current);
    },
    [clearTimers],
  );

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
      if (
        wantRef.current &&
        state !== YT_STATE.PLAYING &&
        state !== YT_STATE.BUFFERING
      ) {
        setMessage(
          "Your browser blocked autoplay. Press play on the video or the Play button.",
        );
      }
    }, 2500);
  }, [playerRef]);

  const onLiftOff = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  // Puts a record from the rack on the platter. Runs from a click, which is
  // what lets the embed start playing (silently) right away.
  function playTrack(track: Track) {
    if (ejectRef.current) clearTimeout(ejectRef.current);
    setMessage(null);
    setLeaving(false);
    setInspecting(false);
    setView("deck");

    if (loaded?.id === track.id) {
      if (!wantRef.current) {
        updateWant(true);
        startPlayback();
      }
      return;
    }

    clearTimers();
    audibleRef.current = false;
    progressRef.current = 0;
    freshRef.current = true;
    setClock({ time: 0, duration: 0 });
    setLoaded(track);
    updateWant(true);
    const player = playerRef.current;
    if (player) {
      player.setVolume(0);
      player.loadVideoById(track.id);
    } else {
      pendingRef.current = track.id;
    }
  }

  function eject() {
    if (!loaded) return;
    updateWant(false);
    stopPlayback();
    pendingRef.current = null;
    progressRef.current = 0;
    freshRef.current = true;
    setClock({ time: 0, duration: 0 });
    setLeaving(true);
    if (ejectRef.current) clearTimeout(ejectRef.current);
    ejectRef.current = setTimeout(() => {
      setLoaded(null);
      setLeaving(false);
    }, 1100);
  }

  async function addLink(event: React.FormEvent) {
    event.preventDefault();
    const link = parseYouTubeLink(input);
    if (!link) {
      setMessage("That doesn't look like a YouTube or YouTube Music link.");
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    setMessage(null);
    try {
      let incoming: Track[];
      let note: string;
      if (link.kind === "video") {
        const res = await fetch(`/api/youtube/meta?id=${link.id}`);
        const data = (await res.json()) as {
          title?: string;
          author?: string;
          error?: string;
        };
        if (!res.ok)
          throw new Error(data.error ?? "Could not load that video.");
        incoming = [
          {
            id: link.id,
            title: data.title ?? "Untitled",
            author: data.author ?? "Unknown artist",
          },
        ];
        note = `Added “${incoming[0].title}” to the rack.`;
      } else {
        const res = await fetch(
          `/api/youtube/playlist?list=${encodeURIComponent(link.id)}`,
        );
        const data = (await res.json()) as {
          title?: string;
          tracks?: Track[];
          error?: string;
        };
        if (!res.ok || !data.tracks)
          throw new Error(data.error ?? "Could not load that playlist.");
        incoming = data.tracks;
        note = `Added ${incoming.length} record${incoming.length === 1 ? "" : "s"} from “${data.title}”.`;
      }
      if (request !== requestRef.current) return;

      const next = addToLibrary(library, incoming);
      const firstIndex = next.findIndex((t) => t.id === incoming[0].id);
      setLibrary(next);
      setFocus(Math.max(0, firstIndex));
      setInspecting(false);
      setView("rack");
      setInput("");
      setMessage(
        next.length === library.length
          ? "Those are already on your rack."
          : note,
      );
    } catch (error) {
      if (request === requestRef.current) {
        setMessage(
          error instanceof Error ? error.message : "Could not load that link.",
        );
      }
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  function removeFocused() {
    const track = library[safeFocus];
    if (!track) return;
    setLibrary(library.filter((t) => t.id !== track.id));
    setInspecting(false);
    setFocus(
      Math.max(0, safeFocus - (safeFocus === library.length - 1 ? 1 : 0)),
    );
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
    if (!loaded || leaving) return;
    setMessage(null);
    if (want) {
      updateWant(false);
    } else {
      updateWant(true);
      startPlayback();
    }
  }

  const safeFocus = Math.min(focus, Math.max(0, library.length - 1));
  const focused = library[safeFocus] ?? null;
  const goBack = useCallback(() => {
    if (inspecting) setInspecting(false);
    else setView("deck");
  }, [inspecting]);

  const progress = clock.duration > 0 ? clock.time / clock.duration : 0;
  const onDeck = view === "deck";

  const pill =
    "pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-2 text-xs font-medium text-foreground backdrop-blur transition-colors hover:border-primary";
  const action =
    "rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium transition-colors hover:border-primary disabled:opacity-40";

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden lg:block">
      <div className="order-2 flex min-h-0 flex-1 flex-col lg:absolute lg:inset-0 lg:order-none">
        <div className="relative min-h-0 flex-1">
          <Scene
            view={view}
            records={library}
            focus={safeFocus}
            inspecting={inspecting}
            loadedId={loaded?.id ?? null}
            leaving={leaving}
            want={want}
            progressRef={progressRef}
            onFocus={setFocus}
            onInspect={() => setInspecting(true)}
            onBack={goBack}
            onNeedleDown={onNeedleDown}
            onLiftOff={onLiftOff}
          />

          {onDeck && (
            <button
              onClick={() => setView("rack")}
              aria-label="Open the record rack"
              className={`${pill} absolute left-3 top-1/2 -translate-y-1/2`}
            >
              <span aria-hidden className="text-base leading-none">
                ‹
              </span>
              Rack
              <span className="font-mono text-[10px] text-muted-foreground">
                {library.length}
              </span>
            </button>
          )}

          {!onDeck && (
            <button
              onClick={() => {
                setInspecting(false);
                setView("deck");
              }}
              aria-label="Back to the turntable"
              className={`${pill} absolute right-3 top-1/2 -translate-y-1/2`}
            >
              Turntable
              <span aria-hidden className="text-base leading-none">
                ›
              </span>
            </button>
          )}
        </div>

        {!onDeck && (
          <div className="pointer-events-none flex justify-center px-3 pb-3 lg:absolute lg:inset-x-0 lg:bottom-6 lg:pb-0">
            <div className="pointer-events-auto w-full max-w-[340px] rounded-lg border border-border bg-card/90 p-3 text-center backdrop-blur">
              {focused ? (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {safeFocus + 1} / {library.length}
                  </p>
                  <p
                    className="mt-1 truncate text-sm font-medium"
                    title={focused.title}
                  >
                    {focused.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {focused.author}
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    {inspecting ? (
                      <>
                        <button
                          onClick={() => playTrack(focused)}
                          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                        >
                          Play on turntable
                        </button>
                        <button
                          onClick={() => setInspecting(false)}
                          className={action}
                        >
                          Back
                        </button>
                        <button
                          onClick={removeFocused}
                          className={action}
                          aria-label="Remove from rack"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => playTrack(focused)}
                          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                        >
                          Play
                        </button>
                        <button
                          onClick={() => setInspecting(true)}
                          className={action}
                        >
                          Inspect
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {inspecting
                      ? "Drag to turn the record sleeve over."
                      : "Scroll, drag or use ← → to flip through."}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  The rack is empty. Paste a link or playlist above to fill it.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <header className="pointer-events-none relative order-1 flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 lg:absolute lg:inset-x-0 lg:top-0 lg:order-none">
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ← aftarfadilah.com
          </Link>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Vinyl Player
          </h1>
          <p className="max-w-xs text-xs text-muted-foreground">
            Paste a YouTube or YouTube Music link or playlist to stock your
            rack, then pick a record to play.
          </p>
        </div>

        <form
          onSubmit={addLink}
          className="pointer-events-auto flex w-full max-w-md gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://music.youtube.com/watch?v=… or playlist?list=…"
            aria-label="YouTube link"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-md border border-border bg-card/90 px-3 py-2 font-mono text-xs text-foreground outline-none backdrop-blur placeholder:text-muted-foreground/60 focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            {loading ? "Pressing…" : "Add to rack"}
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
          {loaded ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {want ? "Now playing" : "On the platter"}
              </p>
              <p
                className="mt-1 truncate text-sm font-medium"
                title={loaded.title}
              >
                {loaded.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {loaded.author}
              </p>
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
              <div className="mt-3 flex gap-2">
                <button onClick={togglePlay} className={`${action} flex-1`}>
                  {want ? "Pause (lift the needle)" : "Play (drop the needle)"}
                </button>
                <button onClick={eject} className={action}>
                  Eject
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing on the platter. Open the rack on the left and pick a
              record.
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

      <p className="pointer-events-none order-4 px-4 pb-3 text-center text-[10px] leading-snug text-muted-foreground/70 lg:absolute lg:inset-x-0 lg:bottom-1.5 lg:pb-0">
        I don&apos;t own, host or store any music or artwork here. Everything
        streams directly from YouTube through its official embedded player;
        titles and cover art are loaded from YouTube, and all rights belong to
        their respective owners. Not affiliated with or endorsed by YouTube.
      </p>
    </div>
  );
}
