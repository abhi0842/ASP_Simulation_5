import "./App.css";
import { SimulationProvider } from "./context/SimulationContext";
import { Home } from "./pages/home/Home";

function App() {
  return (
    <SimulationProvider>
      <Home />
    </SimulationProvider>
  );
}

export default App;
