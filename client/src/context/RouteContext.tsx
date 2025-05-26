import React, { createContext, useContext, useState, useEffect } from 'react';
import { featureCollection } from '@turf/helpers';

export interface RouteMeta {
  id: number;
  name: string;
}

export interface RouteDetail extends RouteMeta {
  geometry: any;
  distance: number;
  createdAt: string;
  updatedAt: string;
}

interface RouteContextType {
  routes: RouteMeta[];
  selectedRouteId: number | 'new' | null;
  setSelectedRouteId: (id: number | 'new' | null) => void;
  mode: 'edit' | 'view';
  routeDetail: RouteDetail | null;
  drawnGeometry: any | null;
  setDrawnGeometry: (geom: any | null) => void;
  refreshRoutes: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<RouteMeta[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number | 'new' | null>('new');
  const [mode, setMode] = useState<'edit' | 'view'>('edit');
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [drawnGeometry, setDrawnGeometry] = useState<any | null>(null);

  const fetchRoutes = () => {
    fetch('http://localhost:3000/api/routes')
      .then(res => res.json())
      .then(data => setRoutes(data))
      .catch(err => console.error('Failed to fetch routes:', err));
  };

  useEffect(fetchRoutes, []);

  useEffect(() => {
    if (selectedRouteId === 'new') {
      setMode('edit');
      setRouteDetail(null);
    } else if (selectedRouteId) {
      setMode('view');
      fetch(`http://localhost:3000/api/routes/${selectedRouteId}`)
        .then(res => res.json())
        .then((detail: RouteDetail) => setRouteDetail(detail))
        .catch(err => console.error('Failed to fetch route detail:', err));
    } else {
      setRouteDetail(null);
    }
  }, [selectedRouteId]);

  return (
    <RouteContext.Provider
      value={{
        routes,
        selectedRouteId,
        setSelectedRouteId,
        mode,
        routeDetail,
        drawnGeometry,
        setDrawnGeometry,
        refreshRoutes: fetchRoutes
      }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRouteContext = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error('useRouteContext must be used within a RouteProvider');
  return context;
};
