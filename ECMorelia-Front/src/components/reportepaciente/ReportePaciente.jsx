// src/components/ReportePaciente.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from "react-router-dom";

const ReportePaciente = () => {
  const navigate = useNavigate();

  const [seccionActiva, setSeccionActiva] = useState('');
  const [reporte, setReporte] = useState({
    paciente: {
      nombre: '',
      edad: '',
      sexo: '',
      motivo_urgencia: '',
      descripcion_lesion: '',
      tipo_accidente: '',
      lugar: '',
      observaciones: '',
    },
    signos_vitales: {
      frecuencia_cardiaca: '',
      frecuencia_respiratoria: '',
      tension_arterial: '',
      saturacion_oxigeno: '',
      temperatura: '',
      nivel_glucosa: '',
      estado_neurologico: '',
    },
    id_ambulancia: '',
    hora_estimada_llegada: '',
    ubicacion_actual: '',
    condicion_actual: '', // Añadido en el nivel raíz
    codigo_prioridad: '',
    descripcion_escena: '',
    otros_hallazgos: '',
    instrucciones_hospital: '',
    intervenciones: [],
  });

  const seccionRefs = {
    identificacion_servicio: useRef(null),
    resumen_inicial: useRef(null),
    signos_vitales: useRef(null),
    intervenciones_realizadas: useRef(null),
    hallazgos_relevantes: useRef(null),
    instrucciones_requeridas: useRef(null),
    codigo_prioridad: useRef(null),
  };
  
  const [socket, setSocket] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [intervencionActual, setIntervencionActual] = useState({
    tipo_intervencion: '',
    descripcion: '',
    hora_intervencion: '',
  });

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8081');

    ws.onopen = () => {
      console.log('Conectado al servidor de WebSockets');
    };

    ws.onmessage = async (event) => {
      let data;
      if (event.data instanceof Blob) {
        data = await event.data.text();
      } else {
        data = event.data;
      }

      console.log('Mensaje recibido del servidor:', data);

      try {
        const parsedData = JSON.parse(data);
        if (parsedData.tipo === 'navegacion') {
          setSeccionActiva(parsedData.seccion);
        } else if (parsedData.tipo === 'llenado') {
          const keys = Object.keys(parsedData.datos);
          keys.forEach((key) => {
            const path = key.split('.');
            setReporte((prevReporte) => {
              const updatedReporte = { ...prevReporte };
              let current = updatedReporte;
              for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
              }
              current[path[path.length - 1]] = parsedData.datos[key];
              return updatedReporte;
            });
          });
        }
      } catch (error) {
        console.error('Error al parsear el mensaje:', error);
        setMensajeError('Error al procesar los datos recibidos.');
      }
    };

    ws.onclose = () => {
      console.log('Desconectado del servidor de WebSockets');
    };

    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (seccionActiva && seccionRefs[seccionActiva] && seccionRefs[seccionActiva].current) {
      seccionRefs[seccionActiva].current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [seccionActiva]);

  const obtenerClaseSeccion = (seccion) =>
    seccionActiva === seccion ? 'seccion-activa' : 'seccion-inactiva';

  const handleChange = (path, value) => {
    setReporte((prevReporte) => {
      const updatedReporte = { ...prevReporte };
      let current = updatedReporte;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return updatedReporte;
    });
  };

  const handleIntervencionChange = (field, value) => {
    setIntervencionActual((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const agregarIntervencion = () => {
    if (
      intervencionActual.tipo_intervencion.trim() !== '' &&
      intervencionActual.descripcion.trim() !== '' &&
      intervencionActual.hora_intervencion.trim() !== ''
    ) {
      setReporte((prevReporte) => ({
        ...prevReporte,
        intervenciones: [...prevReporte.intervenciones, intervencionActual],
      }));
      setIntervencionActual({
        tipo_intervencion: '',
        descripcion: '',
        hora_intervencion: '',
      });
    } else {
      alert('Por favor, complete todos los campos de la intervención.');
    }
  };

  const eliminarIntervencion = (index) => {
    setReporte((prevReporte) => ({
      ...prevReporte,
      intervenciones: prevReporte.intervenciones.filter((_, i) => i !== index),
    }));
  };

  const combinarFechaYHora = (hora) => {
    const fechaActual = new Date();
    const [horas, minutos] = hora.split(':');
    fechaActual.setHours(parseInt(horas), parseInt(minutos), 0, 0);
    const tzOffset = fechaActual.getTimezoneOffset() * 60000;
    const fechaLocal = new Date(fechaActual - tzOffset);
    return fechaLocal.toISOString();
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    const reporteParaEnviar = { ...reporte };

    if (reporte.hora_estimada_llegada) {
      reporteParaEnviar.hora_estimada_llegada = combinarFechaYHora(reporte.hora_estimada_llegada);
    }

    reporteParaEnviar.intervenciones = reporte.intervenciones.map((intervencion) => {
      const intervencionFormateada = { ...intervencion };
      if (intervencion.hora_intervencion) {
        intervencionFormateada.hora_intervencion = combinarFechaYHora(intervencion.hora_intervencion);
      }
      return intervencionFormateada;
    });

    try {
      console.log('Reporte a enviar:', JSON.stringify(reporteParaEnviar, null, 2));

      const response = await fetch('http://localhost:3000/reporte-prehospitalario/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reporteParaEnviar),
      });

      if (response.ok) {
        console.log('Reporte enviado exitosamente');
        alert('Reporte enviado exitosamente');
        setReporte({
          paciente: {
            nombre: '',
            edad: '',
            sexo: '',
            motivo_urgencia: '',
            descripcion_lesion: '',
            tipo_accidente: '',
            lugar: '',
            observaciones: '',
          },
          signos_vitales: {
            frecuencia_cardiaca: '',
            frecuencia_respiratoria: '',
            tension_arterial: '',
            saturacion_oxigeno: '',
            temperatura: '',
            nivel_glucosa: '',
            estado_neurologico: '',
          },
          id_ambulancia: '',
          hora_estimada_llegada: '',
          ubicacion_actual: '',
          condicion_actual: '', // Asegúrate de resetear este campo
          codigo_prioridad: '',
          descripcion_escena: '',
          otros_hallazgos: '',
          instrucciones_hospital: '',
          intervenciones: [],
        });
      } else {
        console.error('Error al enviar el reporte');
        alert('Error al enviar el reporte');
      }
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Error en la solicitud');
    }
  };

  return (
    <div className="reporte-container p-5 bg-gray-100">
      {mensajeError && (
        <div className="error-mensaje bg-red-100 text-red-600 p-4 mb-5 border border-red-600 rounded-md">
          {mensajeError}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="form-reporte max-w-6xl mx-auto bg-white p-7 rounded-lg shadow-md"
      >
        {/* 1. Identificación del Servicio */}
        <fieldset
          ref={seccionRefs.identificacion_servicio}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('identificacion_servicio')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-2">
            1. Identificación del Servicio
          </legend>
          <label className="block font-bold text-gray-700 mb-1">Número de ambulancia:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.id_ambulancia}
            onChange={(e) => handleChange(['id_ambulancia'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">
            Hora estimada de llegada al hospital:
          </label>
          <input
            type="time"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.hora_estimada_llegada}
            onChange={(e) => handleChange(['hora_estimada_llegada'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Ubicación actual:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.ubicacion_actual}
            onChange={(e) => handleChange(['ubicacion_actual'], e.target.value)}
            required
          />
        </fieldset>
  
        {/* 2. Resumen Inicial del Paciente */}
        <fieldset
          ref={seccionRefs.resumen_inicial}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('resumen_inicial')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-2">
            2. Resumen Inicial del Paciente (Contexto General)
          </legend>
          <label className="block font-bold text-gray-700 mb-1">Nombre del paciente:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.nombre}
            onChange={(e) => handleChange(['paciente', 'nombre'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Edad:</label>
          <input
            type="number"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.edad}
            onChange={(e) => handleChange(['paciente', 'edad'], parseInt(e.target.value, 10))}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Género:</label>
          <div className="radio-group flex gap-5 mb-4">
            <label className="text-gray-700">
              <input
                type="radio"
                name="genero"
                value="M"
                className="mr-2"
                checked={reporte.paciente.sexo === 'M'}
                onChange={(e) => handleChange(['paciente', 'sexo'], e.target.value)}
              />
              Masculino
            </label>
            <label className="text-gray-700">
              <input
                type="radio"
                name="genero"
                value="F"
                className="mr-2"
                checked={reporte.paciente.sexo === 'F'}
                onChange={(e) => handleChange(['paciente', 'sexo'], e.target.value)}
              />
              Femenino
            </label>
          </div>
          <label className="block font-bold text-gray-700 mb-1">Motivo de urgencia:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.motivo_urgencia}
            onChange={(e) => handleChange(['paciente', 'motivo_urgencia'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Descripción de la lesión:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.descripcion_lesion}
            onChange={(e) => handleChange(['paciente', 'descripcion_lesion'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">
            Lugar donde se encontró al paciente:
          </label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.lugar}
            onChange={(e) => handleChange(['paciente', 'lugar'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Tipo de accidente:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.tipo_accidente}
            onChange={(e) => handleChange(['paciente', 'tipo_accidente'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Observaciones adicionales:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.observaciones}
            onChange={(e) => handleChange(['paciente', 'observaciones'], e.target.value)}
          />
        </fieldset>
  
        {/* 3. Signos Vitales */}
        <fieldset
          ref={seccionRefs.signos_vitales}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('signos_vitales')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-2">
            3. Signos Vitales Iniciales y Monitoreo
          </legend>
          <label className="block font-bold text-gray-700 mb-1">Frecuencia cardíaca:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.frecuencia_cardiaca}
            onChange={(e) => handleChange(['signos_vitales', 'frecuencia_cardiaca'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Frecuencia respiratoria:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.frecuencia_respiratoria}
            onChange={(e) => handleChange(['signos_vitales', 'frecuencia_respiratoria'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Presión arterial:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.tension_arterial}
            onChange={(e) => handleChange(['signos_vitales', 'tension_arterial'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Saturación de oxígeno:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.saturacion_oxigeno}
            onChange={(e) => handleChange(['signos_vitales', 'saturacion_oxigeno'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Temperatura corporal:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.temperatura}
            onChange={(e) => handleChange(['signos_vitales', 'temperatura'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Nivel de glucosa:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.nivel_glucosa}
            onChange={(e) => handleChange(['signos_vitales', 'nivel_glucosa'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-1">Estado neurológico:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.signos_vitales.estado_neurologico}
            onChange={(e) => handleChange(['signos_vitales', 'estado_neurologico'], e.target.value)}
            required
          />
        </fieldset>
  
        {/* 4. Intervenciones Realizadas */}
        <fieldset
          ref={seccionRefs.intervenciones_realizadas}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('intervenciones_realizadas')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-4">
            4. Intervenciones Realizadas
          </legend>
          {reporte.intervenciones.map((intervencion, index) => (
            <div
              key={index}
              className="intervencion-item bg-gray-100 p-4 border border-gray-300 rounded-lg mb-4"
            >
              <p className="font-bold">Intervención {index + 1}:</p>
              <p>
                <span className="font-semibold">Tipo:</span> {intervencion.tipo_intervencion}
              </p>
              <p>
                <span className="font-semibold">Descripción:</span> {intervencion.descripcion}
              </p>
              <p>
                <span className="font-semibold">Hora de intervención:</span>{' '}
                {intervencion.hora_intervencion}
              </p>
              <button
                type="button"
                onClick={() => eliminarIntervencion(index)}
                className="boton-eliminar bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          ))}
          <div className="intervencion-nueva border-2 border-dashed border-gray-300 p-4 rounded-lg">
            <h4 className="text-lg font-bold mb-2">Agregar Nueva Intervención</h4>
            <label className="block font-bold text-gray-700 mb-2">Tipo de intervención:</label>
            <input
              type="text"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              value={intervencionActual.tipo_intervencion}
              onChange={(e) => handleIntervencionChange('tipo_intervencion', e.target.value)}
            />
            <label className="block font-bold text-gray-700 mb-2">Descripción:</label>
            <textarea
              className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              value={intervencionActual.descripcion}
              onChange={(e) => handleIntervencionChange('descripcion', e.target.value)}
            />
            <label className="block font-bold text-gray-700 mb-2">Hora de intervención:</label>
            <input
              type="time"
              className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
              value={intervencionActual.hora_intervencion}
              onChange={(e) => handleIntervencionChange('hora_intervencion', e.target.value)}
            />
            <button
              type="button"
              onClick={agregarIntervencion}
              className="boton-agregar bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Agregar Intervención
            </button>
          </div>
        </fieldset>
  
        {/* 5. Hallazgos Relevantes */}
        <fieldset
          ref={seccionRefs.hallazgos_relevantes}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('hallazgos_relevantes')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-4">5. Hallazgos Relevantes</legend>
          <label className="block font-bold text-gray-700 mb-2">Escena:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.descripcion_escena}
            onChange={(e) => handleChange(['descripcion_escena'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-2">Lesiones visibles:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.paciente.descripcion_lesion}
            onChange={(e) => handleChange(['paciente', 'descripcion_lesion'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-2">Otros hallazgos:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.otros_hallazgos}
            onChange={(e) => handleChange(['otros_hallazgos'], e.target.value)}
            required
          />
        </fieldset>
  
        {/* 6. Instrucciones Requeridas */}
        <fieldset
          ref={seccionRefs.instrucciones_requeridas}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('instrucciones_requeridas')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-4">
            6. Instrucciones Requeridas (Opcional)
          </legend>
          <label className="block font-bold text-gray-700 mb-2">Sugerencias para el hospital:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.instrucciones_hospital}
            onChange={(e) => handleChange(['instrucciones_hospital'], e.target.value)}
          />
        </fieldset>
  
        {/* 7. Código de Prioridad */}
        <fieldset
          ref={seccionRefs.codigo_prioridad}
          className={`campo-reporte mb-8 ${obtenerClaseSeccion('codigo_prioridad')}`}
        >
          <legend className="font-bold text-xl text-gray-800 mb-4">7. Código de Prioridad</legend>
          <label className="block font-bold text-gray-700 mb-2">Código de prioridad:</label>
          <input
            type="text"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.codigo_prioridad}
            onChange={(e) => handleChange(['codigo_prioridad'], e.target.value)}
            required
          />
          <label className="block font-bold text-gray-700 mb-2">Condición actual:</label>
          <textarea
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
            value={reporte.condicion_actual}
            onChange={(e) => handleChange(['condicion_actual'], e.target.value)}
            required
          />
        </fieldset>
  
        {/* Botón de Envío */}
        <button
          type="submit"
          className="boton-envio w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Enviar Reporte
        </button>
  
        {/* Botón Llamada */}
        <button
          id="botonLlamada"
          className="relative inline-flex items-center justify-center p-0.5 mb-2 me-4 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-orange-400 to-orange-600 group-hover:from-orange-400 group-hover:to-orange-600 hover:text-white focus:ring-4 focus:outline-none focus:ring-orange-200"
          onClick={() => navigate('/videocall')}
        >
          <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-white rounded-md group-hover:bg-opacity-0 text-xl">
            Llamada
          </span>
        </button>
      </form>
      <Outlet />
    </div>
  );
  };

export default ReportePaciente;