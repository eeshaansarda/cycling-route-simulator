import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchRoutes,
  fetchRouteDetail,
  saveRoute,
  setSelectedRouteId,
  deleteRoute
} from '../store/routesSlice';
import type { AppDispatch, RootState } from '../store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import length from '@turf/length';
import { lineString } from '@turf/helpers';
import SimulationPanel from './SimulationPanel';

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { routes, selectedRouteId, mode, routeDetail, drawnGeometry } = useSelector(
    (state: RootState) => state.routes
  );
  const [newRouteName, setNewRouteName] = useState('');
  const [tempDistance, setTempDistance] = useState(0);

  useEffect(() => {
    dispatch(fetchRoutes());
  }, [dispatch]);

  useEffect(() => {
    if (mode === 'edit' && drawnGeometry) {
      const line = lineString(drawnGeometry.coordinates);
      const dist = length(line, { units: 'kilometers' });
      setTempDistance(dist);
    }
  }, [drawnGeometry, mode]);

  useEffect(() => {
    if (typeof selectedRouteId === 'number') dispatch(fetchRouteDetail(selectedRouteId));
  }, [selectedRouteId, dispatch]);

  const handleSave = () => {
    if (!drawnGeometry || !newRouteName) return;
    const line = lineString(drawnGeometry.coordinates);
    const dist = length(line, { units: 'kilometers' });
    dispatch(saveRoute({ name: newRouteName, geometry: drawnGeometry, distance: dist }));
    setNewRouteName('');
  };

  const handleDeleteRoute = async () => {
    if (!routeDetail?.id) return;
    const confirmed = confirm(`Are you sure you want to delete "${routeDetail.name}"?`);
    if (!confirmed) return;

    try {
      await dispatch(deleteRoute(routeDetail.id));
      dispatch(fetchRoutes());
      dispatch(setSelectedRouteId('new'));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="w-80 p-4 bg-white border-r space-y-6 flex flex-col">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Routes</h2>
        <Select
          value={selectedRouteId === 'new' ? 'new' : selectedRouteId?.toString() ?? 'new'}
          onValueChange={val => {
            if (val === 'new') dispatch(setSelectedRouteId('new'));
            else dispatch(setSelectedRouteId(Number(val)));
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="-- Select or Create --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">-- Create New Route --</SelectItem>
            {routes.map(r => (
              <SelectItem key={r.id} value={r.id.toString()}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {mode === 'edit' && (
          <>
            <Input
              placeholder="Route Name"
              value={newRouteName}
              onChange={e => setNewRouteName(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!drawnGeometry || !newRouteName}
            >
              Save Route
            </Button>
          </>
        )}
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Route Statistics</h2>
        <p>
          Distance:{' '}
          {(mode === 'view'
            ? routeDetail?.distance.toFixed(2)
            : tempDistance.toFixed(2)) ?? '0.00'}{' '}
          km
        </p>
        {mode === 'view' && routeDetail && (
          <>
            <p>Created: {new Date(routeDetail.createdAt).toLocaleString()}</p>
            <Button
              variant="destructive"
              className="w-full mt-4"
              onClick={handleDeleteRoute}
            >
              Delete Route
            </Button>
          </>
        )}
      </div>
        {mode === 'view' && (<SimulationPanel />)}
    </div>
  );
};

export default Sidebar;
