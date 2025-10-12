const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Configuración de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'Emergencity',
  password: process.env.DB_PASSWORD || '12345',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== RUTAS API ====================

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Obtener todas las ambulancias
app.get('/api/ambulancias', async (req, res) => {
  try {
    const { estado, tipo } = req.query;
    let query = 'SELECT * FROM ambulancias WHERE 1=1';
    const params = [];

    if (estado) {
      params.push(estado);
      query += ` AND estado = $${params.length}`;
    }

    if (tipo) {
      params.push(tipo);
      query += ` AND tipo = $${params.length}`;
    }

    query += ' ORDER BY id_ambulancia ASC';

    const result = await pool.query(query, params);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener ambulancias:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener ambulancias',
      details: error.message 
    });
  }
});

// Obtener una ambulancia por ID
app.get('/api/ambulancias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM ambulancias WHERE id_ambulancia = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulancia no encontrada' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener ambulancia:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener ambulancia',
      details: error.message 
    });
  }
});

// Crear nueva ambulancia
app.post('/api/ambulancias', async (req, res) => {
  try {
    const {
      placa,
      numero_de_serie,
      modelo,
      tipo,
      institucion_procedencia,
      ultima_revision,
      latitud,
      longitud,
      estado
    } = req.body;

    // Validaciones
    if (!placa || !numero_de_serie || !tipo || !latitud || !longitud) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: placa, numero_de_serie, tipo, latitud, longitud'
      });
    }

    const result = await pool.query(
      `INSERT INTO ambulancias 
       (placa, numero_de_serie, modelo, tipo, institucion_procedencia, 
        ultima_revision, latitud, longitud, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [placa, numero_de_serie, modelo, tipo, institucion_procedencia, 
       ultima_revision, latitud, longitud, estado || 'disponible']
    );

    // Notificar a todos los clientes
    io.emit('ambulancia:nueva', result.rows[0]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Ambulancia creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear ambulancia:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una ambulancia con esa placa o número de serie'
      });
    }
    res.status(500).json({ 
      success: false, 
      error: 'Error al crear ambulancia',
      details: error.message 
    });
  }
});

// Actualizar ambulancia
app.put('/api/ambulancias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      placa,
      numero_de_serie,
      modelo,
      tipo,
      institucion_procedencia,
      ultima_revision,
      latitud,
      longitud,
      estado
    } = req.body;

    const result = await pool.query(
      `UPDATE ambulancias 
       SET placa = COALESCE($1, placa),
           numero_de_serie = COALESCE($2, numero_de_serie),
           modelo = COALESCE($3, modelo),
           tipo = COALESCE($4, tipo),
           institucion_procedencia = COALESCE($5, institucion_procedencia),
           ultima_revision = COALESCE($6, ultima_revision),
           latitud = COALESCE($7, latitud),
           longitud = COALESCE($8, longitud),
           estado = COALESCE($9, estado),
           updated_at = NOW()
       WHERE id_ambulancia = $10
       RETURNING *`,
      [placa, numero_de_serie, modelo, tipo, institucion_procedencia,
       ultima_revision, latitud, longitud, estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulancia no encontrada' 
      });
    }

    // Notificar actualización
    io.emit('ambulancia:actualizada', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Ambulancia actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar ambulancia:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar ambulancia',
      details: error.message 
    });
  }
});

// Actualizar ubicación de ambulancia
app.patch('/api/ambulancias/:id/ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitud, longitud } = req.body;

    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren latitud y longitud'
      });
    }

    const result = await pool.query(
      `UPDATE ambulancias 
       SET latitud = $1, longitud = $2, updated_at = NOW()
       WHERE id_ambulancia = $3
       RETURNING *`,
      [latitud, longitud, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulancia no encontrada' 
      });
    }

    // Notificar cambio de ubicación
    io.emit('ambulancia:ubicacion', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar ubicación',
      details: error.message 
    });
  }
});

// Actualizar estado de ambulancia
app.patch('/api/ambulancias/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['disponible', 'ocupado', 'en mantenimiento', 'fuera de servicio'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
      });
    }

    const result = await pool.query(
      `UPDATE ambulancias 
       SET estado = $1, updated_at = NOW()
       WHERE id_ambulancia = $2
       RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulancia no encontrada' 
      });
    }

    // Notificar cambio de estado
    io.emit('ambulancia:estado', result.rows[0]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al actualizar estado',
      details: error.message 
    });
  }
});

// Eliminar ambulancia
app.delete('/api/ambulancias/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM ambulancias WHERE id_ambulancia = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ambulancia no encontrada' 
      });
    }

    // Notificar eliminación
    io.emit('ambulancia:eliminada', { id: parseInt(id) });

    res.json({
      success: true,
      message: 'Ambulancia eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al eliminar ambulancia:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al eliminar ambulancia',
      details: error.message 
    });
  }
});

// Estadísticas de ambulancias
app.get('/api/ambulancias/stats/resumen', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'disponible') as disponibles,
        COUNT(*) FILTER (WHERE estado = 'ocupado') as ocupadas,
        COUNT(*) FILTER (WHERE estado = 'en mantenimiento') as en_mantenimiento,
        COUNT(*) FILTER (WHERE estado = 'fuera de servicio') as fuera_servicio
      FROM ambulancias
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al obtener estadísticas',
      details: error.message 
    });
  }
});

// ==================== WEBSOCKETS ====================

