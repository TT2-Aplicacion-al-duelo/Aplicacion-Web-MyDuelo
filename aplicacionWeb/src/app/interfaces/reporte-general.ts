// ============================================
// aplicacionWeb/src/app/interfaces/reporte-general.ts
// NUEVO ARCHIVO - Interfaces para el reporte general de pacientes
// ============================================

export interface ReporteGeneral {
  total_pacientes: number;
  fecha_generacion: Date;
  pacientes: ResumenPaciente[];
  resumen_global: ResumenGlobal;
}

export interface ResumenPaciente {
  id_paciente: number;
  nombre_completo: string;
  email: string;
  fecha_registro: Date;
  tests: {
    total: number;
    detalles: TestResumen[];
  };
  actividades: {
    total_asignadas: number;
    completadas: number;
    pendientes: number;
  };
  modulos: {
    progreso_promedio: number;
    detalles: ModuloProgreso[];
  };
}

export interface TestResumen {
  nombre_test: string;
  fecha: Date;
  puntaje: number | null;
  interpretacion: string;
}

export interface ModuloProgreso {
  nombre_modulo: string;
  progreso: number;
  actividades_completadas: number;
  actividades_totales: number;
}

export interface ResumenGlobal {
  total_tests_aplicados: number;
  total_actividades_asignadas: number;
  total_actividades_completadas: number;
  total_actividades_pendientes: number;
  promedio_progreso_modulos: number;
}