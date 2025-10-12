export interface Actividad {
  id_actividad: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  obligatoria: boolean;
  repetitiva: boolean;
  periodo: number | null;
  archivo_url: string | null;
  origen: 'personalizada' | 'modulo';
  id_psicologo_creador: number;
}

export interface ActividadAsignada {
  id_asignacion: number;
  id_actividad: number;
  id_paciente: number;
  estado: 'en_proceso' | 'finalizada';
  fecha_asignacion: string;
  fecha_limite: string | null;
  instrucciones_personalizadas: string | null;
  prioridad: 'baja' | 'media' | 'alta';
  actividad?: Actividad;
}

export interface AsignarActividadRequest {
  id_actividad: number;
  pacientes: number[];
  fecha_limite?: string;
  instrucciones_personalizadas?: string;
  prioridad?: 'baja' | 'media' | 'alta';
}