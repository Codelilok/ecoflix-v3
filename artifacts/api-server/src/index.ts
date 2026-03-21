import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

interface PartyMember {
  id: string;
  name: string;
  ws: WebSocket;
  movieSelection?: WatchPartyMovie;
}

interface WatchPartyMovie {
  id: string;
  type: string;
  title: string;
  poster: string;
  year?: string;
  rating?: string;
}

interface PlaybackState {
  playing: boolean;
  time: number;
  updatedAt: number;
}

interface PartyState {
  code: string;
  members: PartyMember[];
  phase: "lobby" | "selecting" | "flipping" | "watching" | "done";
  movies: WatchPartyMovie[];
  currentMovieIdx: number;
  playbackState: PlaybackState | null;
}

const parties = new Map<string, PartyState>();
let clientIdCounter = 0;

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function broadcastToAll(party: PartyState, message: object): void {
  const data = JSON.stringify(message);
  for (const member of party.members) {
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(data);
    }
  }
}

function broadcastExcept(party: PartyState, message: object, excludeId: string): void {
  const data = JSON.stringify(message);
  for (const member of party.members) {
    if (member.id !== excludeId && member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(data);
    }
  }
}

function sendPartyState(party: PartyState): void {
  const safeMembers = party.members.map((m) => ({
    id: m.id,
    name: m.name,
    hasSelected: !!m.movieSelection,
  }));
  broadcastToAll(party, {
    type: "party_state",
    party: {
      code: party.code,
      members: safeMembers,
      phase: party.phase,
      currentMovieIdx: party.currentMovieIdx,
      playbackState: party.playbackState,
      movies: party.phase === "watching" || party.phase === "done" ? party.movies : [],
    },
  });
}

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/api/ws" });

wss.on("connection", (ws) => {
  const clientId = String(++clientIdCounter);
  let currentPartyCode: string | null = null;

  const send = (msg: object) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "create_party") {
        let code = generateCode();
        while (parties.has(code)) code = generateCode();
        const party: PartyState = {
          code,
          members: [{ id: clientId, name: msg.name, ws }],
          phase: "lobby",
          movies: [],
          currentMovieIdx: 0,
          playbackState: null,
        };
        parties.set(code, party);
        currentPartyCode = code;
        send({ type: "joined", partyCode: code, clientId, isHost: true });
        sendPartyState(party);
      } else if (msg.type === "join_party") {
        const party = parties.get(msg.code);
        if (!party) {
          send({ type: "error", message: "Party not found. Check the code and try again." });
          return;
        }
        if (party.members.length >= 2) {
          send({ type: "error", message: "This party is already full." });
          return;
        }
        party.members.push({ id: clientId, name: msg.name, ws });
        currentPartyCode = msg.code;
        send({ type: "joined", partyCode: msg.code, clientId, isHost: false });
        sendPartyState(party);
        if (party.members.length === 2) {
          party.phase = "selecting";
          broadcastToAll(party, { type: "phase_change", phase: "selecting" });
          sendPartyState(party);
        }
      } else if (msg.type === "select_movie" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const member = party.members.find((m) => m.id === clientId);
        if (!member) return;
        member.movieSelection = msg.movie;
        sendPartyState(party);
        const allSelected = party.members.length === 2 && party.members.every((m) => m.movieSelection);
        if (allSelected) {
          party.phase = "flipping";
          broadcastToAll(party, {
            type: "ready_to_flip",
            movies: party.members.map((m) => m.movieSelection!),
          });
          sendPartyState(party);
        }
      } else if (msg.type === "flip_result" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const isHost = party.members[0]?.id === clientId;
        if (!isHost) return;
        party.movies = msg.movies;
        party.phase = "watching";
        party.playbackState = { playing: false, time: 0, updatedAt: Date.now() };
        broadcastToAll(party, { type: "flip_result", movies: party.movies });
        sendPartyState(party);
      } else if (msg.type === "swap_movies" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const isHost = party.members[0]?.id === clientId;
        if (!isHost) return;
        party.movies = [party.movies[1], party.movies[0]];
        broadcastToAll(party, { type: "flip_result", movies: party.movies });
      } else if (msg.type === "playback" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        party.playbackState = { playing: msg.playing, time: msg.time, updatedAt: Date.now() };
        broadcastExcept(party, { type: "playback", playing: msg.playing, time: msg.time }, clientId);
      } else if (msg.type === "chat" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const member = party.members.find((m) => m.id === clientId);
        broadcastToAll(party, {
          type: "chat",
          from: member?.name || "Unknown",
          message: msg.message,
          ts: Date.now(),
        });
      } else if (msg.type === "typing" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const member = party.members.find((m) => m.id === clientId);
        broadcastExcept(party, { type: "typing", from: member?.name, isTyping: msg.isTyping }, clientId);
      } else if (msg.type === "next_movie" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        const isHost = party.members[0]?.id === clientId;
        if (!isHost) return;
        if (party.currentMovieIdx < party.movies.length - 1) {
          party.currentMovieIdx++;
          party.playbackState = { playing: false, time: 0, updatedAt: Date.now() };
          broadcastToAll(party, {
            type: "next_movie",
            movieIdx: party.currentMovieIdx,
            movie: party.movies[party.currentMovieIdx],
          });
          sendPartyState(party);
        } else {
          party.phase = "done";
          sendPartyState(party);
        }
      } else if (msg.type === "start_watching" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        party.phase = "watching";
        if (!party.playbackState) {
          party.playbackState = { playing: false, time: 0, updatedAt: Date.now() };
        }
        sendPartyState(party);
      } else if (msg.type === "end_party" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (!party) return;
        party.phase = "done";
        sendPartyState(party);
      } else if (msg.type === "leave_party" && currentPartyCode) {
        const party = parties.get(currentPartyCode);
        if (party) {
          party.members = party.members.filter((m) => m.id !== clientId);
          if (party.members.length === 0) {
            parties.delete(currentPartyCode);
          } else {
            broadcastToAll(party, { type: "member_left" });
            if (party.phase === "selecting" || party.phase === "flipping") {
              party.phase = "lobby";
            }
            sendPartyState(party);
          }
        }
        currentPartyCode = null;
      }
    } catch (e) {
      logger.error(e, "WebSocket message error");
    }
  });

  ws.on("close", () => {
    if (!currentPartyCode) return;
    const party = parties.get(currentPartyCode);
    if (!party) return;
    party.members = party.members.filter((m) => m.id !== clientId);
    if (party.members.length === 0) {
      parties.delete(currentPartyCode);
    } else {
      broadcastToAll(party, { type: "member_left" });
      if (party.phase === "selecting" || party.phase === "flipping") {
        party.phase = "lobby";
      }
      sendPartyState(party);
    }
  });
});

server.listen(port, () => {
  logger.info({ port }, "Server listening with WebSocket support");
});
