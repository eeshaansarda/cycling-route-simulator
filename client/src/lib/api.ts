import axios from 'axios';
import type { RouteDetail, RouteMeta } from '@/types';

const API_BASE = 'http://localhost:3000/api/routes';

export const fetchRoutes = async (): Promise<RouteMeta[]> => {
  const res = await axios.get(`${API_BASE}`);
  return res.data;
};

export const fetchRouteDetail = async (id: number): Promise<RouteDetail> => {
  const res = await axios.get(`${API_BASE}/${id}`);
  return res.data;
};

export const saveRoute = async (name: string, geometry: any, distance: number): Promise<void> => {
  await axios.post(`${API_BASE}`, {
    name,
    geometry,
    distance
  });
};

export const updateRoute = async (
  id: number,
  name: string,
  geometry: any,
  distance: number
): Promise<void> => {
  await axios.put(`${API_BASE}/${id}`, {
    name,
    geometry,
    distance
  });
};

export const deleteRoute = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`);
};
