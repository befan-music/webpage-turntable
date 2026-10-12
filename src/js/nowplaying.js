/**
 * "Now playing" corner on the turntable — the most recent last.fm scrobble.
 * A red dot while the song is live, otherwise "played … ago".
 * Data comes from /api/now-playing (api/now-playing.js), which holds the key.
 */

const ENDPOINT = '/api/now-playing';
const POLL_MS = 30_000;

const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 31_536_000_000],
  ['month', 2_592_000_000],
  ['week', 604_800_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

let el = null;
let last = null;
let timer = 0;

export function initNowPlaying() {
  el = {
    root: document.getElementById('now-playing'),
    art: document.getElementById('now-playing-art'),
    noArt: document.getElementById('now-playing-noart'),
    track: document.getElementById('now-playing-track'),
    artist: document.getElementById('now-playing-artist'),
    status: document.getElementById('now-playing-status'),
  };
  if (!el.root) return;

  refresh();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else refresh();
  });
}

async function refresh() {
  clearTimeout(timer);
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(response.status);
    const { track } = await response.json();
    render(track);
  } catch {
    // Not configured or last.fm is down — keep showing the last good track
    if (!last) el.root.hidden = true;
  }
  if (!document.hidden) timer = setTimeout(refresh, POLL_MS);
}

function render(track) {
  if (!track) {
    el.root.hidden = true;
    return;
  }

  // Only touch the DOM when the song changes, so aria-live doesn't chatter
  const key = `${track.name}|${track.artist}|${track.nowPlaying}`;
  if (last?.key !== key) {
    el.track.textContent = track.name;
    el.track.title = track.name;
    el.artist.textContent = track.artist;
    el.artist.title = track.artist;
    // last.fm has no cover for badly tagged scrobbles — show a vinyl instead
    showArt(track.art);
  }

  el.root.classList.toggle('is-live', track.nowPlaying);
  if (track.nowPlaying) {
    el.status.innerHTML = '<span class="now-playing__dot" aria-hidden="true"></span>Live';
  } else {
    el.status.textContent = track.playedAt ? `played ${timeAgo(track.playedAt)}` : 'recently played';
  }

  last = { key };
  el.root.hidden = false;
}

function showArt(url) {
  const setHasArt = (hasArt) => {
    el.art.hidden = !hasArt;
    el.noArt.hidden = hasArt;
  };
  if (!url) return setHasArt(false);
  el.art.onerror = () => setHasArt(false); // broken/expired image URL
  el.art.src = url;
  setHasArt(true);
}

function timeAgo(timestamp) {
  const diff = timestamp - Date.now(); // negative = in the past
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return relative.format(Math.round(diff / ms), unit);
  }
  return 'just now';
}
