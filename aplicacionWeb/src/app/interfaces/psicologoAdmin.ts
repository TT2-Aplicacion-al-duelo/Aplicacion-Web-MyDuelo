export interface PsicologoAdmin {
  id_psicologo: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  telefono: string;
  cedula: string;
  especialidad: string;
  cedula_validada: boolean;
  status: 'activo' | 'inactivo';
  fecha_nacimiento: string;
  codigo_vinculacion: string;
  foto_perfil?: string;
  createdAt: string;
}