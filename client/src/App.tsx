import './App.css';
import MapView from './components/MapView';
import SideBar from './components/SideBar';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <div className="flex h-screen">
        <SideBar />
        <MapView />
      </div>
    </Provider>
  );
}

export default App;
