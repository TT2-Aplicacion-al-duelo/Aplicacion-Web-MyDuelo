// aplicacionWeb/src/app/services/chat-admin.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { 
  ChatAdmin, 
  MensajeAdmin, 
  CrearMensajeAdminRequest, 
  CrearChatAdminRequest,
  UsuarioDisponible 
} from '../interfaces/chat-admin';

@Injectable({
  providedIn: 'root'
})
export class ChatAdminService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "api/admin";
  }

  /**
   * Obtener todos los chats del administrador
   */
  getChatsAdmin(): Observable<ChatAdmin[]> {
    return this.http.get<ChatAdmin[]>(`${this.AppUrl}${this.APIUrl}/chats`);
  }

  /**
   * Obtener mensajes de un chat específico
   */
  getMensajesAdmin(idChat: number): Observable<MensajeAdmin[]> {
    return this.http.get<MensajeAdmin[]>(`${this.AppUrl}${this.APIUrl}/chats/${idChat}/mensajes`);
  }

  /**
   * Enviar un nuevo mensaje
   */
  enviarMensajeAdmin(mensaje: CrearMensajeAdminRequest): Observable<MensajeAdmin> {
    return this.http.post<MensajeAdmin>(`${this.AppUrl}${this.APIUrl}/mensajes`, mensaje);
  }

  /**
   * Crear un nuevo chat con un psicólogo o paciente
   */
  crearChatAdmin(chatData: CrearChatAdminRequest): Observable<ChatAdmin> {
    return this.http.post<ChatAdmin>(`${this.AppUrl}${this.APIUrl}/chats`, chatData);
  }

  /**
   * Marcar mensajes como leídos
   */
  marcarComoLeidoAdmin(idChat: number): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/chats/${idChat}/leer`, {});
  }

  /**
   * Buscar chats por nombre o contenido
   */
  buscarChatsAdmin(termino: string): Observable<ChatAdmin[]> {
    return this.http.get<ChatAdmin[]>(`${this.AppUrl}${this.APIUrl}/chats/buscar?q=${encodeURIComponent(termino)}`);
  }

  /**
   * Obtener lista de psicólogos disponibles para chat
   */
  getPsicologosDisponibles(): Observable<UsuarioDisponible[]> {
    return this.http.get<UsuarioDisponible[]>(`${this.AppUrl}${this.APIUrl}/usuarios-disponibles/psicologos`);
  }

  /**
   * Obtener lista de pacientes disponibles para chat
   */
  getPacientesDisponibles(): Observable<UsuarioDisponible[]> {
    return this.http.get<UsuarioDisponible[]>(`${this.AppUrl}${this.APIUrl}/usuarios-disponibles/pacientes`);
  }

  /**
   * Obtener TODOS los usuarios disponibles (psicólogos y pacientes)
   */
  getTodosUsuariosDisponibles(): Observable<UsuarioDisponible[]> {
    return this.http.get<UsuarioDisponible[]>(`${this.AppUrl}${this.APIUrl}/usuarios-disponibles`);
  }
}