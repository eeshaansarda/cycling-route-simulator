## Cycling Route Simulator

### Project Overview
A web application that allows cyclists to draw routes on a map and simulate a cycling journey along that route with animation.

1. Map Interface
● an interactive map view using Leaflet
● a drawing tool for LineString geometry to plot routes
● basic map controls (zoom, pan, etc.)
● clear visual feedback during route drawing
2. Route Management
● route geometry in GeoJSON format
● calculates and displays route statistics (distance, estimated time)
● save and load routes
● basic route validation
3. Route Simulation
● an animation system that moves a marker along the drawn route
● play/pause/reset controls for the simulation
● a speed control for the simulation
● current position metrics during simulation

### Technical Specifications
#### Frontend
- React with TypeScript
- Leaflet
- RxJS (for handling simulation events)
- Tailwind and Shadcn
- Redux

#### Backend
- Node.js/Express
- Prisma
- PostgreSQL with PostGIS extension
- RESTful API architecture
- websocket (real time updates)

### API Endpoints

// Route Management
POST /api/routes // Create new route
GET /api/routes/:id // Get route by ID
PUT /api/routes/:id // Update route
DELETE /api/routes/:id // Delete route

// Simulation
/ws/simulate

### Database Schema

CREATE TABLE routes (
id SERIAL PRIMARY KEY,
name VARCHAR(255),
geometry GEOMETRY(LINESTRING, 4326),
distance FLOAT,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);
