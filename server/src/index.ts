import express from 'express';
import cors from 'cors';

import routeRoutes from './routes/routes';
import simulationRoutes from './routes/simulation';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/routes', routeRoutes);
app.use('/api/simulate', simulationRoutes);

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
