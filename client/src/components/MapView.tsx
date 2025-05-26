import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { setDrawnGeometry } from '../store/routesSlice';

const MapView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { mode, routeDetail, drawnGeometry } = useSelector((state: RootState) => state.routes);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current).setView([27.7172, 85.324], 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const drawnItems = drawnLayerRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: { polygon: false, rectangle: false, circle: false, marker: false, circlemarker: false, polyline: {} },
      edit: { featureGroup: drawnItems }
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);
      const gj = e.layer.toGeoJSON().geometry;
      dispatch(setDrawnGeometry({ type: 'LineString', coordinates: gj.coordinates }));
    });

    return () => {
      map.remove();
    };
  }, [dispatch]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const drawControl = drawControlRef.current;
    if (!map || !drawControl) return;
    if (mode === 'edit') map.addControl(drawControl);
    else map.removeControl(drawControl);
  }, [mode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const drawnItems = drawnLayerRef.current;
    drawnItems.clearLayers();

    const geom = mode === 'edit' ? drawnGeometry : routeDetail?.geometry;
    if (geom) {
      const geoLayer = L.geoJSON({ type: 'Feature', geometry: geom });
      drawnItems.addLayer(geoLayer);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [drawnGeometry, routeDetail, mode]);

  return <div ref={mapRef} className="flex-1" />;
};

export default MapView;
