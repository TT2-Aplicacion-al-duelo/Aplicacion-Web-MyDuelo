// aplicacionWeb/src/app/interfaces/moderacion.ts

export interface Baneo {
  id_baneo: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  tipo_baneo: 'silencio' | 'baneo';
  razon: string;
  fecha_baneo: Date;
  fecha_expiracion?: Date;
  activo: boolean;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
  };
  moderador: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

export interface BanearUsuarioDTO {
  tipo_usuario: 'psicologo' | 'paciente';
  id_usuario: number;
  tipo_baneo: 'silencio' | 'baneo';
  razon: string;
  dias_duracion?: number; // Si no se proporciona, es permanente
}

export interface EstadisticasModeracion {
  total_sanciones: number;
  sanciones_activas: number;
  silencios: number;
  baneos_permanentes: number;
}

export interface VerificarBaneoResponse {
  esta_baneado: boolean;
  data?: {
    tipo_baneo: 'silencio' | 'baneo';
    razon: string;
    fecha_baneo: Date;
    fecha_expiracion?: Date;
  };
}