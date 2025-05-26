import WebSocket, { WebSocketServer } from 'ws';
import prisma from '../lib/prisma';

interface SimulationRoom {
  routeId: number;
  coords: [number, number][];
  index: number;
  speedMps: number;
  segmentStart: number;
  playing: boolean;
  timer?: NodeJS.Timeout;
  subscribers: Set<WebSocket>;
  createdAt: number;
}

interface ClientConnection {
  ws: WebSocket;
  currentRoomId?: number;
}

// Global state for simulation rooms
const simulationRooms = new Map<number, SimulationRoom>(); // routeId -> SimulationRoom
const connections = new Set<ClientConnection>();

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

function broadcastToRoom(room: SimulationRoom, message: any) {
  const messageString = JSON.stringify(message);
  room.subscribers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageString);
    }
  });
}

function cleanupRoom(routeId: number) {
  const room = simulationRooms.get(routeId);
  if (room) {
    if (room.timer) {
      clearInterval(room.timer);
    }
    simulationRooms.delete(routeId);
    console.log(`Cleaned up simulation room for route ${routeId}`);
  }
}

function removeClientFromRoom(client: ClientConnection) {
  if (client.currentRoomId) {
    const room = simulationRooms.get(client.currentRoomId);
    if (room) {
      room.subscribers.delete(client.ws);
      
      // If no more subscribers, clean up the room after a delay
      if (room.subscribers.size === 0) {
        setTimeout(() => {
          const currentRoom = simulationRooms.get(client.currentRoomId!);
          if (currentRoom && currentRoom.subscribers.size === 0) {
            cleanupRoom(client.currentRoomId!);
          }
        }, 30000); // 30 second grace period
      }
    }
    client.currentRoomId = undefined;
  }
}

async function createOrJoinRoom(routeId: number, speed: number = 10): Promise<SimulationRoom | null> {
  // If room already exists for this route, return it
  let room = simulationRooms.get(routeId);
  if (room) {
    return room;
  }

  // Create new room - fetch route data
  const res = await prisma.$queryRawUnsafe<any>(
    `SELECT ST_AsGeoJSON(geometry)::json AS geom FROM "Route" WHERE id = $1`,
    routeId
  );

  if (!res.length) {
    return null;
  }

  const coords = res[0].geom.coordinates as [number, number][];
  
  room = {
    routeId,
    coords,
    index: 0,
    speedMps: speed,
    segmentStart: Date.now(),
    playing: false,
    subscribers: new Set(),
    createdAt: Date.now()
  };

  simulationRooms.set(routeId, room);
  console.log(`Created simulation room for route ${routeId}`);
  return room;
}

function startSimulation(room: SimulationRoom) {
  if (room.timer) {
    clearInterval(room.timer);
  }

  room.playing = true;
  room.segmentStart = Date.now();

  room.timer = setInterval(() => {
    if (!room.playing) return;
    
    const now = Date.now();
    let from = room.coords[room.index];
    let to = room.coords[room.index + 1];
    
    if (!to) {
      broadcastToRoom(room, { type: 'end' });
      clearInterval(room.timer!);
      room.playing = false;
      return;
    }
    
    let segmentDist = haversine(from, to);
    let segmentDur = (segmentDist / room.speedMps) * 1000;
    let elapsed = now - room.segmentStart;
    
    // Advance to next segment if complete
    if (elapsed >= segmentDur) {
      room.index++;
      room.segmentStart = now;
      
      // Recalculate for the new segment
      from = room.coords[room.index];
      to = room.coords[room.index + 1];
      
      if (!to) {
        broadcastToRoom(room, { type: 'end' });
        clearInterval(room.timer!);
        room.playing = false;
        return;
      }
      
      segmentDist = haversine(from, to);
      segmentDur = (segmentDist / room.speedMps) * 1000;
      elapsed = now - room.segmentStart;
    }
    
    const t = Math.min(elapsed / segmentDur, 1);
    const pos = lerp(from, to, t);
    
    broadcastToRoom(room, { 
      type: 'status', 
      payload: { 
        position: pos, 
        index: room.index,
        subscribers: room.subscribers.size,
        playing: room.playing
      } 
    });
  }, 100);
}

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', ws => {
  const client: ClientConnection = { ws };
  connections.add(client);

  // Send welcome message with active rooms info
  const activeRooms = Array.from(simulationRooms.entries()).map(([routeId, room]) => ({
    routeId,
    subscribers: room.subscribers.size,
    playing: room.playing,
    index: room.index
  }));
  
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    payload: { activeRooms } 
  }));

  ws.on('message', async raw => {
    try {
      const { type, payload } = JSON.parse(raw.toString());

      if (type === 'join') {
        const { routeId, speed = 10 } = payload;
        
        // Leave current room if any
        removeClientFromRoom(client);
        
        // Create or join room
        const room = await createOrJoinRoom(routeId, speed);
        if (!room) {
          return ws.send(JSON.stringify({ type: 'error', message: 'Route not found' }));
        }

        // Add client to room
        room.subscribers.add(ws);
        client.currentRoomId = routeId;

        // Send current state to new subscriber
        const currentPos = room.coords[room.index] || room.coords[0];
        ws.send(JSON.stringify({ 
          type: 'joined', 
          payload: { 
            routeId,
            position: currentPos, 
            index: room.index,
            playing: room.playing,
            subscribers: room.subscribers.size
          } 
        }));

        // Notify all subscribers about new join
        broadcastToRoom(room, { 
          type: 'subscriber_update', 
          payload: { subscribers: room.subscribers.size } 
        });
      }

      if (type === 'start' && client.currentRoomId) {
        const room = simulationRooms.get(client.currentRoomId);
        if (room && !room.playing) {
          startSimulation(room);
          broadcastToRoom(room, { 
            type: 'started', 
            payload: { playing: true, startedBy: 'user' } 
          });
        }
      }

      if (type === 'pause' && client.currentRoomId) {
        const room = simulationRooms.get(client.currentRoomId);
        if (room && room.playing) {
          room.playing = false;
          if (room.timer) {
            clearInterval(room.timer);
          }
          broadcastToRoom(room, { 
            type: 'paused', 
            payload: { playing: false, pausedBy: 'user' } 
          });
        }
      }

      if (type === 'reset' && client.currentRoomId) {
        const room = simulationRooms.get(client.currentRoomId);
        if (room) {
          room.playing = false;
          if (room.timer) {
            clearInterval(room.timer);
          }
          room.index = 0;
          room.segmentStart = Date.now();
          
          const startPos = room.coords[0];
          broadcastToRoom(room, { 
            type: 'reset', 
            payload: { 
              position: startPos, 
              index: 0, 
              playing: false,
              resetBy: 'user'
            } 
          });
        }
      }

      if (type === 'speed_change' && client.currentRoomId) {
        const { speed } = payload;
        const room = simulationRooms.get(client.currentRoomId);
        if (room && speed > 0) {
          room.speedMps = speed;
          broadcastToRoom(room, { 
            type: 'speed_changed', 
            payload: { speed, changedBy: 'user' } 
          });
        }
      }

      if (type === 'leave') {
        removeClientFromRoom(client);
        ws.send(JSON.stringify({ type: 'left' }));
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    removeClientFromRoom(client);
    connections.delete(client);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    removeClientFromRoom(client);
    connections.delete(client);
  });
});

// Cleanup old rooms periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  simulationRooms.forEach((room, routeId) => {
    if (room.subscribers.size === 0 && (now - room.createdAt) > maxAge) {
      cleanupRoom(routeId);
    }
  });
}, 60 * 60 * 1000); // Check every hour

export default wss;