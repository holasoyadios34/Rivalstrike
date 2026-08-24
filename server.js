const express = require('express');
const app = express();
app.use(express.json());

let players = {};
const MAX_PLAYERS = 6;
const INACTIVE_TIMEOUT = 12 * 60 * 1000; // 12 minutos

// Mapeo directo usando tus números de arma
// 1 = Rifle (8 dmg), 2 = Pistola (19 dmg), 3 = Sniper (91 dmg)
const DAMAGE_MAP = { 1: 8, 2: 19, 3: 91 };

app.post('/update', (req, res) => {
    const { id, x, y, z, yaw, shooting, targetHit, weaponUsed } = req.body;
    const now = Date.now();

    if (!players[id] && Object.keys(players).length >= MAX_PLAYERS) {
        return res.status(403).json({ error: "ROOM_FULL" });
    }

    // Limpieza de inactivos
    for (let playerId in players) {
        if (now - players[playerId].lastSeen > INACTIVE_TIMEOUT) {
            delete players[playerId];
        }
    }

    // Inicializar jugador nuevo
    if (!players[id]) {
        players[id] = { kills: 0, hp: 100, isShielded: false, shieldUntil: 0 };
    }

    // Verificar si se venció su escudo de 2 segundos
    if (players[id].isShielded && now > players[id].shieldUntil) {
        players[id].isShielded = false;
    }

    // Procesar Daño y Respawn
    if (targetHit && players[targetHit]) {
        const victim = players[targetHit];
        
        // Aplica daño según el número de arma (1, 2 o 3) si la víctima no tiene escudo
        if (!victim.isShielded) {
            const damage = DAMAGE_MAP[weaponUsed] || 10;
            victim.hp -= damage;

            // Si muere el enemigo
            if (victim.hp <= 0) {
                players[id].kills = (players[id].kills || 0) + 1;
                
                // Respawn con 100 HP y Forcefield de 2 segundos (2000 ms)
                victim.hp = 100;
                victim.isShielded = true;
                victim.shieldUntil = now + 2000;
            }
        }
    }

    // Actualizar datos de posición
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