io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  // Enviar datos iniciales
  socket.on('solicitar:ambulancias', async () => {
    try {
      const result = await pool.query('SELECT * FROM ambulancias ORDER BY id_ambulancia');
      socket.emit('ambulancias:inicial', result.rows);
    } catch (error) {
      console.error('Error al enviar datos iniciales:', error);
      socket.emit('error', { message: 'Error al cargar ambulancias' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Cliente desconectado: ${socket.id}`);
  });
});

// ==================== SIMULADOR DE MOVIMIENTO ====================

class SimuladorMovimiento {
  constructor(pool, io) {
    this.pool = pool;
    this.io = io;
    this.intervalos = new Map();
    this.activo = false;
  }

  // Calcular nuevo punto en dirección aleatoria
  calcularNuevaPosicion(lat, lon, distanciaKm) {
    const radioTierra = 6371; // km
    const angulo = Math.random() * 2 * Math.PI;
    
    const deltaLat = (distanciaKm / radioTierra) * (180 / Math.PI) * Math.cos(angulo);
    const deltaLon = (distanciaKm / radioTierra) * (180 / Math.PI) * Math.sin(angulo) / Math.cos(lat * Math.PI / 180);
    
    return {
      lat: parseFloat((lat + deltaLat).toFixed(6)),
      lon: parseFloat((lon + deltaLon).toFixed(6))
    };
  }

  async moverAmbulancia(id) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM ambulancias WHERE id_ambulancia = $1 AND estado = $2',
        [id, 'ocupado']
      );

      if (result.rows.length === 0) return;

      const ambulancia = result.rows[0];
      const lat = parseFloat(ambulancia.latitud);
      const lon = parseFloat(ambulancia.longitud);

      // Mover entre 50 y 200 metros aleatoriamente
      const distancia = (Math.random() * 0.15 + 0.05); // 0.05-0.2 km
      const nuevaPos = this.calcularNuevaPosicion(lat, lon, distancia);

      const updated = await this.pool.query(
        `UPDATE ambulancias 
         SET latitud = $1, longitud = $2, updated_at = NOW()
         WHERE id_ambulancia = $3
         RETURNING *`,
        [nuevaPos.lat, nuevaPos.lon, id]
      );

      if (updated.rows.length > 0) {
        this.io.emit('ambulancia:ubicacion', updated.rows[0]);
        console.log(`📍 Ambulancia ${id} movida a: ${nuevaPos.lat}, ${nuevaPos.lon}`);
      }
    } catch (error) {
      console.error(`Error al mover ambulancia ${id}:`, error);
    }
  }

  async iniciar(intervaloMs = 3000) {
    if (this.activo) {
      console.log('⚠️  Simulador ya está activo');
      return;
    }

    this.activo = true;
    console.log('🚀 Iniciando simulador de movimiento...');

    try {
      const result = await this.pool.query(
        'SELECT id_ambulancia FROM ambulancias WHERE estado = $1',
        ['ocupado']
      );

      result.rows.forEach(row => {
        const intervalo = setInterval(() => {
          this.moverAmbulancia(row.id_ambulancia);
        }, intervaloMs);

        this.intervalos.set(row.id_ambulancia, intervalo);
        console.log(`✅ Simulación iniciada para ambulancia ${row.id_ambulancia}`);
      });

      if (result.rows.length === 0) {
        console.log('⚠️  No hay ambulancias en estado "ocupado" para simular');
      }
    } catch (error) {
      console.error('Error al iniciar simulador:', error);
      this.activo = false;
    }
  }

  detener() {
    if (!this.activo) {
      console.log('⚠️  Simulador no está activo');
      return;
    }

    console.log('🛑 Deteniendo simulador de movimiento...');
    this.intervalos.forEach((intervalo, id) => {
      clearInterval(intervalo);
      console.log(`❌ Simulación detenida para ambulancia ${id}`);
    });

    this.intervalos.clear();
    this.activo = false;
  }

  async agregarAmbulancia(id) {
    if (!this.activo) return;

    const result = await this.pool.query(
      'SELECT * FROM ambulancias WHERE id_ambulancia = $1 AND estado = $2',
      [id, 'ocupado']
    );

    if (result.rows.length > 0 && !this.intervalos.has(id)) {
      const intervalo = setInterval(() => {
        this.moverAmbulancia(id);
      }, 3000);

      this.intervalos.set(id, intervalo);
      console.log(`✅ Ambulancia ${id} agregada al simulador`);
    }
  }

  removerAmbulancia(id) {
    if (this.intervalos.has(id)) {
      clearInterval(this.intervalos.get(id));
      this.intervalos.delete(id);
      console.log(`❌ Ambulancia ${id} removida del simulador`);
    }
  }
}

const simulador = new SimuladorMovimiento(pool, io);

// Endpoints para controlar el simulador
app.post('/api/simulador/iniciar', async (req, res) => {
  try {
    const { intervalo } = req.body;
    await simulador.iniciar(intervalo || 3000);
    res.json({
      success: true,
      message: 'Simulador iniciado',
      ambulancias_activas: simulador.intervalos.size
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al iniciar simulador',
      details: error.message
    });
  }
});

app.post('/api/simulador/detener', (req, res) => {
  try {
    simulador.detener();
    res.json({
      success: true,
      message: 'Simulador detenido'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al detener simulador',
      details: error.message
    });
  }
});

app.get('/api/simulador/estado', (req, res) => {
  res.json({
    success: true,
    activo: simulador.activo,
    ambulancias_simuladas: simulador.intervalos.size,
    intervalos: Array.from(simulador.intervalos.keys())
  });
});

// ==================== SERVIDOR ====================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║         SISTEMA DE AMBULANCIAS - EMERGENCITY          ║
╠═══════════════════════════════════════════════════════╣
║  Servidor iniciado en puerto: ${PORT}                    ║
║  Base de datos: PostgreSQL                            ║
║  WebSockets: Activo                                   ║
║  API REST: http://localhost:${PORT}/api                  ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  simulador.detener();
  pool.end();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = { app, server, pool, simulador };