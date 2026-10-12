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

export default async function handler(req, res) {
  const send = (status, body, cache = 'no-store') => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', cache);
    res.end(JSON.stringify(body));
  };

  const { LASTFM_API_KEY: apiKey, LASTFM_USER: user } = process.env;
  if (!apiKey || !user) return send(503, { error: 'last.fm is not configured' });

  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user,
    api_key: apiKey,
    format: 'json',
    limit: '1',
  });

  try {
    const response = await fetch(`${ENDPOINT}?${params}`);
    const data = await response.json();
    if (!response.ok || data.error) {
      return send(502, { error: data.message || `last.fm responded ${response.status}` });
    }

    const raw = data.recenttracks?.track;
    const track = Array.isArray(raw) ? raw[0] : raw;
    if (!track) return send(200, { track: null }, 'public, s-maxage=30');

    const art = track.image?.find((img) => img.size === 'large')?.['#text'] || '';

    // Edge-cache briefly: fresh enough for "live", gentle on last.fm's rate limit
    send(200, {
      track: {
        name: track.name,
        artist: track.artist?.['#text'] ?? track.artist?.name ?? '',
        album: track.album?.['#text'] ?? '',
        art: art.includes(PLACEHOLDER_ART) ? '' : art,
        nowPlaying: track['@attr']?.nowplaying === 'true',
        playedAt: track.date?.uts ? Number(track.date.uts) * 1000 : null,
      },
    }, 'public, s-maxage=20, stale-while-revalidate=40');
  } catch (err) {
    send(502, { error: 'Could not reach last.fm' });
  }
}
