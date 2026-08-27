const express = require('express');
const cors = require('cors'); // Usar librería nativa de CORS
const app = express();

// Permitir peticiones desde cualquier origen (incluyendo PenguinMod)
app.use(cors());
app.use(express.json());

let players = {};
const MAX_PLAYERS = 6;
const INACTIVE_TIMEOUT = 12 * 60 * 1000;
const DAMAGE_MAP = { 1: 8, 2: 19, 3: 91 };

app.post('/update', (req, res) => {
    // 1. Añadimos 'username' a las variables que extraemos del cuerpo de la petición
    const { id, x, y, z, yaw, shooting, targetHit, weaponUsed, username } = req.body;
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
        // 2. Guardamos un nombre por defecto si entra por primera vez
        players[id] = { 
            kills: 0, 
            hp: 100, 
            isShielded: false, 
            shieldUntil: 0,
            username: username || "Guest" 
        };
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
        // 3. Actualizamos el username por si el jugador cambió de nombre o lo envió de nuevo
        username: username || players[id].username || "Guest",
        lastSeen: now
    };

    res.json(players);
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
