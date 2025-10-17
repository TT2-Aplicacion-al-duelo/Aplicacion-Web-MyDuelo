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
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: 'no_asignada' | 'en_proceso' | 'finalizada';
  fecha_asignacion?: Date;
  fecha_completada?: Date;
  evidencias?: Evidencia[];
  visible_para_psicologo: boolean;
}

export interface Evidencia {
  id_evidencia: number;
  archivo_url: string;
  tipo_archivo: 'imagen' | 'video' | 'audio' | 'documento' | 'otro';
  comentario?: string;
  fecha_subida: Date;
  visible_para_psicologo: boolean;
}