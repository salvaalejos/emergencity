import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "./MapView.css";

// Ícono personalizado
const vehicleIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/854/854878.png",
  iconSize: [35, 35],
});

// Datos iniciales de ambulancias en Morelia
const vehiclesData = [
  { id: 1, name: "Ambulancia 1", position: [19.70078, -101.18443], speed: 45 },
  { id: 2, name: "Ambulancia 2", position: [19.704, -101.19], speed: 60 },
  { id: 3, name: "Ambulancia 3", position: [19.697, -101.178], speed: 55 },
];

// Cambia el centro del mapa cuando seleccionas un vehículo
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 14);
  return null;
}

export default function MapView() {
  const [vehicles, setVehicles] = useState(vehiclesData);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Simula movimiento cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => ({
          ...v,
          position: [
            v.position[0] + (Math.random() - 0.5) * 0.001,
            v.position[1] + (Math.random() - 0.5) * 0.001,
          ],
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="map-container">
      <MapContainer center={[19.70078, -101.18443]} zoom={14} className="map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={vehicle.position}
            icon={vehicleIcon}
            eventHandlers={{
              click: () => setSelectedVehicle(vehicle),
            }}
          >
            <Popup>{vehicle.name}</Popup>
          </Marker>
        ))}

        {selectedVehicle && <ChangeView center={selectedVehicle.position} />}
      </MapContainer>

      {selectedVehicle && (
        <div className="info-panel">
          <h3>{selectedVehicle.name}</h3>
          <p>
            <b>Velocidad:</b> {selectedVehicle.speed} km/h
          </p>
          <p>
            <b>Ubicación:</b>{" "}
            {selectedVehicle.position[0].toFixed(5)},{" "}
            {selectedVehicle.position[1].toFixed(5)}
          </p>
          <button onClick={() => setSelectedVehicle(null)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}
