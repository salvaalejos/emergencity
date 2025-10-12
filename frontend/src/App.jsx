import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.css";
import ambulanciaImg from "./assets/ambulancia.png";
import logo from "./assets/logo.png";


// Icono de ambulancia
const ambulanceIcon = new L.Icon({
  iconUrl: ambulanciaImg,
  iconSize: [45, 45],
});
// Simulación de movimiento aleatorio
const moveRandomly = (vehicle) => {
  const latOffset = (Math.random() - 0.5) * 0.0015;
  const lngOffset = (Math.random() - 0.5) * 0.0015;
  return {
    ...vehicle,
    lat: vehicle.lat + latOffset,
    lng: vehicle.lng + lngOffset,
  };
};

function App() {
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      name: "Unidad 56",
      lat: 19.705,
      lng: -101.194,
      speed: "62 km/h",
      status: "En ruta al hospital",
      hospital: "Hospital Civil de Morelia",
    },
    {
      id: 2,
      name: "Unidad 34",
      lat: 19.713,
      lng: -101.201,
      speed: "48 km/h",
      status: "Disponible",
      hospital: "IMSS Camelinas",
    },
    {
      id: 3,
      name: "Unidad 78",
      lat: 19.703,
      lng: -101.182,
      speed: "54 km/h",
      status: "En emergencia",
      hospital: "Hospital Star Médica",
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [time, setTime] = useState(new Date());

  // Actualiza hora en tiempo real
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Movimiento automático de ambulancias
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setVehicles((prev) => prev.map((v) => moveRandomly(v)));
    }, 3000);
    return () => clearInterval(moveInterval);
  }, []);

  // Formato de hora y fecha
  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = time.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  return (
    <div className="app">
      {/* Barra superior */}
      <header className="navbar">
        <div className="logo-section">
          <img src={logo} alt="logo" className="logo" />
          <h1>Emergen city</h1>
        </div>

        <div className="info-section">
          <span className="time">{formattedTime}</span>
          <span className="date">{formattedDate}</span>
          <span className="city">Morelia</span>
        </div>
      </header>

      {/* Contenedor principal */}
      <div className="main-content">
        {/* Mapa */}
        <div className="map-container">
          <MapContainer
            center={[19.705, -101.194]}
            zoom={13}
            className="map"
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {vehicles.map((v) => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={ambulanceIcon}
                eventHandlers={{
                  click: () => setSelectedVehicle(v),
                }}
              >
                <Popup>{v.name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Panel lateral */}
        <aside className={`side-panel ${selectedVehicle ? "open" : ""}`}>
          {selectedVehicle ? (
            <div className="vehicle-info">
              <h2>{selectedVehicle.name}</h2>
              <hr />
              <p><strong>Estado:</strong> {selectedVehicle.status}</p>
              <p><strong>Velocidad:</strong> {selectedVehicle.speed}</p>
              <p>
                <strong>Ubicación:</strong>{" "}
                {selectedVehicle.lat.toFixed(5)}, {selectedVehicle.lng.toFixed(5)}
              </p>
              <p><strong>Hospital destino:</strong> {selectedVehicle.hospital}</p>
              <button onClick={() => setSelectedVehicle(null)}>Cerrar</button>
            </div>
          ) : (
            <div className="no-selection">
              <p>Haz clic en una unidad para ver su información.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;
