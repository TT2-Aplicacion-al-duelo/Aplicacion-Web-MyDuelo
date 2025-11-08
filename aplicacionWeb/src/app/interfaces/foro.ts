// aplicacionWeb/src/app/interfaces/foro.ts

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

// Tema con todos los campos necesarios
export interface Tema {
  id_tema: number;
  id_foro: number;
  titulo: string;
  descripcion?: string;
  fecha_creacion: string | Date;
  total_mensajes?: number;
  ultimo_mensaje?: {
    contenido: string;
    fecha_envio: Date;
    autor: string;
  };

  cerrado: boolean;
  fijado: boolean;
  fecha_cierre?: Date;
}

//  Mensaje con campos de edición y eliminación
export interface Mensaje {
  id_mensaje_foro: number;
  id_tema: number;
  contenido: string;
  fecha_envio: string | Date;
  autor: {
    tipo: 'psicologo' | 'paciente';
    id: number;
    nombre: string;
    apellido: string;
  };

  editado?: boolean;
  fecha_edicion?: Date;
  eliminado?: boolean;
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

export interface SolicitudUnion {
  id_solicitud: number;
  id_foro: number;
  tipo_usuario: 'psicologo' | 'paciente';
  mensaje?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: Date;
  fecha_respuesta?: Date;
  razon_rechazo?: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    especialidad?: string;
  };
  moderador?: {
    id: number;
    nombre: string;
    apellido: string;
  };
}

export interface LogModeracion {
  id_log: number;
  tipo_accion: string;
  tipo_objetivo: 'mensaje' | 'tema' | 'usuario' | 'solicitud';
  id_objetivo: number;
  detalles?: any;
  fecha_accion: Date;
  moderador: {
    id: number;
    nombre: string;
    apellido: string;
  } | null;
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

// ✅ FASE 3: Nuevos DTOs
export interface CrearSolicitudDTO {
  mensaje?: string;
}

export interface EditarMensajeDTO {
  contenido: string;
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