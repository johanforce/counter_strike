import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

interface PlayerState {
  id: string;
  name: string;
  roomCode: string;
  team: 'red' | 'blue';
  slot: number; // 0, 1, 2, 3
  isBot: boolean;
  x: number;
  y: number;
  z: number;
  rotY: number;
  pitch: number;
  health: number;
  kills: number;
  deaths: number;
  weapon: 'ak47' | 'pistol' | 'knife';
  isAlive: boolean;
  ping: number;
  lastActive: number;
}

interface Room {
  code: string;
  hostId: string;
  mode: '1v1' | '2v2';
  state: 'waiting' | 'playing' | 'round_end';
  redScore: number;
  blueScore: number;
  round: number;
  maxRounds: number;
  players: Map<string, PlayerState>;
  wsClients: Map<string, WebSocket>;
  roundTimeLeft: number;
  lastTick: number;
}

const rooms = new Map<string, Room>();

// Helper to remove any disconnected or dead sockets from a room
function cleanStaleRoomPlayers(room: Room) {
  const toDelete: string[] = [];
  room.players.forEach((p, pId) => {
    if (p.isBot) return; // Keep bots alive!
    const clientWs = room.wsClients.get(pId);
    if (!clientWs || clientWs.readyState === WebSocket.CLOSED || clientWs.readyState === WebSocket.CLOSING) {
      toDelete.push(pId);
    }
  });

  toDelete.forEach(pId => {
    room.players.delete(pId);
    room.wsClients.delete(pId);
  });

  // Check if any human players remain
  let humanCount = 0;
  for (const [, p] of room.players) {
    if (!p.isBot) humanCount++;
  }

  // If no humans left, clean up bots and reset room
  if (humanCount === 0) {
    room.players.clear();
    room.wsClients.clear();
    room.state = 'waiting';
    room.redScore = 0;
    room.blueScore = 0;
    room.round = 1;
    room.hostId = '';
    return;
  }

  // Ensure room has an active human host
  const hostPlayer = room.players.get(room.hostId);
  if (!hostPlayer || hostPlayer.isBot) {
    for (const [id, p] of room.players) {
      if (!p.isBot) {
        room.hostId = id;
        break;
      }
    }
  }
}

// REST API for active room discovery and existence checking
app.get('/api/rooms', (_req, res) => {
  const activeRooms: any[] = [];
  rooms.forEach((r, code) => {
    cleanStaleRoomPlayers(r);
    if (r.players.size === 0) {
      // Room has no active players, ignore or clean up
      return;
    }

    let redCount = 0;
    let blueCount = 0;
    r.players.forEach(p => {
      if (p.team === 'red') redCount++;
      else blueCount++;
    });
    const maxPlayers = r.mode === '1v1' ? 2 : 4;
    const hostPlayer = r.players.get(r.hostId);
    activeRooms.push({
      code: r.code,
      mode: r.mode,
      state: r.state,
      playerCount: r.players.size,
      maxPlayers,
      redCount,
      blueCount,
      hostName: hostPlayer?.name || 'Chủ phòng',
      isFull: r.players.size >= maxPlayers
    });
  });
  res.json({ rooms: activeRooms });
});

app.get('/api/rooms/:code', (req, res) => {
  const code = (req.params.code || '').trim().toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false, message: `Không tìm thấy phòng với mã "${code}".` });
  }

  cleanStaleRoomPlayers(room);

  let redCount = 0;
  let blueCount = 0;
  room.players.forEach(p => {
    if (p.team === 'red') redCount++;
    else blueCount++;
  });

  const maxPlayers = room.mode === '1v1' ? 2 : 4;
  const hostPlayer = room.players.get(room.hostId);

  return res.json({
    exists: true,
    code: room.code,
    mode: room.mode,
    state: room.state,
    playerCount: room.players.size,
    maxPlayers,
    redCount,
    blueCount,
    isFull: room.players.size >= maxPlayers,
    isPlaying: room.state !== 'waiting',
    hostName: hostPlayer?.name || 'Chủ phòng'
  });
});

const SPAWN_POINTS = {
  red: [
    { x: -28, y: 1.6, z: -28, rotY: -3 * Math.PI / 4 },
    { x: -32, y: 1.6, z: -24, rotY: -3 * Math.PI / 4 }
  ],
  blue: [
    { x: 28, y: 1.6, z: 28, rotY: Math.PI / 4 },
    { x: 24, y: 1.6, z: 32, rotY: Math.PI / 4 }
  ]
};

function getSpawn(team: 'red' | 'blue', slot: number) {
  const list = SPAWN_POINTS[team];
  const idx = slot % list.length;
  return list[idx];
}

