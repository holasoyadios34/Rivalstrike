const express = require('express');
const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

let players = {};
const MAX_PLAYERS = 6;
const INACTIVE_TIMEOUT = 12 * 60 * 1000;
const DAMAGE_MAP = { 1: 8, 2: 19, 3: 91 };

app.post('/update', (req, res) => {
    const { id, x, y, z, yaw, shooting, targetHit, weaponUsed } = req.body;
    const now = Date.now();

    if (!players[id] && Object.keys(players).length >= MAX_PLAYERS) {
        return res.status(403).json({ error: "ROOM_FULL" });
    }

    for (let playerId in players) {
        if (now - players[playerId].lastSeen > INACTIVE_TIMEOUT) {
            delete players[playerId];
        }
    }

    if (!players[id]) {
        players[id] = { kills: 0, hp: 100, isShielded: false, shieldUntil: 0 };
    }

    if (players[id].isShielded && now > players[id].shieldUntil) {
        players[id].isShielded = false;
    }

    if (targetHit && players[targetHit]) {
        const victim = players[targetHit];
        if (!victim.isShielded) {
            const damage = DAMAGE_MAP[weaponUsed] || 10;
            victim.hp -= damage;

            if (victim.hp <= 0) {
                players[id].kills = (players[id].kills || 0) + 1;
                victim.hp = 100;
                victim.isShielded = true;
                victim.shieldUntil = now + 2000;
            }
        }
    }

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
