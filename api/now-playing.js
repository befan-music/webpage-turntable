/**
 * GET /api/now-playing — most recent last.fm scrobble for LASTFM_USER.
 *
 * Runs as a Vercel serverless function in production and is mounted by
 * vite.config.js in dev, so the API key never ships in the client bundle.
 * Env: LASTFM_API_KEY, LASTFM_USER (Vercel project settings / .env.local).
 */

const ENDPOINT = 'https://ws.audioscrobbler.com/2.0/';
// last.fm returns this grey star image when a track has no artwork
const PLACEHOLDER_ART = '2a96cbd8b46e442fc41c2b86b821562f';
const LOOKUP_TIMEOUT_MS = 3000;

// Cover lookups per "artist|track", kept while the function instance is warm
// so the 30s polling doesn't repeat them for the same song.
const artCache = new Map();

export default async function handler(req, res) {
  const send = (status, body, cache = 'no-store') => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.end(JSON.stringify(body));
  };

  const { LASTFM_API_KEY: apiKey, LASTFM_USER: user } = process.env;
  if (!apiKey || !user) return send(503, { error: 'last.fm is not configured' });

  try {
    const data = await lastfm({ method: 'user.getrecenttracks', user, limit: '1' }, apiKey);
    if (data.error) return send(502, { error: data.message });

    const raw = data.recenttracks?.track;
    const track = Array.isArray(raw) ? raw[0] : raw;
    if (!track) return send(200, { track: null }, 'public, s-maxage=30');

    const name = track.name;
    const artist = track.artist?.['#text'] ?? track.artist?.name ?? '';
    const art = pickImage(track.image) || await findArt(artist, name, apiKey);

    // Edge-cache briefly: fresh enough for "live", gentle on last.fm's rate limit
    send(200, {
      track: {
        name,
        artist,
        album: track.album?.['#text'] ?? '',
        art,
        nowPlaying: track['@attr']?.nowplaying === 'true',
        playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : null,
      },
    }, 'public, s-maxage=20, stale-while-revalidate=40');
  } catch (err) {
    send(502, { error: 'Could not reach last.fm' });
  }
}

async function lastfm(params, apiKey) {
  const query = new URLSearchParams({ ...params, api_key: apiKey, format: 'json' });
  const response = await fetch(`${ENDPOINT}?${query}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
  const data = await response.json();
  if (!response.ok && !data.error) data.error = response.status;
  return data;
}

/** Largest real image from a last.fm image array ('' for the grey star). */
function pickImage(images) {
  const url = images?.find((img) => img.size === 'extralarge')?.['#text']
    || images?.find((img) => img.size === 'large')?.['#text']
    || '';
  return url.includes(PLACEHOLDER_ART) ? '' : url;
}

/**
 * Scrobbles often arrive without artwork (unknown album, odd tags). Try
 * last.fm's own track catalogue first, then the iTunes Search API (no key).
 */
async function findArt(artist, name, apiKey) {
  const key = `${artist}|${name}`.toLowerCase();
  if (artCache.has(key)) return artCache.get(key);

  let art = '';
  try {
    const info = await lastfm({ method: 'track.getInfo', artist, track: name, autocorrect: '1' }, apiKey);
    art = pickImage(info.track?.album?.image);
  } catch { /* fall through to iTunes */ }

  if (!art) {
    try {
      const query = new URLSearchParams({ term: `${artist} ${name}`, entity: 'song', limit: '5' });
      const response = await fetch(`https://itunes.apple.com/search?${query}`, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
      const { results = [] } = await response.json();
      // Prefer a result by the same artist; otherwise take the best text match
      const wanted = artist.toLowerCase();
      const hit = results.find((r) => r.artistName?.toLowerCase().includes(wanted)) || results[0];
      art = hit?.artworkUrl100?.replace('100x100bb', '300x300bb') || '';
    } catch { /* no cover found */ }
  }

  if (artCache.size > 200) artCache.clear();
  artCache.set(key, art);
  return art;
}
