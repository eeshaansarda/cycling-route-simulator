export interface RouteMeta {
  id: number;
  name: string;
  createdAt: string;
}

export interface RouteDetail extends RouteMeta {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  distance: number;
}
