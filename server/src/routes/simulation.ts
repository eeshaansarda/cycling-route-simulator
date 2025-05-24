import { Router } from "express";

// Simulation
// POST /API/SIMULATE/START // START SIMULATION
// POST /API/SIMULATE/PAUSE // PAUSE SIMULATION
// POST /API/SIMULATE/RESET // RESET SIMULATION
const router = Router();

router.post('/start', async (req, res) => {
});

router.post('/pause', async (req, res) => {
});

router.post('/reset', async (req, res) => {
});

export default router;