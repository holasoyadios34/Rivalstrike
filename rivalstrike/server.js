const WebSocket = require('ws');

// Render asigna un puerto automático usando process.env.PORT
const port = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port });

console.log(`Servidor iniciado en puerto ${port}`);

wss.on('connection', (ws) => {
    // Asigna un ID único al jugador
    const id = Math.floor(Math.random() * 100000);
    
    // Le envía su ID al conectarse
    ws.send(`ID,${id}`);

    ws.on('message', (message) => {
        // Reenvía lo que envía este jugador a todos los demás clientes
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(`${id},${message}`);
            }
        });
    });

    ws.on('close', () => {
        // Notifica a los demás que este jugador se desconectó
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(`LEAVE,${id}`);
            }
        });
    });
});