# 🚑 API Documentation - Sistema de Ambulancias Emergencity

## 📋 Tabla de Contenidos
- [Configuración](#configuración)
- [Endpoints REST](#endpoints-rest)
- [WebSockets](#websockets)
- [Simulador de Movimiento](#simulador-de-movimiento)

---

## ⚙️ Configuración

Para actualizar los datos de la BD que se utilice, cambiar la configuración en _ambulance-backend:_
```javascript
// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Emergencity',
  password: process.env.DB_PASSWORD || 'contraseña',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```
Como en el GitHub no vienen incluidas las carpetas para las dependencias de Node JS, ejecutar primero estos dos comandos al querer hacer pruebas (ejecutar en terminal dentro de la carpeta /backend, de preferencia correr con terminal de VS Code): 
```bash
npm init -y
npm install express cors pg socket.io dotenv
```
### Instalación

```bash
# Instalar dependencias
npm install

# Crear archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
```

### Iniciar el servidor

```bash
# Modo producción
npm start

# Modo desarrollo (con nodemon)
npm run dev
```

---

## 🔌 Endpoints REST

### Base URL
```
http://localhost:5000/api
```

### 1. Health Check

**GET** `/health`

Verifica el estado del servidor y la conexión a la base de datos.

**Respuesta exitosa:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-10T12:00:00.000Z"
}
```

---

### 2. Obtener todas las ambulancias

**GET** `/ambulancias`

**Query Parameters (opcional):**
- `estado`: Filtrar por estado (disponible, ocupado, en mantenimiento, fuera de servicio)
- `tipo`: Filtrar por tipo (Tipo I, Tipo II, Tipo III, Soporte Vital Básico, Soporte Vital Avanzado)

**Ejemplo:**
```
GET /api/ambulancias?estado=disponible
```

**Respuesta:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id_ambulancia": 1,
      "placa": "ABC-123",
      "numero_de_serie": "AMB-2024-001",
      "modelo": "Ford Transit 2023",
      "tipo": "Soporte Vital Avanzado",
      "institucion_procedencia": "Cruz Roja",
      "ultima_revision": "2024-09-15",
      "latitud": "19.701400",
      "longitud": "-101.184300",
      "estado": "disponible",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-10-10T12:00:00Z"
    }
  ]
}
```

---

### 3. Obtener una ambulancia por ID

**GET** `/ambulancias/:id`

**Ejemplo:**
```
GET /api/ambulancias/1
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id_ambulancia": 1,
    "placa": "ABC-123",
    ...
  }
}
```

---

### 4. Crear nueva ambulancia

**POST** `/ambulancias`

**Body (JSON):**
```json
{
  "placa": "XYZ-789",
  "numero_de_serie": "AMB-2024-005",
  "modelo": "Mercedes Sprinter 2024",
  "tipo": "Soporte Vital Básico",
  "institucion_procedencia": "IMSS",
  "ultima_revision": "2024-10-01",
  "latitud": 19.703500,
  "longitud": -101.195200,
  "estado": "disponible"
}
```

**Campos requeridos:**
- `placa`
- `numero_de_serie`
- `tipo`
- `latitud`
- `longitud`

**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Ambulancia creada exitosamente"
}
```

---

### 5. Actualizar ambulancia completa

**PUT** `/ambulancias/:id`

**Body (JSON):** Todos los campos son opcionales
```json
{
  "placa": "ABC-123-NEW",
  "estado": "en mantenimiento"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Ambulancia actualizada exitosamente"
}
```

---

### 6. Actualizar ubicación

**PATCH** `/ambulancias/:id/ubicacion`

**Body (JSON):**
```json
{
  "latitud": 19.705000,
  "longitud": -101.190000
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 7. Actualizar estado

**PATCH** `/ambulancias/:id/estado`

**Body (JSON):**
```json
{
  "estado": "ocupado"
}
```

**Estados válidos:**
- `disponible`
- `ocupado`
- `en mantenimiento`
- `fuera de servicio`

**Respuesta:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### 8. Eliminar ambulancia

**DELETE** `/ambulancias/:id`

**Respuesta:**
```json
{
  "success": true,
  "message": "Ambulancia eliminada exitosamente",
  "data": { ... }
}
```

---

### 9. Estadísticas

**GET** `/ambulancias/stats/resumen`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": "10",
    "disponibles": "5",
    "ocupadas": "3",
    "en_mantenimiento": "1",
    "fuera_servicio": "1"
  }
}
```

---

## 🔄 WebSockets

### Conexión

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');
```

### Eventos del Cliente

#### Solicitar datos iniciales
```javascript
socket.emit('solicitar:ambulancias');
```

### Eventos del Servidor

#### Datos iniciales
```javascript
socket.on('ambulancias:inicial', (ambulancias) => {
  console.log('Ambulancias cargadas:', ambulancias);
});
```

#### Nueva ambulancia
```javascript
socket.on('ambulancia:nueva', (ambulancia) => {
  console.log('Nueva ambulancia:', ambulancia);
});
```

#### Ambulancia actualizada
```javascript
socket.on('ambulancia:actualizada', (ambulancia) => {
  console.log('Ambulancia actualizada:', ambulancia);
});
```

#### Cambio de ubicación
```javascript
socket.on('ambulancia:ubicacion', (ambulancia) => {
  console.log('Ubicación actualizada:', ambulancia);
  // Actualizar marcador en el mapa
});
```

#### Cambio de estado
```javascript
socket.on('ambulancia:estado', (ambulancia) => {
  console.log('Estado actualizado:', ambulancia);
});
```

#### Ambulancia eliminada
```javascript
socket.on('ambulancia:eliminada', (data) => {
  console.log('Ambulancia eliminada:', data.id);
});
```

#### Error
```javascript
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## 🎮 Simulador de Movimiento

El simulador mueve automáticamente las ambulancias con estado **"ocupado"** para simular el movimiento en tiempo real.

### Características:
- ✅ Movimiento aleatorio realista (50-200 metros por actualización)
- ✅ Solo simula ambulancias en estado "ocupado"
- ✅ Actualiza posición cada 3 segundos (configurable)
- ✅ Notifica cambios via WebSockets
- ✅ Se puede iniciar/detener en cualquier momento

### Endpoints del Simulador

#### Iniciar simulador

**POST** `/simulador/iniciar`

**Body (JSON - opcional):**
```json
{
  "intervalo": 5000
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Simulador iniciado",
  "ambulancias_activas": 3
}
```

---

#### Detener simulador

**POST** `/simulador/detener`

**Respuesta:**
```json
{
  "success": true,
  "message": "Simulador detenido"
}
```

---

#### Estado del simulador

**GET** `/simulador/estado`

**Respuesta:**
```json
{
  "success": true,
  "activo": true,
  "ambulancias_simuladas": 3,
  "intervalos": [1, 3, 5]
}
```

---

## 🔧 Ejemplo de uso completo en React

### 1. Instalación en el cliente

```bash
npm install socket.io-client axios
```

### 2. Hook personalizado para WebSocket

```javascript
// hooks/useAmbulances.js
import { useState, useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useAmbulances = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Solicitar datos iniciales
    newSocket.emit('solicitar:ambulancias');

    // Escuchar eventos
    newSocket.on('ambulancias:inicial', (data) => {
      setAmbulances(data);
    });

    newSocket.on('ambulancia:nueva', (ambulancia) => {
      setAmbulances(prev => [...prev, ambulancia]);
    });

    newSocket.on('ambulancia:actualizada', (ambulancia) => {
      setAmbulances(prev => 
        prev.map(a => a.id_ambulancia === ambulancia.id_ambulancia ? ambulancia : a)
      );
    });

    newSocket.on('ambulancia:ubicacion', (ambulancia) => {
      setAmbulances(prev => 
        prev.map(a => a.id_ambulancia === ambulancia.id_ambulancia ? ambulancia : a)
      );
    });

    newSocket.on('ambulancia:estado', (ambulancia) => {
      setAmbulances(prev => 
        prev.map(a => a.id_ambulancia === ambulancia.id_ambulancia ? ambulancia : a)
      );
    });

    newSocket.on('ambulancia:eliminada', (data) => {
      setAmbulances(prev => 
        prev.filter(a => a.id_ambulancia !== data.id)
      );
    });

    return () => newSocket.close();
  }, []);

  return { ambulances, socket };
};
```

### 3. Componente de Mapa con React Leaflet

```javascript
// components/AmbulanceMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAmbulances } from '../hooks/useAmbulances';

