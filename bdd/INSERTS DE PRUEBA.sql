--Los datos están hechos con coordenadas en longitud y latitud acordes a Morelia, Michoacán para las pruebas dentro del mapa. 

INSERT INTO ambulancias (
    placa, numero_de_serie, modelo, tipo, institucion_procedencia, ultima_revision, latitud, longitud, estado
) VALUES
('ABC-1234', 'SN10001', 'Ford Transit 2020', 'Soporte Vital Avanzado', 'Hospital Regional', '2025-05-04', 19.680305, -101.170535, 'ocupado'),
('DEF-5678', 'SN10002', 'Mercedes Sprinter 2019', 'Soporte Vital Avanzado', 'Cruz Roja', '2025-09-22', 19.719416, -101.219646, 'fuera de servicio'),
('GHI-9012', 'SN10003', 'Renault Master 2021', 'Tipo III', 'Hospital Regional', '2025-05-04', 19.697064, -101.219418, 'en mantenimiento'),
('JKL-3456', 'SN10004', 'Iveco Daily 2022', 'Tipo II', 'Hospital Central', '2025-06-18', 19.716946, -101.208541, 'ocupado'),
('MNO-7890', 'SN10005', 'Fiat Ducato 2020', 'Tipo III', 'Hospital Central', '2025-07-17', 19.729167, -101.188867, 'disponible'),
('PQR-2345', 'SN10006', 'Volkswagen Crafter 2018', 'Tipo I', 'Cruz Roja', '2025-05-13', 19.725255, -101.197890, 'disponible'),
('STU-6789', 'SN10007', 'Peugeot Boxer 2021', 'Soporte Vital Básico', 'Cruz Verde', '2025-06-20', 19.713830, -101.188015, 'ocupado'),
('VWX-0123', 'SN10008', 'Toyota Hiace 2019', 'Soporte Vital Básico', 'Hospital Central', '2025-05-10', 19.726299, -101.210259, 'disponible'),
('YZA-4567', 'SN10009', 'Nissan NV350 2022', 'Tipo II', 'Cruz Verde', '2025-07-13', 19.705189, -101.185893, 'fuera de servicio'),
('BCD-8901', 'SN10010', 'Ford Transit 2023', 'Tipo III', 'Hospital Regional', '2025-07-06', 19.702484, -101.193092, 'fuera de servicio');
