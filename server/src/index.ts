import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import http from 'http';

import routeRoutes from './routes/routes';
import simulationWS from './ws/simulation';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/routes', routeRoutes);

server.on('upgrade', (request, socket, head) => {
  console.log('upgrade', request.url);
  if (request.url === '/ws/simulate') {
    simulationWS.handleUpgrade(request, socket, head, (ws) => {
      simulationWS.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});