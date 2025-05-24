import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

export default function SideBar() {
    return (
        <div className="w-80 p-4 bg-white border-l space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Route Statistics</h2>
                <p>Distance: 0.0 km</p>
                <p>Estimated Time: 0h 00m</p>
            </div>
            <div>
                <h2 className="text-lg font-semibold">Simulation</h2>
                <div className="flex space-x-2">
                    <Button>Play</Button>
                    <Button>Pause</Button>
                    <Button>Reset</Button>
                </div>
                <div className="mt-4">
                    <label className="block mb-1">Speed</label>
                    <Slider min={1} max={10} step={1} />
                </div>
            </div>
        </div>
    );
}