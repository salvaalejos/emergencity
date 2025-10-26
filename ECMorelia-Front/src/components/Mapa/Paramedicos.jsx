// src/components/Mapa/Paramedicos.jsx

import React, { useState, useEffect } from "react"; // Import React
// Se eliminan imports no usados como useNavigate, logo, usuario, Sidebar
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button"; // Importar Button de PrimeReact
import { useFecthData } from "./useFetchData";

export default function Paramedicos() {
	const { addRecord, deleteRecord, getAllRecord, updateRecord } = useFecthData("paramedico");
	const [paramedicos, setParamedicos] = useState([]); // Inicializa como array vacío
	const [dialogVisible, setDialogVisible] = useState(false);
	const [editMode, setEditMode] = useState(false);
	// Incluir id_paramedicos aunque sea null para 'agregar' si el backend lo maneja
	const [newParamedico, setNewParamedico] = useState({
		id_paramedicos: null, // Asumiendo que el ID puede ser relevante aunque sea serial
		nombre: "",
		apellidos: "",
		licencia_medica: "",
		licencia_conducir: "",
		certificado: ""
	});

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await getAllRecord();
				setParamedicos(data || []); // Asegura que sea un array
			} catch (error) {
				console.error("Error fetching paramedicos:", error);
				setParamedicos([]); // En caso de error, inicializa vacío
			}
		};
		fetchData();
	}, []); // Dependencia vacía

	const openDialog = (paramedico = null) => {
		if (paramedico) {
			setNewParamedico({ ...paramedico }); // Carga datos existentes
			setEditMode(true);
		} else {
			// Resetea para 'agregar'
			setNewParamedico({
				id_paramedicos: null,
				nombre: "",
				apellidos: "",
				licencia_medica: "",
				licencia_conducir: "",
				certificado: ""
			});
			setEditMode(false);
		}
		setDialogVisible(true);
	};

	const saveParamedico = async () => {
		try {
			// Prepara datos, excluye ID si es nuevo y autogenerado
			const dataToSend = { ...newParamedico };
			if (!editMode) {
				delete dataToSend.id_paramedicos;
			}

			// Validaciones básicas
			if (!dataToSend.nombre || !dataToSend.apellidos || !dataToSend.licencia_medica || !dataToSend.licencia_conducir || !dataToSend.certificado) {
				console.error("Todos los campos son requeridos");
				// Mostrar mensaje al usuario
				return;
			}

			if (editMode) {
				// Usa licencia_medica como ID para actualizar/eliminar
				await updateRecord({ id: newParamedico.licencia_medica, data: dataToSend });
				// Actualiza el estado local
				setParamedicos(
					paramedicos.map((p) =>
						p.licencia_medica === newParamedico.licencia_medica ? dataToSend : p
					)
				);
			} else {
				await addRecord(dataToSend);
				// Refetchea la lista
				const updatedData = await getAllRecord();
				setParamedicos(updatedData || []);
			}
			setDialogVisible(false);
		} catch (error) {
			console.error("Error saving paramedico:", error);
			// Mostrar mensaje al usuario
		}
	};

	const deleteParamedico = async (id) => { // Recibe licencia_medica
		try {
			await deleteRecord(id);
			// Actualiza el estado local
			setParamedicos(paramedicos.filter((p) => p.licencia_medica !== id));
		} catch (error) {
			console.error("Error deleting paramedico:", error);
			// Mostrar mensaje al usuario
		}
	};

	return (
		// Contenedor principal - NUEVOS COLORES 👇
		<div className="p-4 sm:p-6 bg-smoke-white dark:bg-bluish-gray text-bluish-gray dark:text-smoke-white min-h-full rounded-lg shadow-md">
			<h2 className="text-center text-xl sm:text-2xl mb-6 font-semibold text-sky-blue"> {/* Color título */}
				Gestión de Paramédicos
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
						Agregar Paramédico
					</span>
				</button>
			</div>

			{/* Tabla - Estilos generales 👇 */}
			<div className="card overflow-hidden shadow border border-gray-200 dark:border-gray-700 rounded-lg">
				<DataTable
					value={paramedicos}
					responsiveLayout="scroll"
					paginator rows={10} rowsPerPageOptions={[5, 10, 25]}
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
					currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} paramédicos"
					emptyMessage="No se encontraron paramédicos."
					className="p-datatable-sm"
					pt={{ // PassThrough para estilos internos
						thead: { className: 'bg-gray-100 dark:bg-gray-700 text-sm' },
						tbody: { className: 'bg-white dark:bg-bluish-gray divide-y divide-gray-200 dark:divide-gray-700' }
					}}
				>
					{/* Columnas con sortable y filter */}
					<Column field="nombre" header="Nombre" sortable filter filterPlaceholder="Buscar nombre" style={{ minWidth: '150px' }} />
					<Column field="apellidos" header="Apellidos" sortable filter filterPlaceholder="Buscar apellidos" style={{ minWidth: '150px' }} />
					<Column field="licencia_medica" header="Licencia Médica" sortable filter filterPlaceholder="Buscar licencia" style={{ minWidth: '150px' }} />
					<Column field="licencia_conducir" header="Licencia Conducir" sortable filter filterPlaceholder="Buscar licencia" style={{ minWidth: '150px' }} />
					<Column field="certificado" header="Certificado" sortable filter filterPlaceholder="Buscar certificado" style={{ minWidth: '120px' }} />
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
									className="!bg-sky-blue hover:!bg-blue-400 !border-sky-blue hover:!border-blue-400 !text-white"
									onClick={() => openDialog(rowData)}
								/>
								{/* Botón Eliminar - NUEVOS COLORES 👇 */}
								<Button
									icon="pi pi-trash"
									rounded tooltip="Eliminar" tooltipOptions={{ position: 'top' }}
									className="!bg-coral-red hover:!bg-red-400 !border-coral-red hover:!border-red-400 !text-white"
									onClick={() => deleteParamedico(rowData.licencia_medica)} // Usa licencia_medica como ID
								/>
							</div>
						)}
					/>
				</DataTable>
			</div>

			{/* Diálogo (Modal) - NUEVOS COLORES y Estructura 👇 */}
			<Dialog
				header={editMode ? "Editar Paramédico" : "Agregar Paramédico"}
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
						value={newParamedico.nombre}
						onChange={(e) => setNewParamedico({ ...newParamedico, nombre: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required autoFocus
					/>
				</div>

				{/* Campo Apellidos */}
				<div className="mb-4">
					<label htmlFor="apellidos" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Apellidos <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="apellidos"
						value={newParamedico.apellidos}
						onChange={(e) => setNewParamedico({ ...newParamedico, apellidos: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
					/>
				</div>

				{/* Campo Licencia Medica */}
				<div className="mb-4">
					<label htmlFor="licencia_medica" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Licencia Médica <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="licencia_medica"
						value={newParamedico.licencia_medica}
						onChange={(e) => setNewParamedico({ ...newParamedico, licencia_medica: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
						disabled={editMode} // ID no editable
					/>
				</div>

				{/* Campo Licencia Conducir */}
				<div className="mb-4">
					<label htmlFor="licencia_conducir" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Licencia Conducir <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="licencia_conducir"
						value={newParamedico.licencia_conducir}
						onChange={(e) => setNewParamedico({ ...newParamedico, licencia_conducir: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
						required
					/>
				</div>

				{/* Campo Certificado */}
				<div className="mb-4">
					<label htmlFor="certificado" className="block mb-1 font-medium text-bluish-gray dark:text-smoke-white">
						Certificado <span className="text-coral-red">*</span>
					</label>
					<InputText
						id="certificado"
						value={newParamedico.certificado}
						onChange={(e) => setNewParamedico({ ...newParamedico, certificado: e.target.value })}
						className="p-inputtext w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:border-sky-blue focus:ring-1 focus:ring-sky-blue outline-none"
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
						onClick={saveParamedico}
					/>
				</div>
			</Dialog>
		</div>
	);
}
