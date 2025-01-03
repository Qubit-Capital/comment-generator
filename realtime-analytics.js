import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';

class RealtimeAnalytics {
    constructor(server) {
        this.wss = new WebSocketServer({ server });
        this.eventEmitter = new EventEmitter();
        this.clients = new Set();
        this.setupWebSocket();
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('Client connected. Total clients:', this.clients.size);

            // Send initial data
            this.sendInitialData(ws);

            // Listen for analytics updates
            this.eventEmitter.on('analyticsUpdate', (data) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(data));
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('Client disconnected. Total clients:', this.clients.size);
            });

            // Handle errors
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }

    broadcast(data) {
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }

    async sendInitialData(ws) {
        try {
            const summary = await this.getLatestSummary();
            if (summary) {
                ws.send(JSON.stringify({
                    type: 'initial',
                    data: summary
                }));
            }
        } catch (error) {
            console.error('Error sending initial data:', error);
        }
    }

    async getLatestSummary() {
        try {
            const AnalyticsSummary = await import('./models/AnalyticsSummary.js');
            return await AnalyticsSummary.default.findOne()
                .sort({ date: -1 })
                .limit(1);
        } catch (error) {
            console.error('Error getting latest summary:', error);
            return null;
        }
    }
}

export default RealtimeAnalytics;
