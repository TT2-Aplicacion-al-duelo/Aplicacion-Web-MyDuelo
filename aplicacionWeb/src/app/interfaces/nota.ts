export interface Nota {
  id_nota: number;
  id_psicologo: number;
  id_paciente: number;
  id_aplicacion?: number; // Opcional, si la nota está relacionada con un test
  titulo: string;
  contenido: string;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  tipo: 'general' | 'test'; // general o relacionada con test
}

export interface CrearNotaRequest {
  id_paciente: number;
  id_aplicacion?: number;
  titulo: string;
  contenido: string;
  tipo: 'general' | 'test';
}

export interface ActualizarNotaRequest {
  titulo?: string;
  contenido?: string;
}