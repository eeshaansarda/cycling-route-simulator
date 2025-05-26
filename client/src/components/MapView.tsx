import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { setDrawnGeometry } from '../store/routesSlice';
import { wsService } from '../lib/ws';
import { Subscription } from 'rxjs';

// Tween marker from 'from' to 'to' over 'duration' ms
function animateMarker(
  marker: L.Marker,
  from: [number, number],
  to: [number, number],
  duration: number
) {
  let start: number | null = null;

  function step(timestamp: number) {
    if (start === null) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const lat = from[0] + (to[0] - from[0]) * progress;
    const lng = from[1] + (to[1] - from[1]) * progress;
    marker.setLatLng([lat, lng]);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

const MapView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapRefInstance = useRef<L.Map>();
  const drawnGroup = useRef(new L.FeatureGroup());
  const drawControl = useRef<L.Control.Draw>();
  const markerRef = useRef<L.Marker>();
  const lastPos = useRef<[number, number]>();

  const dispatch = useDispatch<AppDispatch>();
  const { mode, routeDetail, drawnGeometry } = useSelector(
    (state: RootState) => state.routes
  );

  // Initialize map and marker
  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([27.7172, 85.324], 13);
    mapRefInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    map.addLayer(drawnGroup.current);

    const marker = L.marker([0, 0], { opacity: 0 }).addTo(map);
    markerRef.current = marker;

    // Handle drawing new routes
    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnGroup.current.clearLayers();
      drawnGroup.current.addLayer(e.layer);
      const geom = e.layer.toGeoJSON().geometry;
      dispatch(setDrawnGeometry({ type: 'LineString', coordinates: geom.coordinates }));
    });

    return () => map.remove();
  }, [dispatch]);

  // Toggle draw controls
  useEffect(() => {
    const map = mapRefInstance.current;
    if (!map) return;

    if (mode === 'edit' && !drawControl.current) {
      drawControl.current = new L.Control.Draw({
        draw: { polygon: false, rectangle: false, circle: false, marker: false, circlemarker: false, polyline: {} },
        edit: { featureGroup: drawnGroup.current },
      });
      map.addControl(drawControl.current);
    } else if (mode !== 'edit' && drawControl.current) {
      map.removeControl(drawControl.current);
      drawControl.current = undefined;
    }
  }, [mode]);

  // Render or fit to route
  useEffect(() => {
    const map = mapRefInstance.current;
    if (!map) return;

    drawnGroup.current.clearLayers();
    const geometry = mode === 'edit' ? drawnGeometry : routeDetail?.geometry;
    if (geometry) {
      const layer = L.geoJSON({ type: 'Feature', geometry });
      drawnGroup.current.addLayer(layer);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [mode, drawnGeometry, routeDetail]);

  // Subscribe to simulation updates
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const sub: Subscription = wsService.messages$.subscribe(msg => {
      if (msg.type === 'status') {
        const [lng, lat] = msg.payload.position as [number, number];
        const pos: [number, number] = [lat, lng];
        marker.setOpacity(1);

        if (lastPos.current) {
          animateMarker(marker, lastPos.current, pos, 100);
        } else {
          marker.setLatLng(pos);
        }

        lastPos.current = pos;
      } else if (msg.type === 'end') {
        marker.setOpacity(0);
        lastPos.current = undefined;
      }
    });

    return () => sub.unsubscribe();
  }, []);

  return <div ref={mapRef} className="flex-1" />;
};

export default MapView;
