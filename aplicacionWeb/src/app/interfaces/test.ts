// aplicacionWeb/src/app/interfaces/test.ts

export interface Test {
  id_test: number;
  nombre: string;
  descripcion: string;
  tipo_escala: 'likert_5' | 'likert_7' | 'si_no';
  activo: boolean;
  fecha_creacion: Date;
}

export interface PreguntaTest {
  id_pregunta: number;
  id_test: number;
  numero_pregunta: number;
  texto_pregunta: string;
  tipo_respuesta: 'escala' | 'si_no' | 'texto' | 'multiple';
  opciones?: string[];
}

export interface AplicacionTest {
  id_aplicacion: number;
  id_test: number;
  id_paciente: number;
  id_psicologo: number;
  fecha: Date;
  fecha_creacion: Date;
  estado: 'pendiente' | 'completado';
  tipo?: 'inicial' | 'seguimiento';  // AGREGADO
  test?: Test;
  resultado?: ResultadoTest;
}

export interface RespuestaTest {
  id_respuesta: number;
  id_aplicacion: number;
  id_pregunta: number;
  respuesta: string;
  pregunta?: PreguntaTest;
}

export interface ResultadoTest {
  id_resultado: number;
  id_aplicacion: number;
  puntaje_total: number;
  interpretacion: string;
  pdf_url?: string;
  fecha_creacion: Date;
}

export interface GraficaTest {
  fecha: string;
  puntaje: number;
  interpretacion: string;
  nombre_test: string;
}

export interface AplicarTestRequest {
  id_test: number;
  id_paciente: number;
  tipo?: 'inicial' | 'seguimiento';  // AGREGADO - Campo opcional para especificar el tipo
  respuestas?: { id_pregunta: number; respuesta: string }[];
}