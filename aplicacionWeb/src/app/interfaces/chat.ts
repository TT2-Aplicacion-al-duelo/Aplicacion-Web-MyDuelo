export interface Chat {
  id_chat: number;
  id_psicologo: number;
  id_paciente: number;
  fecha_inicio: string;
  // Información del paciente para mostrar en la lista
  paciente?: {
    id_paciente: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    email: string;
    foto_perfil?: string;
  };
  // Último mensaje para preview
  ultimo_mensaje?: Mensaje;
  // Contador de mensajes no leídos
  mensajes_no_leidos?: number;
}

export interface Mensaje {
  id_mensaje: number;
  id_chat: number;
  remitente: 'psicologo' | 'paciente';
  contenido: string;
  fecha_envio: string;
  leido?: boolean;
}

export interface CrearMensajeRequest {
  id_chat: number;
  contenido: string;
}

export interface CrearChatRequest {
  id_paciente: number;
}