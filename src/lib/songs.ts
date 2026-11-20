import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import * as alphaTab from '@coderline/alphatab';
import { kindOfTrack } from './trackKind';
import { firstTrack } from './trackMenu';

export interface Song {
  slug: string;
  title: string;
  artist: string;
  tempo: number;
  bars: number;
  tracks: number;
  file: string;
  firstTrack: number;
}

const TAB_EXTENSIONS = new Set(['.gp', '.gpx', '.gp5', '.gp4', '.gp3']);

export function slugFromFileName(fileName: string): string {
  return basename(fileName, extname(fileName))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function readSong(folder: string, fileName: string): Song {
  try {
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(readFileSync(join(folder, fileName))));
    return {
      slug: slugFromFileName(fileName),
      title: score.title.trim() || basename(fileName, extname(fileName)),
      artist: score.artist.trim(),
      tempo: score.tempo,
      bars: score.masterBars.length,
      tracks: score.tracks.length,
      file: `/tabs/${encodeURIComponent(fileName)}`,
      firstTrack: firstTrack(score.tracks.map(kindOfTrack)),
    };
  } catch (cause) {
    throw new Error(`Не удалось прочитать табулатуру ${fileName}`, { cause });
  }
}

export function loadSongs(folder: string): Song[] {
  if (!existsSync(folder)) return [];
  const songs = readdirSync(folder)
    .filter((fileName) => TAB_EXTENSIONS.has(extname(fileName).toLowerCase()))
    .map((fileName) => readSong(folder, fileName))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const repeated = songs.find((song, index) => song.slug === songs[index - 1]?.slug);
  if (repeated) throw new Error(`Два файла табулатур дают один адрес: ${repeated.slug}`);
  return songs;
}
