import WebSocket, { WebSocketServer } from 'ws';
import prisma from '../lib/prisma';

interface SimulationState {
  routeId: number;
  coords: [number, number][];
  index: number;
  speedMps: number;       // meters per second
  segmentStart: number;   // timestamp
  playing: boolean;
  timer?: NodeJS.Timeout;
}

// Earth radius in meters
const EARTH_R = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

function haversine([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lerp([lon1, lat1]: [number, number], [lon2, lat2]: [number, number], t: number) {
  return [lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t] as [number, number];
}

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', ws => {
  let state: SimulationState | null = null;

  ws.on('message', async raw => {
    const { type, payload } = JSON.parse(raw.toString());

    if (type === 'start') {
      const { routeId, speed = 10 } = payload;
      const res = await prisma.$queryRawUnsafe<any>(
        `SELECT ST_AsGeoJSON(geometry)::json AS geom FROM "Route" WHERE id = $1`,
        routeId
      );

      if (!res.length) {
        return ws.send(JSON.stringify({ type: 'error', message: 'Route not found' }));
      }

      const coords = res[0].geom.coordinates as [number, number][];
      state = {
        routeId,
        coords,
        index: 0,
        speedMps: speed,
        segmentStart: Date.now(),
        playing: true,
      };

      state.timer = setInterval(() => {
        if (!state || !state.playing) return;

        const now = Date.now();
        const from = state.coords[state.index];
        const to = state.coords[state.index + 1];
        if (!to) {
          ws.send(JSON.stringify({ type: 'end' }));
          clearInterval(state!.timer);
          return;
        }

        const segmentDist = haversine(from, to);
        const segmentDur = (segmentDist / state.speedMps) * 1000;
        const elapsed = now - state.segmentStart;
        
        // Advance to next segment if complete
        if (elapsed >= segmentDur) {
          state.index++;
          state.segmentStart = now;
        }

        const t = Math.min(elapsed / segmentDur, 1);
        const pos = lerp(from, to, t);
        
        ws.send(JSON.stringify({ type: 'status', payload: { position: pos, index: state.index } }));
      }, 100);
    }

    if (type === 'pause' && state) {
      clearInterval(state.timer);
      state.playing = false;
    }

    if (type === 'reset' && state) {
      state.index = 0;
      state.segmentStart = Date.now();
      const startPos = state.coords[0];
      ws.send(JSON.stringify({ type: 'status', payload: { position: startPos, index: 0 } }));
    }
  });

  ws.on('close', () => {
    if (state?.timer) clearInterval(state.timer);
  });
});

export default wss;
