import { useEffect, useState } from "react";
import { wsService } from "../lib/ws";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

const SimulationPanel = () => {
  const { selectedRouteId } = useSelector((state: RootState) => state.routes);
  const [speed, setSpeed] = useState(10); // meters per second
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [index, setIndex] = useState<number>(0);

  useEffect(() => {
    const sub = wsService.messages$.subscribe((msg) => {
      if (msg.type === "status") {
        setPosition(msg.payload.position);
        setIndex(msg.payload.index);
      } else if (msg.type === "end") {
        console.log("Simulation complete");
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const handleStart = () => {
    if (typeof selectedRouteId === "number") {
      wsService.send({ type: "start", payload: { routeId: selectedRouteId, speed } });
    }
  };

  const handlePause = () => wsService.send({ type: "pause" });
  const handleReset = () => wsService.send({ type: "reset" });

  // Convert m/s to km/h for display
  const speedKmh = (speed * 3.6).toFixed(1);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Simulation</h2>
      <div className="flex space-x-2">
        <Button onClick={handleStart}>Play</Button>
        <Button onClick={handlePause}>Pause</Button>
        <Button onClick={handleReset}>Reset</Button>
      </div>
      <div>
        <Label>Speed: {speed} m/s ({speedKmh} km/h)</Label>
        <Slider 
          min={1} 
          max={50} 
          step={1} 
          value={[speed]} 
          onValueChange={([v]) => setSpeed(v)} 
        />
      </div>
      {position && (
        <p className="text-sm text-muted-foreground">
          Position #{index + 1}: {position[1].toFixed(5)}, {position[0].toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default SimulationPanel;