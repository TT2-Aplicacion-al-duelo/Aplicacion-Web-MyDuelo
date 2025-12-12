export interface ModuloDuelo {
  id_modulo: number;
  nombre: string;
  etapa_duelo: 'Negación' | 'Ira' | 'Negociación' | 'Depresión' | 'Aceptación';
  progreso: number; // Porcentaje 0-100
  actividades_completadas: number;
  actividades_totales: number;
  actividades: ActividadModulo[];
}

export interface ActividadModulo {
  id_actividad: number;
  id_asignacion?: number;
  id_actividad_paciente?: number; // NUEVO: para actividades del módulo
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: 'no_asignada' | 'en_proceso' | 'en progreso' | 'pendiente' | 'finalizada' | 'completada';
  fecha_asignacion?: Date;
  fecha_completada?: Date;
  fecha_realizacion?: Date; // NUEVO: para actividades del módulo
  evidencias?: Evidencia[];
  visible_para_psicologo: boolean;
  origen?: 'asignacion' | 'modulo_paciente'; // NUEVO: para distinguir el origen
}

export interface Evidencia {
  id_evidencia: number | string;
  archivo_url?: string;
  tipo_archivo: 'imagen' | 'video' | 'audio' | 'documento' | 'texto' | 'cronometro' | 'otro';
  comentario?: string;
  fecha_subida: Date;
  visible_para_psicologo: boolean;
  origen?: 'asignacion' | 'actividad_paciente'; // NUEVO: para distinguir el origen
  
  // Campos específicos para evidencias de actividad_paciente
  contenido?: string; // Para tipo 'texto'
  duracion_segundos?: number; // Para tipo 'cronometro'
  duracion_formato?: string; // Para tipo 'cronometro' (ej: "5m 30s")
}