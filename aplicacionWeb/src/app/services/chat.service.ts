// aplicacionWeb/src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Chat, Mensaje, CrearMensajeRequest, CrearChatRequest } from '../interfaces/chat';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = "api/psicologo";
  }

  /**
   * Obtener todos los chats del psicólogo autenticado
   */
  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.AppUrl}${this.APIUrl}/chats`);
  }

  /**
   * Obtener mensajes de un chat específico
   */
  getMensajes(idChat: number): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.AppUrl}${this.APIUrl}/chats/${idChat}/mensajes`);
  }

  /**
   * Enviar un nuevo mensaje
   */
  enviarMensaje(mensaje: CrearMensajeRequest): Observable<Mensaje> {
    return this.http.post<Mensaje>(`${this.AppUrl}${this.APIUrl}/mensajes`, mensaje);
  }

  /**
   * Crear un nuevo chat con un paciente
   */
  crearChat(chatData: CrearChatRequest): Observable<Chat> {
    return this.http.post<Chat>(`${this.AppUrl}${this.APIUrl}/chats`, chatData);
  }

  /**
   * Marcar mensajes como leídos
   */
  marcarComoLeido(idChat: number): Observable<any> {
    return this.http.put(`${this.AppUrl}${this.APIUrl}/chats/${idChat}/leer`, {});
  }

  /**
   * Buscar chats por nombre de paciente o contenido de mensaje
   */
  buscarChats(termino: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.AppUrl}${this.APIUrl}/chats/buscar?q=${encodeURIComponent(termino)}`);
  }
  // Agregar este método en el servicio existente
  verificarChatPaciente(idPaciente: number): Observable<any> {
    return this.http.get(`${this.AppUrl}${this.APIUrl}/chat/verificar/${idPaciente}`);
  }
}