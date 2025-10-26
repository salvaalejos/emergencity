// src/components/Mapa/Hospitales.jsx

import React, { useState, useEffect } from "react"; // Import React explícitamente si es necesario
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useFecthData } from "./useFetchData";
import { Button } from "primereact/button"; // Importar Button de PrimeReact

export default function Hospitales() {
	const { addRecord, deleteRecord, getAllRecord, updateRecord } = useFecthData("hospital");
	const [hospitales, setHospitales] = useState([]); // Inicializa como array vacío
	const [dialogVisible, setDialogVisible] = useState(false);
	const [editMode, setEditMode] = useState(false);
	// Incluye id_hospitales en el estado inicial, aunque sea null o vacío para 'agregar'
	const [newHospital, setNewHospital] = useState({ id_hospitales: null, nombre: "", direccion: "" });

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllRecord();
				setHospitales(data || []); // Asegura que sea un array
			} catch (error) {
				console.error("Error fetching hospitals:", error);
				setHospitales([]); // En caso de error, inicializa vacío
			}
		};
		fetchData();
	}, []); // Dependencia vacía

	// Función para abrir el diálogo
	const openDialog = (hospital = null) => {
		if (hospital) {
			setNewHospital({ ...hospital }); // Carga datos existentes
			setEditMode(true);
		} else {
			// Resetea para 'agregar', id_hospitales se genera en backend (o se omite si es serial)
			setNewHospital({ id_hospitales: null, nombre: "", direccion: "" });
			setEditMode(false);
		}
		setDialogVisible(true);
	};

	// Función para guardar (agregar o editar) hospital
	const saveHospital = async () => {
		try {
			// Prepara los datos a enviar, excluyendo id_hospitales si es null (para agregar)
			const dataToSend = { ...newHospital };
			if (!editMode) {
				delete dataToSend.id_hospitales; // El backend debería asignar el ID si es SERIAL
			}

			// Validaciones básicas antes de enviar
			if (!dataToSend.nombre || !dataToSend.direccion) {
				console.error("Nombre y dirección son requeridos");
				// Aquí podrías mostrar un mensaje de error al usuario
				return;
			}

			if (editMode) {
				await updateRecord({ id: newHospital.id_hospitales, data: dataToSend });
				// Actualiza el estado local
				setHospitales(hospitales.map((h) => (h.id_hospitales === newHospital.id_hospitales ? dataToSend : h)));
			} else {
				const addedRecord = await addRecord(dataToSend);
				// Actualiza lista (si la API devuelve el objeto) o refetchea
				// setHospitales([...hospitales, addedRecord]); // Si devuelve el objeto
				const updatedData = await getAllRecord(); // Refetchear
				setHospitales(updatedData || []);
			}
			setDialogVisible(false);
		} catch (error) {
			console.error("Error saving hospital:", error);
			// Mostrar mensaje de error al usuario
		}
	};

	// Función para eliminar hospital
	const deleteHospital = async (id) => {
		try {
			await deleteRecord(id);
			// Actualiza el estado local
			setHospitales(hospitales.filter((h) => h.id_hospitales !== id));
		} catch (error) {
			console.error("Error deleting hospital:", error);
			// Mostrar mensaje de error al usuario
		}
	};

	return (
		// Contenedor principal - NUEVOS COLORES 👇
		<div className="p-4 sm:p-6 bg-smoke-white dark:bg-bluish-gray text-bluish-gray dark:text-smoke-white min-h-full rounded-lg shadow-md">
			<h2 className="text-center text-xl sm:text-2xl mb-6 font-semibold text-sky-blue"> {/* Color título */}
				Gestión de Hospitales 🏥
			</h2>

			{/* Botón Agregar - NUEVOS COLORES 👇 */}
			<div className="flex justify-end mb-4">
				<button
					// Usando verde menta, consistente con Ambulancias.jsx
					className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-bluish-gray dark:text-smoke-white rounded-lg group bg-gradient-to-br from-mint-green to-green-400 group-hover:from-mint-green group-hover:to-green-400 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-150 ease-in"
					onClick={() => openDialog()} // Llama sin argumentos para 'agregar'
				>
					<span className="relative px-6 py-2 transition-all ease-in duration-75 bg-white dark:bg-gray-800 rounded-md group-hover:bg-opacity-0 font-medium">
						<i className="pi pi-plus mr-2"></i> {/* Ícono agregar */}
						Agregar Hospital
					</span>
				</button>
			</div>

			{/* Tabla - Estilos generales 👇 */}
			<div className="card overflow-hidden shadow border border-gray-200 dark:border-gray-700 rounded-lg">
				<DataTable
					value={hospitales}
					responsiveLayout="scroll"
					paginator rows={10} rowsPerPageOptions={[5, 10, 25]}
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
					currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} hospitales"
					emptyMessage="No se encontraron hospitales."
					className="p-datatable-sm"
					pt={{ // PassThrough para estilos internos
						thead: { className: 'bg-gray-100 dark:bg-gray-700 text-sm' }, // Cabecera, texto más pequeño
						tbody: { className: 'bg-white dark:bg-bluish-gray divide-y divide-gray-200 dark:divide-gray-700' }
					}}
				>
					{/* Columna ID (Opcional, a veces no se muestra al usuario) */}
					{/* <Column field="id_hospitales" header="ID" sortable style={{ width: '60px' }} /> */}
					<Column field="nombre" header="Nombre" sortable filter filterPlaceholder="Buscar por nombre" style={{ minWidth: '200px' }} />
					<Column field="direccion" header="Dirección" sortable filter filterPlaceholder="Buscar por dirección" style={{ minWidth: '300px' }} />
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
									onClick={() => deleteHospital(rowData.id_hospitales)}
								/>
							</div>
						)}
					/>
				</DataTable>
			</div>

			{/* Diálogo (Modal) - NUEVOS COLORES y Estructura 👇 */}
			<Dialog
				header={editMode ? "Editar Hospital" : "Agregar Hospital"}
				visible={dialogVisible}
				style={{ width: '90vw', maxWidth: '500px' }} // Ancho responsivo
				modal
				onHide={() => setDialogVisible(false)}
				pt={{ // PassThrough para estilos internos consistentes con Ambulancias.jsx
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
						value={newHospital.nombre}
						onChange={(e) => setNewHospital({ ...newHospital, nombre: e.target.value })}
						// Estilos input consistentes
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
						autoFocus // Enfoca este campo al abrir
					/>
				</div>

				{/* Campo Dirección */}
				<div className="mb-4">
					<label htmlFor="direccion" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Dirección <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="direccion"
						value={newHospital.direccion}
						onChange={(e) => setNewHospital({ ...newHospital, direccion: e.target.value })}
						// Estilos input consistentes
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
					/>
				</div>
				{/* Nota: El ID (id_hospitales) no se muestra ni se edita aquí, ya que usualmente es autogenerado o no modificable */}

				{/* Pie de página y botones (manejados con pt.footer) */}
				<div className="p-dialog-footer">
					<Button
						label="Cancelar"
						icon="pi pi-times"
						// Botón secundario gris
						className="p-button-text !text-bluish-gray dark:!text-smoke-white hover:!bg-gray-200 dark:hover:!bg-gray-600"
						onClick={() => setDialogVisible(false)}
					/>
					<Button
						label={editMode ? "Guardar Cambios" : "Agregar"}
						icon="pi pi-check"
						// Botón primario verde menta
						className="!bg-mint-green hover:!bg-green-600 !border-mint-green hover:!border-green-600 !text-white"
						onClick={saveHospital}
					/>
				</div>
			</Dialog>
		</div>
	);
}
