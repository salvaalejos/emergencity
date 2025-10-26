// src/components/Mapa/Ambulancias.jsx

import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useFecthData } from "./useFetchData";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button"; // Importar Button de PrimeReact

export default function Ambulancias() {
	const [ambulancias, setAmbulancias] = useState([]); // Inicializa como array vacío
	const { addRecord, getAllRecord, updateRecord, deleteRecord } = useFecthData("ambulancias");
	const [checked, setChecked] = useState(false); // Estado para InputSwitch
	const [dialogVisible, setDialogVisible] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [newAmbulancia, setNewAmbulancia] = useState({ numero_placa_sm: "", modelo: "", disponible: "no" }); // Default a 'no'

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllRecord();
				// Asegurarse que 'disponible' sea 'si' o 'no'
				const formattedData = data.map(amb => ({
					...amb,
					disponible: amb.disponible === 'si' ? 'si' : 'no'
				}));
				setAmbulancias(formattedData || []); // Asegura que sea un array
			} catch (error) {
				console.error("Error fetching ambulances:", error);
				setAmbulancias([]); // En caso de error, inicializa vacío
			}
		};

		fetchData();
	}, []); // Dependencia vacía

	// Función para abrir el diálogo
	const openDialog = (ambulancia = null) => {
		if (ambulancia) {
			setNewAmbulancia({ ...ambulancia, disponible: ambulancia.disponible === 'si' ? 'si' : 'no' });
			setChecked(ambulancia.disponible === 'si'); // Sincroniza el InputSwitch
			setEditMode(true);
		} else {
			setNewAmbulancia({ numero_placa_sm: "", modelo: "", disponible: "no" }); // Resetea para nuevo registro
			setChecked(false); // Sincroniza el InputSwitch
			setEditMode(false);
		}
		setDialogVisible(true);
	};

	// Función para guardar (agregar o editar) ambulancia
	const saveAmbulancia = async () => {
		try {
			const dataToSend = { ...newAmbulancia, disponible: checked ? "si" : "no" }; // Usa el estado 'checked'

			if (editMode) {
				await updateRecord({ id: newAmbulancia.numero_placa_sm, data: dataToSend });
				// Actualiza el estado local después de la confirmación del backend
				setAmbulancias(
					ambulancias.map((ambulancia) =>
						ambulancia.numero_placa_sm === newAmbulancia.numero_placa_sm ? dataToSend : ambulancia
					)
				);
			} else {
				// Validar que la placa no esté vacía antes de agregar
				if (!dataToSend.numero_placa_sm) {
					console.error("La placa no puede estar vacía");
					// Aquí podrías mostrar un mensaje de error al usuario
					return;
				}
				const addedRecord = await addRecord(dataToSend);
				// Actualiza el estado local con la respuesta (si la API devuelve el objeto creado)
				// o refetchea la lista
				// Opcion A: Si la API devuelve el objeto creado
				// setAmbulancias([...ambulancias, addedRecord]);
				// Opcion B: Refetchear (más simple si la API no devuelve el objeto)
				const updatedData = await getAllRecord();
				setAmbulancias(updatedData || []);
			}
			setDialogVisible(false);
		} catch (error) {
			console.error("Error saving ambulance:", error);
			// Aquí podrías mostrar un mensaje de error al usuario
		}
	};


	// Función para eliminar ambulancia
	const deleteAmbulancia = async (id) => {
		try {
			await deleteRecord(id);
			// Actualiza el estado local después de confirmar la eliminación
			setAmbulancias(ambulancias.filter((a) => a.numero_placa_sm !== id));
		} catch (error) {
			console.error("Error deleting ambulance:", error);
			// Aquí podrías mostrar un mensaje de error al usuario
		}
	};

	// Plantilla para mostrar 'Disponible'
	const disponibleBodyTemplate = (rowData) => {
		return (
			<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
				rowData.disponible === 'si'
					? 'bg-mint-green/20 text-green-700 dark:bg-mint-green/30 dark:text-green-300' // Verde menta
					: 'bg-coral-red/20 text-red-700 dark:bg-coral-red/30 dark:text-red-300' // Rojo coral
			}`}>
				{rowData.disponible === 'si' ? 'Sí' : 'No'}
			</span>
		);
	};


	return (
		// Contenedor principal - NUEVOS COLORES 👇
		<div className="p-4 sm:p-6 bg-smoke-white dark:bg-bluish-gray text-bluish-gray dark:text-smoke-white min-h-full rounded-lg shadow-md"> {/* Padding, fondo, texto, sombra */}
			<h2 className="text-center text-xl sm:text-2xl mb-6 font-semibold text-sky-blue"> {/* Color título */}
				Gestión de Ambulancias 🚑
			</h2>

			{/* Botón Agregar - NUEVOS COLORES 👇 */}
			<div className="flex justify-end mb-4"> {/* Ajuste de margen */}
				<button
					// Usando verde menta
					className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-bluish-gray dark:text-smoke-white rounded-lg group bg-gradient-to-br from-mint-green to-green-400 group-hover:from-mint-green group-hover:to-green-400 hover:text-white focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 transition-all duration-150 ease-in"
					onClick={() => openDialog()} // Llama sin argumentos para 'agregar'
				>
					<span className="relative px-6 py-2 transition-all ease-in duration-75 bg-white dark:bg-gray-800 rounded-md group-hover:bg-opacity-0 font-medium">
						<i className="pi pi-plus mr-2"></i> {/* Ícono agregar */}
						Agregar Ambulancia
					</span>
				</button>
			</div>

			{/* Tabla - Estilos generales 👇 */}
			<div className="card overflow-hidden shadow border border-gray-200 dark:border-gray-700 rounded-lg"> {/* Contenedor tabla con sombra y borde */}
				<DataTable
					value={ambulancias}
					responsiveLayout="scroll"
					paginator // Habilitar paginación
					rows={10} // Filas por página
					rowsPerPageOptions={[5, 10, 25]} // Opciones de filas por página
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
					currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ambulancias"
					emptyMessage="No se encontraron ambulancias." // Mensaje si no hay datos
					className="p-datatable-sm" // Tabla más compacta
					pt={{ // PassThrough para estilos internos de PrimeReact
						thead: { className: 'bg-gray-100 dark:bg-gray-700' }, // Fondo cabecera
						tbody: { className: 'bg-white dark:bg-bluish-gray divide-y divide-gray-200 dark:divide-gray-700' } // Fondo cuerpo y divisores
					}}
				>
					<Column field="numero_placa_sm" header="Placa" sortable style={{ minWidth: '120px' }} />
					<Column field="modelo" header="Modelo" sortable style={{ minWidth: '100px' }} />
					<Column
						field="disponible"
						header="Disponible"
						body={disponibleBodyTemplate} // Usa la plantilla para mostrar 'Sí'/'No' con colores
						sortable
						style={{ minWidth: '100px', textAlign: 'center' }}
						headerStyle={{ textAlign: 'center' }}
					/>
					<Column
						header="Acciones"
						headerStyle={{ width: '8rem', textAlign: 'center' }} // Ancho fijo y centrado
						bodyStyle={{ textAlign: 'center', justifyContent: 'center' }} // Centrar contenido
						body={(rowData) => (
							<div className="flex gap-2 justify-center"> {/* Espaciado y centrado */}
								{/* Botón Editar - NUEVOS COLORES 👇 */}
								<Button
									icon="pi pi-pencil"
									rounded // Botón redondeado
									tooltip="Editar" // Texto al pasar el mouse
									tooltipOptions={{ position: 'top' }}
									// Azul cielo con hover más oscuro
									className="!bg-sky-blue hover:!bg-blue-400 !border-sky-blue hover:!border-blue-400 !text-white"
									onClick={() => openDialog(rowData)}
								/>
								{/* Botón Eliminar - NUEVOS COLORES 👇 */}
								<Button
									icon="pi pi-trash"
									rounded // Botón redondeado
									tooltip="Eliminar"
									tooltipOptions={{ position: 'top' }}
									// Rojo coral con hover más oscuro
									className="!bg-coral-red hover:!bg-red-400 !border-coral-red hover:!border-red-400 !text-white"
									onClick={() => deleteAmbulancia(rowData.numero_placa_sm)}
								/>
							</div>
						)}
					/>
				</DataTable>
			</div>

			{/* Diálogo (Modal) - NUEVOS COLORES y Estructura 👇 */}
			<Dialog
				header={editMode ? "Editar Ambulancia" : "Agregar Ambulancia"}
				visible={dialogVisible}
				style={{ width: '90vw', maxWidth: '500px' }} // Ancho responsivo
				modal // Fondo oscuro detrás
				onHide={() => setDialogVisible(false)}
				pt={{ // PassThrough para estilos internos
					root: { className: 'rounded-lg overflow-hidden' },
					header: { className: 'bg-bluish-gray text-smoke-white p-4 text-lg font-semibold flex justify-between items-center' }, // Cabecera oscura
					content: { className: 'bg-smoke-white dark:bg-gray-800 p-5' }, // Contenido claro/oscuro
					footer: { className: 'bg-gray-100 dark:bg-gray-700 p-4 flex justify-end gap-3' }, // Pie de página
					closeButton: { className: '!text-smoke-white hover:!bg-gray-600 rounded-full' } // Botón cerrar
				}}
			>
				{/* Campo Placa */}
				<div className="mb-4">
					<label htmlFor="numero_placa_sm" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Placa <span className="text-coral-red">*</span> {/* Indicador requerido */}
					</label>
					<InputText
						id="numero_placa_sm"
						value={newAmbulancia.numero_placa_sm}
						onChange={(e) => setNewAmbulancia({ ...newAmbulancia, numero_placa_sm: e.target.value })}
						// Estilos input con borde y focus azul cielo
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						disabled={editMode} // No se puede editar la placa (PK)
						required // Validación HTML básica
					/>
				</div>

				{/* Campo Modelo */}
				<div className="mb-4">
					<label htmlFor="modelo" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Modelo
					</label>
					<InputText
						id="modelo"
						value={newAmbulancia.modelo || ''} // Asegura que no sea null/undefined
						onChange={(e) => setNewAmbulancia({ ...newAmbulancia, modelo: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
					/>
				</div>

				{/* Campo Disponible */}
				<div className="mb-4 flex items-center gap-3">
					<label htmlFor="disponible" className="font-medium text-bluish-gray dark:text-smoke-white">
						Disponible
					</label>
					<InputSwitch
						inputId="disponible" // Vincula el label
						checked={checked} // Vinculado al estado 'checked'
						onChange={(e) => setChecked(e.value ?? false)} // Actualiza estado 'checked'
						// Puedes personalizar colores de InputSwitch con PrimeReact Theming o CSS si es necesario
					/>
					<span className={`ml-2 text-sm ${checked ? 'text-mint-green font-semibold' : 'text-coral-red'}`}>
						{checked ? 'Sí' : 'No'}
					</span>
				</div>

				{/* Pie de página (se maneja con pt.footer arriba) */}
				{/* Botones dentro del pie de página */}
				<div className="p-dialog-footer"> {/* Este div es necesario para que pt.footer funcione correctamente */}
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
						onClick={saveAmbulancia}
						autoFocus // Enfoca este botón al abrir
					/>
				</div>
			</Dialog>
		</div>
	);
}
