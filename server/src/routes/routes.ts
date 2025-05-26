import { Router } from "express";
import prisma from "../lib/prisma";
import { CreateRouteSchema, UpdateRouteSchema } from "../validators/route";

const router = Router();

interface RouteResult {
  id: number;
  name: string;
  geometry: any; // GeoJSON object
  distance: number;
  createdAt: Date;
  updatedAt: Date;
}

router.get('/', async (_req, res) => {
  try {
    const routes = await prisma.$queryRawUnsafe(`
      SELECT id, name, ST_AsGeoJSON(geometry)::json as geometry, distance, "createdAt", "updatedAt"
      FROM "Route"
    `);
    res.json(routes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

router.post('/', async (req, res) => {
  const parseResult = CreateRouteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { name, geometry, distance } = parseResult.data;

  try {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "Route" ("name", "geometry", "distance", "createdAt", "updatedAt")
      VALUES ($1, ST_GeomFromGeoJSON($2), $3, NOW(), NOW())
      `,
      name,
      JSON.stringify(geometry),
      distance
    );

    res.status(201).json({ message: "Route created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create route" });
  }
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await prisma.$queryRawUnsafe<RouteResult[]>(`
      SELECT id, name, ST_AsGeoJSON(geometry)::json as geometry, distance, "createdAt", "updatedAt"
      FROM "Route"
      WHERE id = $1
    `, id);

    if (result.length === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch route" });
  }
});

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const parseResult = UpdateRouteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { name, geometry, distance } = parseResult.data;

  try {
    await prisma.$executeRawUnsafe(`
      UPDATE "Route"
      SET
        name = COALESCE($2, name),
        geometry = COALESCE(ST_GeomFromGeoJSON($3), geometry),
        distance = COALESCE($4, distance),
        "updatedAt" = NOW()
      WHERE id = $1
    `, id, name ?? null, geometry ? JSON.stringify(geometry) : null, distance ?? null);

    res.json({ message: "Route updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update route" });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.route.delete({ where: { id } });
    res.json({ message: "Route deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete route" });
  }
});

export default router;
