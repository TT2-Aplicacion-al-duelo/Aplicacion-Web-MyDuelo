export interface PacienteAdmin {
  id_paciente: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  id_psicologo: number | null;
  // Información del psicólogo asignado
  psicologo?: {
    id_psicologo: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
  };
  createdAt?: string;
  status?: 'activo' | 'inactivo';
}