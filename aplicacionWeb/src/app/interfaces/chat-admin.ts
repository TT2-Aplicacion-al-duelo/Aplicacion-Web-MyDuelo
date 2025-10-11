export interface ChatAdmin {
  id_chat_admin: number;
  id_admin: number;
  destinatario_tipo: 'psicologo' | 'paciente';
  destinatario_id: number;
  fecha_inicio: string;
  
  // Información del destinatario
  destinatario?: {
    id: number;
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    email: string;
    tipo: 'psicologo' | 'paciente';
  };
  
  // Último mensaje para preview
  ultimo_mensaje?: MensajeAdmin;
  
  // Contador de mensajes no leídos
  mensajes_no_leidos?: number;
}

export interface MensajeAdmin {
  id_mensaje: number;
  id_chat_admin: number;
  remitente: 'admin' | 'usuario'; // admin o el psicologo/paciente
  contenido: string;
  fecha_envio: string;
  leido?: boolean;
}

export interface CrearMensajeAdminRequest {
  id_chat_admin: number;
  contenido: string;
}

export interface CrearChatAdminRequest {
  destinatario_tipo: 'psicologo' | 'paciente';
  destinatario_id: number;
}

// Para listar usuarios disponibles
export interface UsuarioDisponible {
  id: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  email: string;
  tipo: 'psicologo' | 'paciente';
  especialidad?: string; // Solo para psicólogos
  cedula_validada?: boolean; // Solo para psicólogos
}