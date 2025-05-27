## 🚴‍♂️ Cycling Route Simulator

### Project Overview

A web application that enables cyclists to draw routes on an interactive map and simulate a cycling journey along those routes with smooth animation.

---

### Features

#### 1. Map Interface

* Interactive map view powered by **Leaflet**
* Drawing tool to plot routes using **LineString** geometry
* Basic map controls: zoom, pan, etc.
* Clear visual feedback during route drawing

#### 2. Route Management

* Routes stored in **GeoJSON** format
* Calculates and displays key statistics: distance, estimated time
* Save and load routes functionality
* Basic validation to ensure route correctness

#### 3. Route Simulation

* Animated marker that moves along the drawn route
* Play, pause, and reset controls for the simulation
* Adjustable speed control
* Real-time display of current position metrics

---

### Technical Specifications

#### Frontend

* React with TypeScript
* Leaflet for mapping
* RxJS for managing simulation events
* Tailwind CSS and shadcn UI components
* Redux for state management

#### Backend

* Node.js with Express.js
* Prisma ORM
* PostgreSQL with PostGIS extension for spatial data
* RESTful API design
* WebSocket support for real-time updates

---

### API Endpoints

| Method | Endpoint          | Description                                   |
| ------ | ----------------- | --------------------------------------------- |
| POST   | `/api/routes`     | Create a new route                            |
| GET    | `/api/routes/:id` | Get route details by ID                       |
| PUT    | `/api/routes/:id` | Update existing route                         |
| DELETE | `/api/routes/:id` | Delete a route                                |
| WS     | `/ws/simulate`    | WebSocket for simulation controls and updates |

---

### Database Schema

```sql
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  geometry GEOMETRY(LINESTRING, 4326),
  distance FLOAT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```