// src/components/Mapa/Operadores.jsx

import React, { useState, useEffect } from "react"; // Import React
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button"; // Importar Button de PrimeReact
import { Dropdown } from "primereact/dropdown"; // Importar Dropdown
import { useFecthData } from "./useFetchData";

// Tipos de turno para el Dropdown
const turnosOptions = [
	{ label: 'Diurno', value: 'diurno' },
	{ label: 'Nocturno', value: 'nocturno' }
];

export default function Operadores() {
	const [operadores, setOperadores] = useState([]); // Inicializa como array vacío
	const [dialogVisible, setDialogVisible] = useState(false);
	const [editMode, setEditMode] = useState(false);
	// Asegúrate de que los campos coincidan con el backend (ej. id)
	const [newOperador, setNewOperador] = useState({ id: null, nombre: "", licencia_medica: "", turno: "" });
	const { addRecord, deleteRecord, getAllRecord, updateRecord } = useFecthData("operador");

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllRecord();
				setOperadores(data || []); // Asegura que sea un array
			} catch (error) {
				console.error("Error fetching operadores:", error);
				setOperadores([]); // En caso de error, inicializa vacío
			}
		};

		fetchData();
	}, []); // Dependencia vacía

	const openDialog = (operador = null) => {
		if (operador) {
			setNewOperador({ ...operador }); // Carga datos existentes
			setEditMode(true);
		} else {
			// Resetea para 'agregar'
			setNewOperador({ id: null, nombre: "", licencia_medica: "", turno: "" });
			setEditMode(false);
		}
		setDialogVisible(true);
	};

	const saveOperador = async () => {
		try {
			// Prepara los datos a enviar
			const dataToSend = { ...newOperador };
			// El ID no se envía si es un nuevo registro y es autogenerado
			if (!editMode) {
				delete dataToSend.id;
			}

			// Validaciones básicas
			if (!dataToSend.nombre || !dataToSend.licencia_medica || !dataToSend.turno) {
				console.error("Nombre, Licencia Médica y Turno son requeridos");
				// Mostrar mensaje al usuario
				return;
			}

			if (editMode) {
				// Usa licencia_medica como ID para actualizar según tu código original
				await updateRecord({ id: newOperador.licencia_medica, data: dataToSend });
				// Actualiza el estado local
				setOperadores(operadores.map((o) => (o.id === newOperador.id ? dataToSend : o)));
			} else {
				await addRecord(dataToSend);
				// Refetchea la lista
				const updatedData = await getAllRecord();
				setOperadores(updatedData || []);
			}
			setDialogVisible(false);
		} catch (error) {
			console.error("Error saving operador:", error);
			// Mostrar mensaje al usuario
		}
	};

	const deleteOperador = async (id) => { // Recibe la licencia_medica como id según tu código original
		try {
			await deleteRecord(id);
			// Actualiza el estado local filtrando por licencia_medica
			setOperadores(operadores.filter((o) => o.licencia_medica !== id));
		} catch (error) {
			console.error("Error deleting operador:", error);
			// Mostrar mensaje al usuario
		}
	};

	// Plantilla para mostrar el turno con estilo
	const turnoBodyTemplate = (rowData) => {
		const isDiurno = rowData.turno?.toLowerCase() === 'diurno';
		return (
			<span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
				isDiurno
					? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300' // Estilo Diurno
					: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-700/30 dark:text-indigo-300' // Estilo Nocturno
			}`}>
				{rowData.turno || 'N/A'}
			</span>
		);
	};

	return (
		// Contenedor principal - NUEVOS COLORES 👇
		<div className="p-4 sm:p-6 bg-smoke-white dark:bg-bluish-gray text-bluish-gray dark:text-smoke-white min-h-full rounded-lg shadow-md">
			<h2 className="text-center text-xl sm:text-2xl mb-6 font-semibold text-sky-blue"> {/* Color título */}
				Gestión de Operadores 📞
			</h2>

			{/* Botón Agregar - NUEVOS COLORES 👇 */}
			<div className="flex justify-end mb-4">
				<button
					// Usando verde menta, consistente
					className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-bluish-gray dark:text-smoke-white rounded-lg group bg-gradient-to-br from-mint-green to-green-400 group-hover:from-mint-green group-hover:to-green-400 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-150 ease-in"
					onClick={() => openDialog()}
				>
					<span className="relative px-6 py-2 transition-all ease-in duration-75 bg-white dark:bg-gray-800 rounded-md group-hover:bg-opacity-0 font-medium">
						<i className="pi pi-plus mr-2"></i>
						Agregar Operador
					</span>
				</button>
			</div>

			{/* Tabla - Estilos generales 👇 */}
			<div className="card overflow-hidden shadow border border-gray-200 dark:border-gray-700 rounded-lg">
				<DataTable
					value={operadores}
					responsiveLayout="scroll"
					paginator rows={10} rowsPerPageOptions={[5, 10, 25]}
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
					currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} operadores"
					emptyMessage="No se encontraron operadores."
					className="p-datatable-sm"
					pt={{ // PassThrough para estilos internos
						thead: { className: 'bg-gray-100 dark:bg-gray-700 text-sm' },
						tbody: { className: 'bg-white dark:bg-bluish-gray divide-y divide-gray-200 dark:divide-gray-700' }
					}}
				>
					<Column field="nombre" header="Nombre" sortable filter filterPlaceholder="Buscar por nombre" style={{ minWidth: '150px' }} />
					<Column
						field="turno"
						header="Turno"
						body={turnoBodyTemplate} // Usa la plantilla con colores
						sortable
						filter // Podrías añadir filtro si tienes muchos datos
						filterPlaceholder="Buscar por turno"
						style={{ minWidth: '100px', textAlign: 'center' }}
						headerStyle={{ textAlign: 'center' }}
					/>
					<Column field="licencia_medica" header="Licencia Médica" sortable filter filterPlaceholder="Buscar por licencia" style={{ minWidth: '150px' }} />
					<Column
						header="Acciones"
						headerStyle={{ width: '8rem', textAlign: 'center' }}
						bodyStyle={{ textAlign: 'center', justifyContent: 'center' }}
						body={(rowData) => (
							<div className="flex gap-2 justify-center">
								{/* Botón Editar - NUEVOS COLORES 👇 */}
								<Button
									icon="pi pi-pencil"
									rounded tooltip="Editar" tooltipOptions={{ position: 'top' }}
									// Azul cielo
									className="!bg-sky-blue hover:!bg-blue-400 !border-sky-blue hover:!border-blue-400 !text-white"
									onClick={() => openDialog(rowData)}
								/>
								{/* Botón Eliminar - NUEVOS COLORES 👇 */}
								<Button
									icon="pi pi-trash"
									rounded tooltip="Eliminar" tooltipOptions={{ position: 'top' }}
									// Rojo coral
									className="!bg-coral-red hover:!bg-red-400 !border-coral-red hover:!border-red-400 !text-white"
									// Pasa la licencia_medica al handler de eliminar
									onClick={() => deleteOperador(rowData.licencia_medica)}
								/>
							</div>
						)}
					/>
				</DataTable>
			</div>

			{/* Diálogo (Modal) - NUEVOS COLORES y Estructura 👇 */}
			<Dialog
				header={editMode ? "Editar Operador" : "Agregar Operador"}
				visible={dialogVisible}
				style={{ width: '90vw', maxWidth: '500px' }}
				modal
				onHide={() => setDialogVisible(false)}
				pt={{ // Estilos consistentes
					root: { className: 'rounded-lg overflow-hidden' },
					header: { className: 'bg-bluish-gray text-smoke-white p-4 text-lg font-semibold flex justify-between items-center' },
					content: { className: 'bg-smoke-white dark:bg-gray-800 p-5' },
					footer: { className: 'bg-gray-100 dark:bg-gray-700 p-4 flex justify-end gap-3' },
					closeButton: { className: '!text-smoke-white hover:!bg-gray-600 rounded-full' }
				}}
			>
				{/* Campo Nombre */}
				<div className="mb-4">
					<label htmlFor="nombre" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Nombre <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="nombre"
						value={newOperador.nombre}
						onChange={(e) => setNewOperador({ ...newOperador, nombre: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required autoFocus
					/>
				</div>

				{/* Campo Licencia Medica */}
				<div className="mb-4">
					<label htmlFor="licencia_medica" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Licencia Médica <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="licencia_medica"
						value={newOperador.licencia_medica}
						onChange={(e) => setNewOperador({ ...newOperador, licencia_medica: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
						disabled={editMode} // La licencia (ID para update) no debería cambiar en modo edición
					/>
				</div>

				{/* Campo Turno (Dropdown) */}
				<div className="mb-4">
					<label htmlFor="turno" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Turno <span className="text-coral-red">*</span>
					</label>
					<Dropdown
						id="turno"
						value={newOperador.turno}
						options={turnosOptions} // Usa las opciones definidas arriba
						onChange={(e) => setNewOperador({ ...newOperador, turno: e.value })}
						optionLabel="label" // Muestra 'Diurno'/'Nocturno'
						optionValue="value" // Guarda 'diurno'/'nocturno'
						placeholder="Selecciona un turno"
						// Estilos Dropdown consistentes
						className="w-full border border-gray-300 dark:border-gray-600 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue"
						pt={{ // Estilos internos del Dropdown
							root: { className: '!shadow-none' }, // Quita sombra por defecto
							input: { className: 'p-2 dark:bg-gray-700 dark:text-smoke-white capitalize' }, // Estilo input interno
							panel: { className: 'bg-white dark:bg-gray-700' }, // Fondo del panel desplegable
							item: { className: 'hover:bg-sky-blue/10 dark:hover:bg-sky-blue/20 dark:text-smoke-white capitalize' } // Estilo item
						}}
						required
					/>
				</div>

				{/* Pie de página y botones */}
				<div className="p-dialog-footer">
					<Button
						label="Cancelar" icon="pi pi-times"
						className="p-button-text !text-bluish-gray dark:!text-smoke-white hover:!bg-gray-200 dark:hover:!bg-gray-600"
						onClick={() => setDialogVisible(false)}
					/>
					<Button
						label={editMode ? "Guardar Cambios" : "Agregar"} icon="pi pi-check"
						className="!bg-mint-green hover:!bg-green-600 !border-mint-green hover:!border-green-600 !text-white"
						onClick={saveOperador}
					/>
				</div>
			</Dialog>
		</div>
	);
}
