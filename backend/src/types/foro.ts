// backend/src/types/foro.types.ts

// ============================================================================
// REQUEST BODY TYPES
// ============================================================================

export interface CreateForoRequest {
  titulo: string;
  descripcion?: string;
  publico: boolean;
  id_psicologo_creador: number;
}

export interface UpdateForoRequest {
  titulo?: string;
  descripcion?: string;
  publico?: boolean;
}

export interface CreateTemaRequest {
  id_foro: number;
  titulo: string;
  descripcion?: string;
}

export interface CreateMensajeRequest {
  id_tema: number;
  contenido: string;
  tipo_usuario?: 'psicologo' | 'paciente';
  id_psicologo?: number;
  id_paciente?: number;
}

export interface InvitarModeradorRequest {
  id_foro: number;
  id_psicologo_invitado: number;
  mensaje?: string;
}

export interface ResponderInvitacionRequest {
  id_invitacion: number;
  aceptar: boolean;
}

export interface UnirseForoRequest {
  id_foro: number;
  id_paciente?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ForoResponse {
  id_foro: number;
  titulo: string;
  descripcion?: string;
  publico: boolean;
  id_psicologo_creador: number;
  fecha_creacion: Date;
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

export interface TemaResponse {
  id_tema: number;
  id_foro: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: Date;
  total_mensajes?: number;
  ultimo_mensaje?: {
    contenido: string;
    fecha_envio: Date;
    autor: string;
  };
}

export interface MensajeResponse {
  id_mensaje_foro: number;
  id_tema: number;
  contenido: string;
  fecha_envio: Date;
  autor: {
    tipo: 'psicologo' | 'paciente';
    id: number;
    nombre: string;
    apellido?: string;
  };
}

export interface ParticipanteResponse {
  id_participante: number;
  tipo_usuario: 'psicologo' | 'paciente';
  rol: 'admin' | 'moderador' | 'miembro';
  fecha_union: Date;
  usuario: {
    id: number;
    nombre: string;
    apellido?: string;
    especialidad?: string;
  };
}

export interface InvitacionResponse {
  id_invitacion: number;
  id_foro: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  rol_ofrecido: 'moderador';
  mensaje?: string;
  fecha_invitacion: Date;
  fecha_respuesta?: Date;
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

// ============================================================================
// QUERY PARAMS
// ============================================================================

export interface ListForosQuery {
  publico?: string;
  buscar?: string;
  page?: string;
  limit?: string;
  ordenar?: 'recientes' | 'antiguos' | 'participantes';
}

export interface ListTemasQuery {
  page?: string;
  limit?: string;
}

export interface ListMensajesQuery {
  page?: string;
  limit?: string;
  desde?: string;
}

// ============================================================================
// PERMISOS
// ============================================================================

export enum PermisoForo {
  CREAR_FORO = 'crear_foro',
  EDITAR_FORO = 'editar_foro',
  ELIMINAR_FORO = 'eliminar_foro',
  CREAR_TEMA = 'crear_tema',
  ESCRIBIR_MENSAJE = 'escribir_mensaje',
  INVITAR_MODERADOR = 'invitar_moderador',
  GESTIONAR_PARTICIPANTES = 'gestionar_participantes',
}

export interface RolPermisos {
  admin: PermisoForo[];
  moderador: PermisoForo[];
  miembro: PermisoForo[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

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