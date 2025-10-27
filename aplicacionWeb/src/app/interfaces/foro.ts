// aplicacionWeb/src/app/interfaces/foro.interface.ts

export interface Foro {
  id_foro: number;
  titulo: string;
  descripcion?: string;
  publico: boolean;
  id_psicologo_creador: number;
  fecha_creacion: Date | string;
  activo: boolean;
  creador?: {
    id_psicologo: number;
    nombre: string;
    apellidoPaterno: string;
    especialidad: string;
  };
  total_participantes?: number;
  total_temas?: number;
  es_participante?: boolean;
  rol_usuario?: 'admin' | 'moderador' | 'miembro' | null;
}

export interface Tema {
  id_tema: number;
  id_foro: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: Date | string;
  total_mensajes?: number;
  ultimo_mensaje?: {
    contenido: string;
    fecha_envio: Date | string;
    autor: string;
  };
}

export interface Mensaje {
  id_mensaje_foro: number;
  id_tema: number;
  contenido: string;
  fecha_envio: Date | string;
  autor: {
    tipo: 'psicologo' | 'paciente';
    id: number;
    nombre: string;
    apellido?: string;
  };
}

export interface Participante {
  id_participante: number;
  tipo_usuario: 'psicologo' | 'paciente';
  rol: 'admin' | 'moderador' | 'miembro';
  fecha_union: Date | string;
  usuario: {
    id: number;
    nombre: string;
    apellido?: string;
    especialidad?: string;
  };
}

export interface Invitacion {
  id_invitacion: number;
  id_foro: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  rol_ofrecido: 'moderador';
  mensaje?: string;
  fecha_invitacion: Date | string;
  fecha_respuesta?: Date | string;
  foro: {
    id_foro: number;
    titulo: string;
    descripcion?: string;
  };
  invitador: {
    id_psicologo: number;
    nombre: string;
    apellidoPaterno: string;
  };
}

// DTOs para requests
export interface CreateForoDTO {
  titulo: string;
  descripcion?: string;
  publico: boolean;
}

export interface CreateTemaDTO {
  titulo: string;
  descripcion?: string;
}

export interface CreateMensajeDTO {
  contenido: string;
}

export interface InvitarModeradorDTO {
  id_psicologo_invitado: number;
  mensaje?: string;
}

export interface ResponderInvitacionDTO {
  aceptar: boolean;
}

// Utilidades
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}