const getMarkerIcon = (estado) => {
  const colors = {
    'disponible': 'green',
    'ocupado': 'red',
    'en mantenimiento': 'orange',
    'fuera de servicio': 'gray'
  };

  return L.divIcon({
    html: `<div style="background-color: ${colors[estado]}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white;"></div>`,
    className: 'custom-marker',
    iconSize: [30, 30]
  });
};

export const AmbulanceMap = () => {
  const { ambulances } = useAmbulances();

  return (
    <MapContainer 
      center={[19.7014, -101.1843]} 
      zoom={13} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {ambulances.map(ambulance => (
        <Marker
          key={ambulance.id_ambulancia}
          position={[
            parseFloat(ambulance.latitud),
            parseFloat(ambulance.longitud)
          ]}
          icon={getMarkerIcon(ambulance.estado)}
        >
          <Popup>
            <div>
              <h3>🚑 {ambulance.placa}</h3>
              <p><strong>Tipo:</strong> {ambulance.tipo}</p>
              <p><strong>Estado:</strong> {ambulance.estado}</p>
              <p><strong>Institución:</strong> {ambulance.institucion_procedencia}</p>
              <p><strong>Modelo:</strong> {ambulance.modelo}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
```

### 4. Control del Simulador

```javascript
// components/SimulatorControl.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const SimulatorControl = () => {
  const [status, setStatus] = useState({
    activo: false,
    ambulancias_simuladas: 0
  });

  const fetchStatus = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/simulador/estado`);
      setStatus(data);
    } catch (error) {
      console.error('Error al obtener estado:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const startSimulator = async () => {
    try {
      await axios.post(`${API_URL}/simulador/iniciar`);
      fetchStatus();
    } catch (error) {
      console.error('Error al iniciar simulador:', error);
    }
  };

  const stopSimulator = async () => {
    try {
      await axios.post(`${API_URL}/simulador/detener`);
      fetchStatus();
    } catch (error) {
      console.error('Error al detener simulador:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Control del Simulador</h2>
      <p>Estado: {status.activo ? '🟢 Activo' : '🔴 Inactivo'}</p>
      <p>Ambulancias simuladas: {status.ambulancias_simuladas}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={startSimulator} disabled={status.activo}>
          ▶️ Iniciar Simulador
        </button>
        <button onClick={stopSimulator} disabled={!status.activo}>
          ⏸️ Detener Simulador
        </button>
      </div>
    </div>
  );
};
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | Operación exitosa |
| 201 | Recurso creado exitosamente |
| 400 | Solicitud incorrecta (datos inválidos) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (placa/serie duplicada) |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible (DB desconectada) |

---

## 🚀 Testing con cURL

### Crear ambulancia
```bash
curl -X POST http://localhost:5000/api/ambulancias \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "TEST-001",
    "numero_de_serie": "AMB-TEST-001",
    "modelo": "Test Model",
    "tipo": "Tipo I",
    "institucion_procedencia": "Test Hospital",
    "latitud": 19.7014,
    "longitud": -101.1843
  }'
```

### Actualizar estado
```bash
curl -X PATCH http://localhost:5000/api/ambulancias/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado": "ocupado"}'
```

### Iniciar simulador
```bash
curl -X POST http://localhost:5000/api/simulador/iniciar \
  -H "Content-Type: application/json" \
  -d '{"intervalo": 3000}'
```

---

## 🔐 Notas de Seguridad

Para producción, considera implementar:
- ✅ Autenticación JWT
- ✅ Rate limiting
- ✅ Validación de datos con Joi o Yup
- ✅ HTTPS
- ✅ Sanitización de inputs
- ✅ CORS restrictivo

---

## 📝 Licencia

MIT