import { Routes, Route, BrowserRouter } from "react-router-dom";
import App from "./App";
import { OperadorFormulario } from "./components/Registro/OperadorFormulario";
import { MapLayout, Mapa, Ambulancias, Hospitales, Operadores, Paramedicos, Medicos } from "./components/Mapa";
import Login from "./components/Ingreso/FormularioIngreso";
import RContrasena from "./components/RecuperacionContraseña/RContrasena";
import NuevaContrasena from "./components/NuevaContrasena/NuevaContrasena";
import ProtectedRoutes from "./components/ProtectedRoutes/ProtectedRoutes";
import { DoctorFormulario } from "./components/Registro/DoctorFormulario";
import { HospitalFormulario } from "./components/Registro/HospitalFormulario";
import { AuthProvider } from "./auth/AuthProvider";
import { ParamedicoFormulario } from "./components/Registro/ParamedicoFormulario";
import VideoCall from "./components/teleconsulta/VideoCall";
import DoctorLayout from "./components/doctor/DoctorLayout";
//import ReporteVideoCall from "./components/reportepaciente/VideoCall";
import ReportePaciente from "./components/reportepaciente/ReportePaciente";
import ReportesPage from "./components/doctor/ReportesPage"; // Importa el nuevo componente



function Rutas() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/signup">
						<Route path="operador" element={<OperadorFormulario />} />
						<Route path="doctor" element={<DoctorFormulario />} />
						<Route path="hospital" element={<HospitalFormulario />} />
						<Route path="paramedicos" element={<ParamedicoFormulario />} />
					</Route>
					<Route path="/login" element={<Login />} />
					<Route path="/recover-password" element={<RContrasena />} />
					<Route path="/new-password" element={<NuevaContrasena />} />
					<Route element={<ProtectedRoutes />}>
						<Route element={<MapLayout />}>
							<Route path="mapa" element={<Mapa />} />
							<Route path="ambulancias" element={<Ambulancias />} />
							<Route path="paramedicos" element={<Paramedicos />} />
							<Route path="hospital" element={<Hospitales />} />
							<Route path="operadores" element={<Operadores />} />
							<Route path="medicos" element={<Medicos />} />
						</Route>
						<Route element={<DoctorLayout />} path="/doctor">
						<Route path="records" element={<ReportesPage />} /> {/* Actualiza esta línea */}
						</Route>
						<Route element={<ReportePaciente />} path="/reportepaciente"></Route>	
						<Route element={<VideoCall />}  path="/videocall"/>

					</Route>
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default Rutas;
