import './App.css'
import MapView from './components/MapView'
import SideBar from './components/SideBar'
import { RouteProvider } from './context/RouteContext';

function App() {
  return (
    <RouteProvider>
      <div className="flex h-screen">
        <SideBar />
        <MapView />
      </div>
    </RouteProvider>
  )
}

export default App
