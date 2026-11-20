import { useEffect, useRef, useState } from 'react';
import type * as AlphaTab from '@coderline/alphatab';
import { shortcutAction, type ShortcutAction } from '../lib/shortcuts';
import { sectionAt, songSections, type SongSection } from '../lib/sections';
import { tabNeckDots, tabNeckFocusFret, tabNeckLinks, type NeckLabels, type TabNote } from '../lib/tabNeck';
import { detectKey, keyShortName, keyTitle, scaleNotes, type DetectedKey } from '../lib/theory';
import { formatTime } from '../lib/time';
import { kindOfTrack } from '../lib/trackKind';
import { trackEntry, trackMenu, type TrackEntry } from '../lib/trackMenu';
import { Fretboard, fretPositionRatio } from './Fretboard';
import { PlayerIcon } from './PlayerIcon';
import { TrackIcon } from './TrackIcon';
import { tabCursorHandler } from './tabCursor';
import { LABEL_MODES, Segmented } from './controls';
import './explorer.css';
import './tabplayer.css';

type AlphaTabModule = typeof AlphaTab;
type View = 'tab' | 'score';

interface Neck {
  tuning: number[];
  fretCount: number;
  notes: TabNote[];
  focusFret: number;
}

const SCRIPT = '/alphatab/alphaTab.min.js';
const SPEEDS = [
  { id: '0.5', label: '50%', name: 'Скорость 50% (1)' },
  { id: '0.75', label: '75%', name: 'Скорость 75% (2)' },
  { id: '1', label: '100%', name: 'Скорость 100% (3)' },
] as const;
const VIEWS = [
  { id: 'tab', label: <PlayerIcon kind="tab" />, name: 'Только табы' },
  { id: 'score', label: <PlayerIcon kind="score" />, name: 'Ноты и табы' },
] as const;
const TAB_FONT = ['Inter Variable', 'system-ui', 'sans-serif'];
const BACKING_VOLUME = 0.35;
const SHORTEST_NECK = 12;
const NECK_PIXELS_PER_FRET = 60;
const COLOR_ROLES = {
  staffLineColor: '--line',
  barSeparatorColor: '--muted',
  barNumberColor: '--accent-ink',
  mainGlyphColor: '--fg',
  secondaryGlyphColor: '--muted',
  scoreInfoColor: '--fg',
} as const;

const HIDDEN_ELEMENTS = ['ScoreTitle', 'ScoreSubTitle', 'ScoreArtist', 'ScoreAlbum', 'ScoreWords', 'ScoreMusic', 'ScoreWordsAndMusic', 'ScoreCopyright'] as const;

let libraryLoading: Promise<AlphaTabModule> | undefined;

function loadLibrary(): Promise<AlphaTabModule> {
  libraryLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.onload = () => resolve((window as unknown as { alphaTab: AlphaTabModule }).alphaTab);
    script.onerror = () => reject(new Error('alphaTab script failed to load'));
    document.head.append(script);
  });
  return libraryLoading;
}

function themeColors(): Record<keyof typeof COLOR_ROLES, string> {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(COLOR_ROLES).map(([role, token]) => [role, styles.getPropertyValue(token).trim()]),
  ) as Record<keyof typeof COLOR_ROLES, string>;
}

function barNotes(bar: AlphaTab.model.Bar, sounding: AlphaTab.model.Beat | null): TabNote[] {
  return bar.voices.flatMap((voice, voiceIndex) =>
    voice.beats.flatMap((beat, beatIndex) =>
      beat.notes
        .filter((note) => note.string >= 1)
        .map((note) => ({
          string: note.string,
          fret: note.fret,
          beat: voiceIndex * 1000 + beatIndex,
          sounding: beat === sounding,
          dead: note.isDead,
        })),
    ),
  );
}

function scoreKey(score: AlphaTab.model.Score): DetectedKey | null {
  const counts = new Array<number>(12).fill(0);
  for (const track of score.tracks) {
    for (const staff of track.staves) {
      if (staff.isPercussion) continue;
      for (const bar of staff.bars) {
        for (const voice of bar.voices) {
          for (const beat of voice.beats) {
            for (const note of beat.notes) if (!note.isDead) counts[note.realValue % 12]! += 1;
          }
        }
      }
    }
  }
  return detectKey(counts);
}

