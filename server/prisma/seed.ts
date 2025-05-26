import prisma from '../src/lib/prisma';

async function main() {
  // Clear existing data
  await prisma.route.deleteMany();

  const routes = [
    {
      name: "Downtown Loop",
      geometry: "LINESTRING(-73.968285 40.785091, -73.973285 40.782091, -73.969285 40.778091, -73.965285 40.780091, -73.968285 40.785091)",
      distance: 5.2,
    },
    {
      name: "Riverside Trail",
      geometry: "LINESTRING(-74.010406 40.704586, -74.009276 40.711614, -74.008632 40.718153, -74.007559 40.723940, -74.006872 40.728675)",
      distance: 3.8,
    },
  ];

  for (const route of routes) {
    await prisma.$executeRawUnsafe(
      `
      INSERT INTO "Route" ("name", "geometry", "distance", "createdAt", "updatedAt")
      VALUES ($1, ST_GeomFromText($2, 4326), $3, NOW(), NOW())
      `,
      route.name,
      route.geometry,
      route.distance,
    );
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
