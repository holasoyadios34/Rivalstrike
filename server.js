const express = require('express');
const app = express();
app.use(express.json());

let players = {};
const MAX_PLAYERS = 6;
const INACTIVE_TIMEOUT = 12 * 60 * 1000; // 12 minutes in milliseconds

app.post('/update', (req, res) => {
    const { id, x, y, z, yaw, shooting, targetHit } = req.body;
    const now = Date.now();

    // Kick player if room is full and this is a new player
    if (!players[id] && Object.keys(players).length >= MAX_PLAYERS) {
        return res.status(403).json({ error: "ROOM_FULL" });
    }

    // Clean up inactive players (12+ minutes)
    for (let playerId in players) {
        if (now - players[playerId].lastSeen > INACTIVE_TIMEOUT) {
            delete players[playerId];
        }
    }

    // Initialize new player join timestamp
    if (!players[id]) {
        players[id] = { kills: 0, joinedAt: now };
    }

    // Handle Kills / Hits
    if (targetHit && players[targetHit]) {
        players[id].kills = (players[id].kills || 0) + 1;
        delete players[targetHit];
    }

    // Update player position and activity timestamp
    players[id] = {
        ...players[id],
        x, y, z, yaw,
        shooting: shooting || false,
        lastSeen: now
    };

    res.json(players);
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server listening on port ${port}`));