function neckFor(track: AlphaTab.model.Track): Neck | null {
  const staff = track.staves[0];
  if (!staff || staff.isPercussion || staff.tuning.length === 0) return null;
  const frets = staff.bars.flatMap((bar) => barNotes(bar, null).map((note) => note.fret));
  const notes = staff.bars[0] ? barNotes(staff.bars[0], null) : [];
  return {
    tuning: staff.tuning,
    fretCount: Math.max(SHORTEST_NECK, ...frets),
    notes,
    focusFret: tabNeckFocusFret(notes) ?? 0,
  };
}

function trackTitle(entry: TrackEntry): string {
  return entry.detail ? `${entry.part} — ${entry.detail}` : entry.part;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
}

export function TabPlayer({ file, firstTrack }: { file: string; firstTrack: number }) {
  const surface = useRef<HTMLDivElement>(null);
  const trackPicker = useRef<HTMLDivElement>(null);
  const trackList = useRef<HTMLUListElement>(null);
  const progressFill = useRef<HTMLDivElement>(null);
  const sectionList = useRef<SongSection[]>([]);
  const api = useRef<AlphaTab.AlphaTabApi | null>(null);
  const shortcuts = useRef<Record<ShortcutAction, () => void> | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [soundProgress, setSoundProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [looping, setLooping] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const [countIn, setCountIn] = useState(false);
  const [view, setView] = useState<View>('tab');
  const [time, setTime] = useState({ current: 0, end: 0 });
  const [tracks, setTracks] = useState<TrackEntry[]>([]);
  const [track, setTrack] = useState(firstTrack);
  const [trackMenuOpen, setTrackMenuOpen] = useState(false);
  const [neck, setNeck] = useState<Neck | null>(null);
  const [neckShown, setNeckShown] = useState(true);
  const [key, setKey] = useState<DetectedKey | null>(null);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [currentSection, setCurrentSection] = useState<SongSection | null>(null);
  const [neckLabels, setNeckLabels] = useState<NeckLabels>('degrees');

  const bringForward = (player: AlphaTab.AlphaTabApi, index: number) => {
    const all = player.score?.tracks ?? [];
    const chosen = all[index];
    if (!chosen) return;
    player.changeTrackVolume(all.filter((other) => other !== chosen), BACKING_VOLUME);
    player.changeTrackVolume([chosen], 1);
  };

  useEffect(() => {
    let disposed = false;
    let stopWatchingTheme = () => {};

    loadLibrary()
      .then((alphaTab) => {
        if (disposed || !surface.current) return;
        const player = new alphaTab.AlphaTabApi(surface.current, {
          core: { file, tracks: firstTrack, fontDirectory: '/alphatab/font/', scriptFile: new URL(SCRIPT, window.location.href).href },
          display: { staveProfile: 'Tab', layoutMode: 'Page', scale: 1.05, barsPerRow: -1, resources: themeColors() },
          notation: {
            rhythmMode: 'ShowWithBars',
            elements: new Map(HIDDEN_ELEMENTS.map((element) => [element, false])),
          },
          player: {
            playerMode: 'EnabledAutomatic',
            soundFont: '/alphatab/soundfont/sonivox.sf3',
            scrollElement: document.documentElement,
            scrollOffsetY: -110,
            enableCursor: true,
            enableUserInteraction: true,
          },
        });
        player.customCursorHandler = tabCursorHandler();
        api.current = player;

        const modern = (font: AlphaTab.model.Font) => alphaTab.model.Font.withFamilyList(TAB_FONT, font.size, undefined, font.weight);
        const resources = player.settings.display.resources;
        for (const [element, font] of resources.elementFonts) resources.elementFonts.set(element, modern(font));
        resources.tablatureFont = modern(resources.tablatureFont);
        resources.graceFont = modern(resources.graceFont);
        resources.fingeringFont = modern(resources.fingeringFont);
        resources.inlineFingeringFont = modern(resources.inlineFingeringFont);
        player.updateSettings();

        player.scoreLoaded.on((score) => {
          setTracks(score.tracks.map((item, index) => trackEntry(item.name, kindOfTrack(item), index)));
          setTrack(firstTrack);
          setKey(scoreKey(score));
          const lastBar = score.masterBars.at(-1);
          sectionList.current = songSections(
            score.masterBars.map((bar) => ({ start: bar.start, section: bar.section?.text })),
            lastBar ? lastBar.start + lastBar.calculateDuration() : 0,
          );
          setSections(sectionList.current);
          setCurrentSection(sectionAt(sectionList.current, 0));
          const shown = score.tracks[firstTrack];
          setNeck(shown ? neckFor(shown) : null);
        });
        player.soundFontLoad.on((progress) => setSoundProgress(progress.total ? progress.loaded / progress.total : 0));
        player.playerReady.on(() => {
          bringForward(player, firstTrack);
          setStatus('ready');
        });
        player.error.on(() => setStatus('error'));
        player.playerStateChanged.on((args) => setPlaying(args.state === alphaTab.synth.PlayerState.Playing));
        player.playerPositionChanged.on((args) => {
          const played = args.endTick ? args.currentTick / args.endTick : 0;
          if (progressFill.current) progressFill.current.style.transform = `scaleX(${played})`;
          setCurrentSection(sectionAt(sectionList.current, played));
          setTime((previous) => {
            const next = { current: Math.floor(args.currentTime / 1000) * 1000, end: args.endTime };
            return next.current === previous.current && next.end === previous.end ? previous : next;
          });
        });
        player.playedBeatChanged.on((beat) =>
          setNeck((previous) => {
            if (!previous) return previous;
            const notes = barNotes(beat.voice.bar, beat);
            return { ...previous, notes, focusFret: tabNeckFocusFret(notes) ?? previous.focusFret };
          }),
        );

        const applyTheme = () => {
          const colors = themeColors();
          for (const role of Object.keys(colors) as (keyof typeof colors)[]) {
            player.settings.display.resources[role] = alphaTab.model.Color.fromJson(colors[role])!;
          }
          player.updateSettings();
          player.render();
        };
        const observer = new MutationObserver(applyTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        const systemTheme = matchMedia('(prefers-color-scheme: dark)');
        systemTheme.addEventListener('change', applyTheme);
        stopWatchingTheme = () => {
          observer.disconnect();
          systemTheme.removeEventListener('change', applyTheme);
        };
      })
      .catch(() => setStatus('error'));

    return () => {
      disposed = true;
      stopWatchingTheme();
      api.current?.destroy();
      api.current = null;
    };
  }, [file, firstTrack]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') return setTrackMenuOpen(false);
      const action = shortcutAction({
        code: event.code,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
        typing: isTyping(event.target),
      });
      if (!action || !shortcuts.current) return;
      event.preventDefault();
      // A focused button would also fire its own click when the space bar is released.
      if (event.target instanceof HTMLButtonElement) event.target.blur();
      shortcuts.current[action]();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!trackPicker.current?.contains(event.target as Node)) setTrackMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  useEffect(() => {
    const list = trackList.current;
    const chosen = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (list && chosen) list.scrollTop = chosen.offsetTop - (list.clientHeight - chosen.offsetHeight) / 2;
  }, [trackMenuOpen]);

  const withPlayer = (action: (player: AlphaTab.AlphaTabApi) => void) => {
    if (api.current) action(api.current);
  };

  const chooseView = (next: View) => {
    if (next === view) return;
    setView(next);
    withPlayer((player) => {
      player.settings.display.staveProfile = next === 'tab' ? 3 : 1;
      player.updateSettings();
      player.render();
    });
  };

  const chooseTrack = (index: number) => {
    setTrack(index);
    setTrackMenuOpen(false);
    withPlayer((player) => {
      const chosen = player.score?.tracks[index];
      if (!chosen) return;
      player.renderTracks([chosen]);
      bringForward(player, index);
      setNeck(neckFor(chosen));
    });
  };

  const seekTo = (event: React.MouseEvent<HTMLDivElement>) => {
    const share = event.clientX / event.currentTarget.clientWidth;
    withPlayer((player) => {
      const lastBar = player.score?.masterBars.at(-1);
      if (lastBar) player.tickPosition = Math.floor(share * (lastBar.start + lastBar.calculateDuration()));
    });
  };

  const chooseSpeed = (value: number) => {
    setSpeed(value);
    withPlayer((player) => (player.playbackSpeed = value));
  };

  const toggleLoop = () => {
    setLooping(!looping);
    withPlayer((player) => (player.isLooping = !looping));
  };

  const toggleMetronome = () => {
    setMetronome(!metronome);
    withPlayer((player) => (player.metronomeVolume = metronome ? 0 : 1));
  };

  const toggleCountIn = () => {
    setCountIn(!countIn);
    withPlayer((player) => (player.countInVolume = countIn ? 0 : 1));
  };

  const moveByBar = (step: number) =>
    withPlayer((player) => {
      const bars = player.score?.masterBars ?? [];
      if (bars.length === 0) return;
      const tick = player.tickPosition;
      const current = bars.findLastIndex((bar) => bar.start <= tick);
      const target = Math.min(bars.length - 1, Math.max(0, current + step));
      player.tickPosition = bars[target]!.start;
    });

  shortcuts.current = {
    playPause: () => withPlayer((player) => player.playPause()),
    toStart: () => withPlayer((player) => player.stop()),
    previousBar: () => moveByBar(-1),
    nextBar: () => moveByBar(1),
    loop: toggleLoop,
    metronome: toggleMetronome,
    countIn: toggleCountIn,
    neck: () => setNeckShown((shown) => !shown),
    speed50: () => chooseSpeed(0.5),
    speed75: () => chooseSpeed(0.75),
    speed100: () => chooseSpeed(1),
  };

  const ready = status === 'ready';
  const chosenTrack = tracks[track];
  const menu = trackMenu(tracks);
  const scale = key ? scaleNotes(key.tonicPc, key.scale) : [];

  const trackOption = (entry: TrackEntry) => (
    <li key={entry.index} role="presentation">
      <button type="button" role="option" aria-selected={entry.index === track} title={trackTitle(entry)} onClick={() => chooseTrack(entry.index)}>
        <TrackIcon kind={entry.kind} />
        <span className="tabplayer-track-name">
          <span>{entry.part}</span>
          {entry.detail && <small>{entry.detail}</small>}
        </span>
      </button>
    </li>
  );

  return (
    <div className="tabplayer">
      <div className="tabplayer-progress" onClick={seekTo} title="Нажми, чтобы перейти к этому месту">
        <div className="tabplayer-progress-fill" ref={progressFill} />
        {sections.map((section, index) => (
          <span
            key={`${section.name}:${section.start}`}
            className="tabplayer-section"
            data-current={section === currentSection ? '' : undefined}
            style={{ left: `${section.start * 100}%`, width: `${((sections[index + 1]?.start ?? 1) - section.start) * 100}%` }}
          >
            {section.name}
          </span>
        ))}
      </div>

      {tracks.length > 1 && chosenTrack && (
        <div className="tabplayer-track" ref={trackPicker}>
          <button
            type="button"
            className="chip tabplayer-track-button"
            aria-haspopup="listbox"
            aria-expanded={trackMenuOpen}
            aria-label={`Дорожка: ${trackTitle(chosenTrack)}`}
            title={trackTitle(chosenTrack)}
            onClick={() => setTrackMenuOpen(!trackMenuOpen)}
          >
            <TrackIcon kind={chosenTrack.kind} />
            <span>{chosenTrack.part}</span>
            <span aria-hidden="true">▾</span>
          </button>
          {trackMenuOpen && (
            <ul className="tabplayer-track-menu" role="listbox" aria-label="Дорожка" ref={trackList}>
              {menu.guitars.map(trackOption)}
              {menu.guitars.length > 0 && menu.others.length > 0 && (
                <li className="tabplayer-track-divider" role="presentation" aria-hidden="true">
                  остальные
                </li>
              )}
              {menu.others.map(trackOption)}
            </ul>
          )}
        </div>
      )}

      <div className="tabplayer-surface" ref={surface} />
      {status === 'error' && <p className="tabplayer-note" role="alert">Не удалось загрузить табулатуру.</p>}

      <div className="tabplayer-dock">
        {neckShown && neck && (
          <div className="tabplayer-neck">
            {key && <p className="tabplayer-key" title={keyTitle(key.tonicPc, key.scale)}>{keyShortName(key)}</p>}
            <div
              className="tabplayer-neck-window"
              style={
                {
                  '--neck-width': `${neck.fretCount * NECK_PIXELS_PER_FRET}px`,
                  '--focus': fretPositionRatio(neck.focusFret, neck.fretCount),
                } as React.CSSProperties
              }
            >
              <div className="tabplayer-neck-pan">
                <Fretboard
                  dots={tabNeckDots(neck.notes, neck.tuning, scale, neckLabels)}
                  links={tabNeckLinks(neck.notes, neck.tuning)}
                  stringCount={neck.tuning.length}
                  fretCount={neck.fretCount}
                  ariaLabel="Гриф: ноты текущего такта"
                />
              </div>
            </div>
          </div>
        )}

        <div className="tabplayer-bar" role="toolbar" aria-label="Управление проигрыванием">
          <button
            type="button"
            className="tabplayer-play"
            disabled={!ready}
            aria-label={playing ? 'Пауза' : 'Играть'}
            title="Пробел"
            onClick={() => withPlayer((player) => player.playPause())}
          >
            {playing ? '❚❚' : '▶'}
          </button>
          <button type="button" className="chip" disabled={!ready} aria-label="В начало" title="Home" onClick={() => withPlayer((player) => player.stop())}>
            ◼
          </button>
          <span className="tabplayer-time" aria-live="off">
            {ready ? `${formatTime(time.current)} / ${formatTime(time.end)}` : `звук ${Math.round(soundProgress * 100)}%`}
          </span>

          <span role="group" aria-label="Скорость">
            <Segmented options={SPEEDS} value={String(speed) as (typeof SPEEDS)[number]['id']} onChange={(id) => chooseSpeed(Number(id))} />
          </span>

          <span className="tabplayer-group">
            <button type="button" className="chip chip-icon" aria-pressed={looping} aria-label="Петля" title="Петля (L)" onClick={toggleLoop}><PlayerIcon kind="loop" /></button>
            <button type="button" className="chip chip-icon" aria-pressed={metronome} aria-label="Метроном" title="Метроном (M)" onClick={toggleMetronome}><PlayerIcon kind="metronome" /></button>
            <button type="button" className="chip chip-icon" aria-pressed={countIn} aria-label="Отсчёт" title="Отсчёт перед началом (C)" onClick={toggleCountIn}><PlayerIcon kind="countIn" /></button>
          </span>

          <span role="group" aria-label="Вид">
            <Segmented options={VIEWS} value={view} onChange={chooseView} />
          </span>

          {neck && (
            <span className="tabplayer-group" role="group" aria-label="Гриф">
              <button type="button" className="chip chip-icon" aria-pressed={neckShown} aria-label="Гриф" title="Гриф (G)" onClick={() => setNeckShown(!neckShown)}><PlayerIcon kind="neck" /></button>
              {neckShown && key && <Segmented options={LABEL_MODES} value={neckLabels} onChange={setNeckLabels} />}
            </span>
          )}
        </div>
      </div>

      <p className="tabplayer-note">Нажми на ноту, чтобы играть с этого места. Выдели мышью несколько тактов и включи «петля», чтобы повторять фрагмент.</p>
      <p className="tabplayer-note tabplayer-keys">
        <kbd>Пробел</kbd> играть / пауза · <kbd>←</kbd> <kbd>→</kbd> такт назад / вперёд · <kbd>Home</kbd> в начало · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> скорость ·{' '}
        <kbd>L</kbd> петля · <kbd>M</kbd> метроном · <kbd>C</kbd> отсчёт · <kbd>G</kbd> гриф
      </p>
    </div>
  );
}
