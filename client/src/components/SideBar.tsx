import React, { useState, useEffect } from 'react';
import { useRouteContext } from '../context/RouteContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import length from '@turf/length';
import { lineString } from '@turf/helpers';

const Sidebar: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    setSelectedRouteId,
    mode,
    drawnGeometry,
    routeDetail,
    setDrawnGeometry,
    refreshRoutes,
  } = useRouteContext();
  const [newRouteName, setNewRouteName] = useState('');

  // compute local stats for edit mode
  const [tempDistance, setTempDistance] = useState(0);
  useEffect(() => {
    if (mode === 'edit' && drawnGeometry) {
      const line = lineString(drawnGeometry.coordinates);
      const dist = length(line, { units: 'kilometers' });
      setTempDistance(dist);
    }
  }, [drawnGeometry, mode]);

  const handleSave = () => {
    if (!drawnGeometry || !newRouteName) return;
    const line = lineString(drawnGeometry.coordinates);
    const dist = length(line, { units: 'kilometers' });

    fetch('http://localhost:3000/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRouteName, geometry: drawnGeometry, distance: dist }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Save failed');
        setNewRouteName('');
        setDrawnGeometry(null);
        setSelectedRouteId('new');
        refreshRoutes();
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="w-80 p-4 bg-white border-r space-y-6 flex flex-col">
      {/* Route Selector */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Routes</h2>
        <Select
          value={selectedRouteId === 'new' ? 'new' : selectedRouteId?.toString() ?? 'new'}
          onValueChange={val => {
            if (val === 'new') setSelectedRouteId('new');
            else setSelectedRouteId(Number(val));
          }}>
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

      {/* Route Statistics */}
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
          <p>Created: {new Date(routeDetail.createdAt).toLocaleString()}</p>
        )}
      </div>

      {/* Simulation Controls */}
      <div className="mt-auto space-y-2">
        <h2 className="text-lg font-semibold">Simulation</h2>
        <div className="flex space-x-2">
          <Button>Play</Button>
          <Button>Pause</Button>
          <Button>Reset</Button>
        </div>
        <div>
          <Label>Speed</Label>
          <Slider min={1} max={10} step={1} defaultValue={[5]} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