function broadcastToRoom(room: Room, msg: object, exceptId?: string) {
  const data = JSON.stringify(msg);
  room.wsClients.forEach((client, playerId) => {
    if (playerId !== exceptId && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function getRoomSnapshot(room: Room) {
  const players: PlayerState[] = [];
  room.players.forEach(p => players.push({ ...p }));
  return {
    code: room.code,
    hostId: room.hostId,
    mode: room.mode,
    state: room.state,
    redScore: room.redScore,
    blueScore: room.blueScore,
    round: room.round,
    maxRounds: room.maxRounds,
    roundTimeLeft: room.roundTimeLeft,
    players
  };
}

function startNewRound(room: Room) {
  room.round += 1;
  room.state = 'playing';
  room.roundTimeLeft = 90; // 90 seconds round

  room.players.forEach((p, id) => {
    p.health = 100;
    p.isAlive = true;
    const spawn = getSpawn(p.team, p.slot);
    p.x = spawn.x;
    p.y = spawn.y;
    p.z = spawn.z;
    p.rotY = spawn.rotY;
    p.pitch = 0;
  });

  broadcastToRoom(room, {
    type: 'round_started',
    room: getRoomSnapshot(room)
  });
}

function checkRoundStatus(room: Room) {
  if (room.state !== 'playing') return;

  let redAlive = 0;
  let blueAlive = 0;
  let redTotal = 0;
  let blueTotal = 0;

  room.players.forEach(p => {
    if (p.team === 'red') {
      redTotal++;
      if (p.isAlive) redAlive++;
    } else {
      blueTotal++;
      if (p.isAlive) blueAlive++;
    }
  });

  // Only evaluate win condition if there are players on both teams
  if (redTotal > 0 && blueTotal > 0) {
    if (redAlive === 0) {
      room.blueScore++;
      room.state = 'round_end';
      broadcastToRoom(room, {
        type: 'round_ended',
        winner: 'blue',
        reason: 'Đội Xanh tiêu diệt toàn bộ đối thủ!',
        room: getRoomSnapshot(room)
      });
      setTimeout(() => {
        if (rooms.has(room.code)) {
          startNewRound(room);
        }
      }, 4000);
      return;
    } else if (blueAlive === 0) {
      room.redScore++;
      room.state = 'round_end';
      broadcastToRoom(room, {
        type: 'round_ended',
        winner: 'red',
        reason: 'Đội Đỏ tiêu diệt toàn bộ đối thủ!',
        room: getRoomSnapshot(room)
      });
      setTimeout(() => {
        if (rooms.has(room.code)) {
          startNewRound(room);
        }
      }, 4000);
      return;
    }
  }

  if (room.roundTimeLeft <= 0) {
    room.state = 'round_end';
    let winner = 'draw';
    if (redAlive > blueAlive) {
      room.redScore++;
      winner = 'red';
    } else if (blueAlive > redAlive) {
      room.blueScore++;
      winner = 'blue';
    }
    broadcastToRoom(room, {
      type: 'round_ended',
      winner,
      reason: 'Hết giờ thi đấu!',
      room: getRoomSnapshot(room)
    });
    setTimeout(() => {
      if (rooms.has(room.code)) {
        startNewRound(room);
      }
    }, 4000);
  }
}

// Server game tick (1 Hz for timer, 30 Hz for movement broadcasts)
setInterval(() => {
  rooms.forEach(room => {
    cleanStaleRoomPlayers(room);
    if (room.state === 'playing') {
      room.roundTimeLeft = Math.max(0, room.roundTimeLeft - 1);
      if (room.roundTimeLeft === 0) {
        checkRoundStatus(room);
      }
    }
  });
}, 1000);

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode = '';
  let currentPlayerId = '';

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const type = data.type;

      if (type === 'join_room') {
        const { roomCode, playerName, mode, preferredTeam, isJoinOnly } = data;
        const normalizedCode = (roomCode || '').toString().trim().toUpperCase();

        if (!normalizedCode) {
          ws.send(JSON.stringify({ type: 'error', message: 'Vui lòng nhập mã phòng hợp lệ!' }));
          return;
        }

        let room = rooms.get(normalizedCode);
        const playerId = data.playerId || 'player_' + Math.random().toString(36).substring(2, 8);
        currentPlayerId = playerId;
        currentRoomCode = normalizedCode;

        if (room) {
          cleanStaleRoomPlayers(room);
        }

        if (isJoinOnly && (!room || room.players.size === 0)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Không tìm thấy phòng với mã "${normalizedCode}". Vui lòng kiểm tra lại mã hoặc tạo phòng mới!`
          }));
          return;
        }

        if (room && isJoinOnly && room.state !== 'waiting') {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Phòng "${normalizedCode}" đang diễn ra trận đấu! Không thể tham gia lúc này.`
          }));
          return;
        }

        if (!room) {
          room = {
            code: normalizedCode,
            hostId: playerId,
            mode: mode || '1v1',
            state: 'waiting',
            redScore: 0,
            blueScore: 0,
            round: 1,
            maxRounds: 10,
            players: new Map(),
            wsClients: new Map(),
            roundTimeLeft: 90,
            lastTick: Date.now()
          };
          rooms.set(normalizedCode, room);
        } else if (room.players.size === 0) {
          // Re-initialize empty room
          room.hostId = playerId;
          room.mode = mode || room.mode || '1v1';
          room.state = 'waiting';
          room.redScore = 0;
          room.blueScore = 0;
          room.round = 1;
        }

        // If player already in room (reconnect or tab switch)
        if (room.players.has(playerId)) {
          const existingPlayer = room.players.get(playerId)!;
          if (playerName) existingPlayer.name = playerName;
          room.wsClients.set(playerId, ws);

          if (!room.hostId || !room.players.has(room.hostId)) {
            room.hostId = playerId;
          }

          ws.send(JSON.stringify({
            type: 'joined_room',
            playerId,
            player: existingPlayer,
            room: getRoomSnapshot(room)
          }));

          broadcastToRoom(room, {
            type: 'player_updated',
            player: existingPlayer,
            room: getRoomSnapshot(room)
          }, playerId);
          return;
        }

        // If no active host in room, set this player as host
        if (!room.hostId || !room.players.has(room.hostId)) {
          room.hostId = playerId;
        }

        const maxPlayers = room.mode === '1v1' ? 2 : 4;
        if (room.players.size >= maxPlayers) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Phòng "${normalizedCode}" đã đủ ${maxPlayers} người chơi!`
          }));
          return;
        }

        // Determine team and slot with per-team capacity limit
        const maxPerTeam = room.mode === '1v1' ? 1 : 2;
        let redCount = 0;
        let blueCount = 0;
        room.players.forEach(p => {
          if (p.team === 'red') redCount++;
          else blueCount++;
        });

        let team: 'red' | 'blue' = 'red';
        if (preferredTeam === 'blue' && blueCount < maxPerTeam) {
          team = 'blue';
        } else if (preferredTeam === 'red' && redCount < maxPerTeam) {
          team = 'red';
        } else if (redCount < maxPerTeam) {
          team = 'red';
        } else if (blueCount < maxPerTeam) {
          team = 'blue';
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Phòng "${normalizedCode}" đã đủ người chơi ở cả hai đội!`
          }));
          return;
        }

        const slot = team === 'red' ? redCount : blueCount;
        const spawn = getSpawn(team, slot);

        const player: PlayerState = {
          id: playerId,
          name: playerName || `TaySúng_${Math.floor(Math.random() * 900 + 100)}`,
          roomCode: normalizedCode,
          team,
          slot,
          isBot: false,
          x: spawn.x,
          y: spawn.y,
          z: spawn.z,
          rotY: spawn.rotY,
          pitch: 0,
          health: 100,
          kills: 0,
          deaths: 0,
          weapon: 'ak47',
          isAlive: true,
          ping: 15,
          lastActive: Date.now()
        };

        room.players.set(playerId, player);
        room.wsClients.set(playerId, ws);

        ws.send(JSON.stringify({
          type: 'joined_room',
          playerId,
          player,
          room: getRoomSnapshot(room)
        }));

        broadcastToRoom(room, {
          type: 'player_joined',
          player,
          room: getRoomSnapshot(room)
        }, playerId);
      }

      else if (type === 'switch_team') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const p = room.players.get(currentPlayerId);
        if (!p) return;

        const maxPerTeam = room.mode === '1v1' ? 1 : 2;
        const targetTeam = data.team === 'blue' ? 'blue' : 'red';
        let count = 0;
        room.players.forEach(other => {
          if (other.id !== p.id && other.team === targetTeam) count++;
        });

        if (count < maxPerTeam) {
          p.team = targetTeam;
          p.slot = count;
          const spawn = getSpawn(p.team, p.slot);
          p.x = spawn.x;
          p.y = spawn.y;
          p.z = spawn.z;
          p.rotY = spawn.rotY;

          broadcastToRoom(room, {
            type: 'player_updated',
            player: p,
            room: getRoomSnapshot(room)
          });
        }
      }

      else if (type === 'start_match') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        if (room.hostId !== currentPlayerId) {
          ws.send(JSON.stringify({ type: 'error', message: 'Chỉ chủ phòng mới có quyền bắt đầu trận đấu!' }));
          return;
        }

        // Auto-fill bots for empty slots to ensure both teams have combatants
        const targetPerTeam = room.mode === '1v1' ? 1 : 2;
        let redCount = 0;
        let blueCount = 0;
        room.players.forEach(p => {
          if (p.team === 'red') redCount++;
          else blueCount++;
        });

        const botNames = ['Shadow', 'Viper', 'Ghost', 'Raptor', 'Blaze', 'Striker', 'Titan', 'Apex'];
        let nameIdx = 0;

        // Auto-fill Red team bots if missing
        while (redCount < targetPerTeam) {
          const botId = 'bot_red_' + Math.random().toString(36).substring(2, 7);
          const spawn = getSpawn('red', redCount);
          const botPlayer: PlayerState = {
            id: botId,
            name: `${botNames[nameIdx++ % botNames.length]} [BOT]`,
            roomCode: room.code,
            team: 'red',
            slot: redCount,
            isBot: true,
            x: spawn.x,
            y: spawn.y,
            z: spawn.z,
            rotY: spawn.rotY,
            pitch: 0,
            health: 100,
            kills: 0,
            deaths: 0,
            weapon: 'ak47',
            isAlive: true,
            ping: 0,
            lastActive: Date.now()
          };
          room.players.set(botId, botPlayer);
          redCount++;
        }

        // Auto-fill Blue team bots if missing
        while (blueCount < targetPerTeam) {
          const botId = 'bot_blue_' + Math.random().toString(36).substring(2, 7);
          const spawn = getSpawn('blue', blueCount);
          const botPlayer: PlayerState = {
            id: botId,
            name: `${botNames[nameIdx++ % botNames.length]} [BOT]`,
            roomCode: room.code,
            team: 'blue',
            slot: blueCount,
            isBot: true,
            x: spawn.x,
            y: spawn.y,
            z: spawn.z,
            rotY: spawn.rotY,
            pitch: 0,
            health: 100,
            kills: 0,
            deaths: 0,
            weapon: 'ak47',
            isAlive: true,
            ping: 0,
            lastActive: Date.now()
          };
          room.players.set(botId, botPlayer);
          blueCount++;
        }

        room.state = 'playing';
        room.roundTimeLeft = 90;
        startNewRound(room);

        broadcastToRoom(room, {
          type: 'match_started',
          room: getRoomSnapshot(room)
        });
      }

      else if (type === 'request_sync') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        ws.send(JSON.stringify({
          type: 'room_sync',
          room: getRoomSnapshot(room)
        }));
      }

      else if (type === 'player_move') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const p = room.players.get(currentPlayerId);
        if (!p) return;

        p.x = data.x;
        p.y = data.y;
        p.z = data.z;
        p.rotY = data.rotY;
        p.pitch = data.pitch;
        p.weapon = data.weapon || p.weapon;
        p.lastActive = Date.now();

        // Broadcast move update to opponents and teammates with team & name info
        broadcastToRoom(room, {
          type: 'player_moved',
          id: p.id,
          team: p.team,
          name: p.name,
          x: p.x,
          y: p.y,
          z: p.z,
          rotY: p.rotY,
          pitch: p.pitch,
          weapon: p.weapon
        }, currentPlayerId);
      }

      else if (type === 'player_shoot') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const shooterId = data.shooterId || currentPlayerId;
        const p = room.players.get(shooterId);
        if (!p || !p.isAlive) return;

        broadcastToRoom(room, {
          type: 'player_shot',
          shooterId: p.id,
          weapon: data.weapon,
          origin: data.origin,
          direction: data.direction,
          hitPoint: data.hitPoint
        }, currentPlayerId);
      }

      else if (type === 'hit_damage') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const target = room.players.get(data.targetId);
        const attacker = room.players.get(currentPlayerId);
        if (!target || !target.isAlive) return;

        const rawDamage = Math.max(1, data.damage || 25);
        const damage = Math.max(1, Math.round(rawDamage));
        const isHeadshot = !!data.isHeadshot;
        target.health = Math.max(0, target.health - damage);

        if (target.health === 0) {
          target.isAlive = false;
          target.deaths++;
          if (attacker) attacker.kills++;

          broadcastToRoom(room, {
            type: 'player_killed',
            killerId: attacker?.id,
            killerName: attacker?.name || 'Vô danh',
            killerTeam: attacker?.team,
            victimId: target.id,
            victimName: target.name,
            victimTeam: target.team,
            weapon: data.weapon,
            isHeadshot,
            room: getRoomSnapshot(room)
          });

          checkRoundStatus(room);
        } else {
          broadcastToRoom(room, {
            type: 'player_damaged',
            targetId: target.id,
            attackerId: attacker?.id,
            damage,
            health: target.health,
            isHeadshot
          });
        }
      }

      else if (type === 'add_bot') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const maxPerTeam = room.mode === '1v1' ? 1 : 2;
        let redCount = 0;
        let blueCount = 0;
        room.players.forEach(p => { if (p.team === 'red') redCount++; else blueCount++; });

        const team = data.team || (redCount <= blueCount ? 'red' : 'blue');
        const currentTeamCount = team === 'red' ? redCount : blueCount;
        if (currentTeamCount >= maxPerTeam) {
          ws.send(JSON.stringify({ type: 'error', message: `Đội ${team === 'red' ? 'Đỏ' : 'Xanh'} đã đủ người chơi!` }));
          return;
        }

        const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
        const spawn = getSpawn(team, currentTeamCount);

        const botNames = ['Shadow', 'Viper', 'Ghost', 'Raptor', 'Blaze', 'Striker', 'Titan', 'Apex'];
        const randomName = botNames[Math.floor(Math.random() * botNames.length)] + ' [BOT]';

        const botPlayer: PlayerState = {
          id: botId,
          name: randomName,
          roomCode: room.code,
          team,
          slot: currentTeamCount,
          isBot: true,
          x: spawn.x,
          y: spawn.y,
          z: spawn.z,
          rotY: spawn.rotY,
          pitch: 0,
          health: 100,
          kills: 0,
          deaths: 0,
          weapon: 'ak47',
          isAlive: true,
          ping: 0,
          lastActive: Date.now()
        };

        room.players.set(botId, botPlayer);
        broadcastToRoom(room, {
          type: 'player_joined',
          player: botPlayer,
          room: getRoomSnapshot(room)
        });
      }

      else if (type === 'sync_bot') {
        // Client commanding a bot position and action
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const bot = room.players.get(data.botId);
        if (bot && bot.isBot) {
          bot.x = data.x;
          bot.y = data.y;
          bot.z = data.z;
          bot.rotY = data.rotY;
          bot.pitch = data.pitch;
          bot.weapon = data.weapon;

          broadcastToRoom(room, {
            type: 'player_moved',
            id: bot.id,
            x: bot.x,
            y: bot.y,
            z: bot.z,
            rotY: bot.rotY,
            pitch: bot.pitch,
            weapon: bot.weapon
          }, currentPlayerId);
        }
      }

      else if (type === 'chat_message') {
        const room = rooms.get(currentRoomCode);
        if (!room) return;
        const player = room.players.get(currentPlayerId);
        if (!player) return;

        const rawText = (data.text || '').trim();
        if (!rawText) return;

        const isAll = rawText.toLowerCase().startsWith('/all ') || rawText.toLowerCase() === '/all';
        const cleanText = isAll ? rawText.replace(/^\/all\s*/i, '').trim() : rawText;
        if (!cleanText) return;

        const chatPayload = {
          type: 'chat_message',
          id: 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          senderId: player.id,
          senderName: player.name,
          team: player.team,
          channel: isAll ? 'all' : 'team',
          text: cleanText,
          timestamp: Date.now()
        };

        const jsonStr = JSON.stringify(chatPayload);
        room.wsClients.forEach((client, pId) => {
          if (client.readyState === WebSocket.OPEN) {
            if (isAll) {
              client.send(jsonStr);
            } else {
              // Only send to same team
              const targetPlayer = room.players.get(pId);
              if (targetPlayer && targetPlayer.team === player.team) {
                client.send(jsonStr);
              }
            }
          }
        });
      }

      else if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', time: data.time }));
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(currentPlayerId);
        room.wsClients.delete(currentPlayerId);

        if (room.hostId === currentPlayerId && room.players.size > 0) {
          const nextHost = room.players.keys().next().value;
          if (nextHost) {
            room.hostId = nextHost;
          }
        }

        broadcastToRoom(room, {
          type: 'player_left',
          playerId: currentPlayerId,
          room: getRoomSnapshot(room)
        });

        // If room is empty, clean up after 1 minute
        if (room.players.size === 0) {
          setTimeout(() => {
            if (room.players.size === 0) {
              rooms.delete(currentRoomCode);
            }
          }, 60000);
        }
      }
    }
  });
});

// Production / Dev Vite mounting
const isProduction = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function start() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Strike Classic 3D] Server running at http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
