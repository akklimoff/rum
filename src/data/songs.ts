import { loadSongs } from '../lib/songs';

export type { Song } from '../lib/songs';

export const SONGS = loadSongs('public/tabs');
