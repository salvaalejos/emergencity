CREATE TYPE tipo_ambulancia_enum AS ENUM (
    'Tipo I',
    'Tipo II',
    'Tipo III',
    'Soporte Vital Básico',
    'Soporte Vital Avanzado'
);

CREATE TYPE estado_ambulancia_enum AS ENUM (
    'disponible',
    'ocupado',
    'en mantenimiento',
    'fuera de servicio'
);

-- Ahora, creamos la tabla principal para las ambulancias

CREATE TABLE ambulancias (
    -- Campos básicos de identificación
    id_ambulancia SERIAL PRIMARY KEY,
    placa VARCHAR(15) NOT NULL UNIQUE,
    numero_de_serie VARCHAR(20) NOT NULL UNIQUE,
    modelo VARCHAR(50),

    -- Campos descriptivos
    tipo tipo_ambulancia_enum NOT NULL,
    institucion_procedencia VARCHAR(100),
    ultima_revision DATE,

    -- Campos de ubicación y estado (añadidos)
    latitud DECIMAL(9, 6) NOT NULL, -- Para la ubicación GPS
    longitud DECIMAL(9, 6) NOT NULL, -- Para la ubicación GPS
    estado estado_ambulancia_enum NOT NULL DEFAULT 'disponible', -- Crucial para la lógica de asignación

    -- Campos de auditoría (buenas prácticas)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);