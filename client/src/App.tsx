import './App.css'
import MapView from './components/MapView'
import SideBar from './components/SideBar'

function App() {

  return (
    <div className="flex h-screen">
      <MapView />
      <SideBar />
    </div>
  )
}

export default App
