import { useEffect, useState } from "react";
import { wsService } from "../lib/ws";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Play, Pause, RotateCcw, LogIn, LogOut } from "lucide-react";

const SimulationPanel = () => {
  const { selectedRouteId } = useSelector((state: RootState) => state.routes);
  const [speed, setSpeed] = useState(10); // meters per second
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [index, setIndex] = useState<number>(0);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [currentRouteId, setCurrentRouteId] = useState<number | null>(null);
  const [activeRooms, setActiveRooms] = useState<Array<{
    routeId: number;
    subscribers: number;
    playing: boolean;
    index: number;
  }>>([]);

  useEffect(() => {
    const sub = wsService.messages$.subscribe((msg) => {
      switch (msg.type) {
        case "welcome":
          setActiveRooms(msg.payload.activeRooms || []);
          break;
          
        case "joined":
          setIsConnectedToRoom(true);
          setCurrentRouteId(msg.payload.routeId);
          setPosition(msg.payload.position);
          setIndex(msg.payload.index);
          setIsPlaying(msg.payload.playing);
          setSubscriberCount(msg.payload.subscribers);
          break;
          
        case "left":
          setIsConnectedToRoom(false);
          setCurrentRouteId(null);
          setPosition(null);
          setIndex(0);
          setIsPlaying(false);
          setSubscriberCount(0);
          break;
          
        case "status":
          setPosition(msg.payload.position);
          setIndex(msg.payload.index);
          setIsPlaying(msg.payload.playing);
          if (msg.payload.subscribers !== undefined) {
            setSubscriberCount(msg.payload.subscribers);
          }
          break;
          
        case "started":
          setIsPlaying(true);
          break;
          
        case "paused":
          setIsPlaying(false);
          break;
          
        case "reset":
          setPosition(msg.payload.position);
          setIndex(msg.payload.index);
          setIsPlaying(msg.payload.playing);
          break;
          
        case "speed_changed":
          setSpeed(msg.payload.speed);
          break;
          
        case "subscriber_update":
          setSubscriberCount(msg.payload.subscribers);
          break;
          
        case "end":
          setIsPlaying(false);
          console.log("Simulation complete");
          break;
          
        case "error":
          console.error("Simulation error:", msg.message);
          break;
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const handleJoin = () => {
    if (typeof selectedRouteId === "number") {
      wsService.send({ 
        type: "join", 
        payload: { routeId: selectedRouteId, speed } 
      });
    }
  };

  const handleLeave = () => {
    wsService.send({ type: "leave" });
  };

  const handleStart = () => {
    wsService.send({ type: "start" });
  };

  const handlePause = () => {
    wsService.send({ type: "pause" });
  };

  const handleReset = () => {
    wsService.send({ type: "reset" });
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (isConnectedToRoom) {
      wsService.send({ 
        type: "speed_change", 
        payload: { speed: newSpeed } 
      });
    }
  };

  // Convert m/s to km/h for display
  const speedKmh = (speed * 3.6).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Route Simulation</h2>
        {isConnectedToRoom && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <Badge variant="secondary">{subscriberCount} viewers</Badge>
          </div>
        )}
      </div>

      {/* Room Connection Status */}
      <div className="space-y-2">
        {!isConnectedToRoom ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {selectedRouteId ? 
                `Ready to join simulation room for Route #${selectedRouteId}` : 
                "Select a route to join its simulation room"
              }
            </p>
            <Button 
              onClick={handleJoin} 
              disabled={!selectedRouteId}
              className="w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Join Simulation Room
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Connected to Route #{currentRouteId} simulation room
            </p>
            <Button 
              onClick={handleLeave} 
              variant="outline"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
          </div>
        )}
      </div>

      {/* Simulation Controls - only show when connected */}
      {isConnectedToRoom && (
        <>
          <div className="flex space-x-2">
            <Button 
              onClick={handleStart} 
              disabled={isPlaying}
              variant={isPlaying ? "secondary" : "default"}
            >
              <Play className="w-4 h-4 mr-2" />
              {isPlaying ? "Playing" : "Play"}
            </Button>
            <Button 
              onClick={handlePause} 
              disabled={!isPlaying}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Speed: {speed} m/s ({speedKmh} km/h)</Label>
            <Slider 
              min={1} 
              max={50} 
              step={1} 
              value={[speed]} 
              onValueChange={([v]) => handleSpeedChange(v)} 
            />
            <p className="text-xs text-muted-foreground">
              Speed changes affect all viewers in this room
            </p>
          </div>

          {position && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Position</p>
              <p className="text-sm text-muted-foreground">
                Point #{index + 1}: {position[1].toFixed(5)}, {position[0].toFixed(5)}
              </p>
            </div>
          )}
        </>
      )}

      {/* Active Rooms List */}
      {activeRooms.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Active Simulation Rooms</Label>
          <div className="space-y-1">
            {activeRooms.map((room) => (
              <div 
                key={room.routeId} 
                className="flex items-center justify-between p-2 bg-muted rounded text-sm"
              >
                <span>Route #{room.routeId}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={room.playing ? "default" : "secondary"}>
                    {room.playing ? "Playing" : "Paused"}
                  </Badge>
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {room.subscribers}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPanel;