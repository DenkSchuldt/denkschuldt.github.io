// Centralized, easily-editable metadata for the phone's denkOS lock screen.
// Poetry is intentionally excluded from this file — it has its own source of
// truth (see poems.ts / usePoems.ts) and must never be duplicated here.

export interface NowPlayingTrack {
  title: string;
  artist: string;
  url: string;
}

// Static "Now Playing" metadata. No music playback exists in this project,
// so the Music notification is purely atmospheric — swap these values (or
// later wire this up to a real Now Playing source) without touching the
// lock screen UI, which only ever reads this shape. Tapping the notification
// opens `url` in a new tab.
export const NOW_PLAYING_TRACK: NowPlayingTrack = {
  title: "Stranger in Moscow",
  artist: "Michael Jackson",
  url: "https://music.apple.com/ec/playlist/favs-michael-jackson/pl.u-AkAmmGeu2LaLd0N?l=en",
};

// The active Reality (Cinematic/Blueprint/…) lives in ../reality — it's a
// live, switchable value rather than static phone metadata.
