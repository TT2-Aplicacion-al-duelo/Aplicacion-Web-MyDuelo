export interface Actividad {
  id_actividad: number;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  obligatoria: boolean;
  repetitiva: boolean;
  periodo?: number;
  archivo_url?: string;
  origen: 'personalizada' | 'modulo';
  id_psicologo_creador?: number;
}

export interface ActividadAsignada {
  id_asignacion: number;
  id_actividad: number;
  id_paciente: number;
  fecha_asignacion: Date | string;
  fecha_limite?: Date | string;
  fecha_completada?: Date | string;
  estado: 'en_proceso' | 'finalizada';
  instrucciones_personalizadas?: string;
  prioridad?: 'baja' | 'media' | 'alta';
  notas?: string;
  actividad?: Actividad;
}

export interface AsignarActividadRequest {
  id_actividad: number;
  ids_pacientes: number[];
  fecha_limite?: string;
  notas?: string;
  instrucciones_personalizadas?: string;
  prioridad?: 'baja' | 'media' | 'alta';
}

export interface CrearActividadRequest {
  titulo: string;
  descripcion: string;
  tipo?: string;
  obligatoria: boolean;
  repetitiva: boolean;
  periodo?: number;
  archivo_url?: string;
}

export interface ActualizarActividadRequest {
  titulo?: string;
  descripcion?: string;
  tipo?: string;
  obligatoria?: boolean;
  repetitiva?: boolean;
  periodo?: number;
  archivo_url?: string;
}