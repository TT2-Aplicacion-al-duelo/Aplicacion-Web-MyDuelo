// aplicacionWeb/src/app/admin/chat-admin/chat-admin.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatAdminService } from '../../services/chat-admin.service';
import { AuthService } from '../../services/auth.service';
import { ChatAdmin, MensajeAdmin, UsuarioDisponible } from '../../interfaces/chat-admin';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-admin.component.html',
  styleUrl: './chat-admin.component.css'
})
export class ChatAdminComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  // Datos principales
  chats: ChatAdmin[] = [];
  chatActual: ChatAdmin | null = null;
  mensajes: MensajeAdmin[] = [];
  usuariosDisponibles: UsuarioDisponible[] = [];
  
  // Estado de la UI
  terminoBusqueda: string = '';
  nuevoMensaje: string = '';
  mostrarModalNuevoChat: boolean = false;
  usuarioSeleccionado: UsuarioDisponible | null = null;
  cargandoMensajes: boolean = false;
  cargandoChats: boolean = false;
  
  // Filtros para nuevo chat
  filtroTipoUsuario: 'todos' | 'psicologos' | 'pacientes' = 'todos';
  
  // ID del administrador autenticado
  idAdmin: number = 0;
  
  // Suscripciones
  private actualizacionSubscription: Subscription | null = null;
  private shouldScrollToBottom: boolean = false;

  constructor(
    private chatAdminService: ChatAdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerIdAdmin();
    this.cargarChats();
    this.cargarUsuariosDisponibles();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private obtenerIdAdmin(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.idAdmin = payload.id_psicologo; // El admin también usa id_psicologo
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }

  private iniciarActualizacionAutomatica(): void {
    // Actualizar chats cada 30 segundos
    this.actualizacionSubscription = interval(30000).subscribe(() => {
      this.cargarChats();
      if (this.chatActual) {
        this.cargarMensajes(this.chatActual.id_chat_admin);
      }
    });
  }

  cargarChats(): void {
    this.cargandoChats = true;
    this.chatAdminService.getChatsAdmin().subscribe({
      next: (chats) => {
        this.chats = chats;
        this.cargandoChats = false;
      },
      error: (error) => {
        console.error('Error al cargar chats:', error);
        this.cargandoChats = false;
      }
    });
  }

  cargarUsuariosDisponibles(): void {
    this.chatAdminService.getTodosUsuariosDisponibles().subscribe({
      next: (usuarios) => {
        this.usuariosDisponibles = usuarios;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
      }
    });
  }

  seleccionarChat(chat: ChatAdmin): void {
    this.chatActual = chat;
    this.cargarMensajes(chat.id_chat_admin);
    this.marcarComoLeido(chat.id_chat_admin);
  }

  cargarMensajes(idChat: number): void {
    this.cargandoMensajes = true;
    this.chatAdminService.getMensajesAdmin(idChat).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.cargandoMensajes = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error al cargar mensajes:', error);
        this.cargandoMensajes = false;
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.chatActual) {
      return;
    }

    const mensajeData = {
      id_chat_admin: this.chatActual.id_chat_admin,
      contenido: this.nuevoMensaje.trim()
    };

    this.chatAdminService.enviarMensajeAdmin(mensajeData).subscribe({
      next: (mensaje) => {
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.shouldScrollToBottom = true;
        this.cargarChats();
      },
      error: (error) => {
        console.error('Error al enviar mensaje:', error);
        alert('Error al enviar el mensaje. Inténtalo de nuevo.');
      }
    });
  }

  crearNuevoChat(): void {
    if (!this.usuarioSeleccionado) {
      alert('Selecciona un usuario');
      return;
    }

    const chatData = {
      destinatario_tipo: this.usuarioSeleccionado.tipo,
      destinatario_id: this.usuarioSeleccionado.id
    };

    this.chatAdminService.crearChatAdmin(chatData).subscribe({
      next: (nuevoChat) => {
        this.chats.unshift(nuevoChat);
        this.seleccionarChat(nuevoChat);
        this.cerrarModalNuevoChat();
      },
      error: (error) => {
        console.error('Error al crear chat:', error);
        if (error.status === 409) {
          alert('Ya existe un chat con este usuario');
        } else {
          alert('Error al crear el chat. Inténtalo de nuevo.');
        }
      }
    });
  }

  buscarChats(): void {
    if (!this.terminoBusqueda.trim()) {
      this.cargarChats();
      return;
    }

    this.chatAdminService.buscarChatsAdmin(this.terminoBusqueda).subscribe({
      next: (chats) => {
        this.chats = chats;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
      }
    });
  }

  private marcarComoLeido(idChat: number): void {
    this.chatAdminService.marcarComoLeidoAdmin(idChat).subscribe({
      next: () => {
        const chat = this.chats.find(c => c.id_chat_admin === idChat);
        if (chat) {
          chat.mensajes_no_leidos = 0;
        }
      },
      error: (error) => {
        console.error('Error al marcar como leído:', error);
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  // Métodos para la UI
  abrirModalNuevoChat(): void {
    this.mostrarModalNuevoChat = true;
    this.usuarioSeleccionado = null;
  }

  cerrarModalNuevoChat(): void {
    this.mostrarModalNuevoChat = false;
    this.usuarioSeleccionado = null;
  }

  getNombreCompleto(chat: ChatAdmin): string {
    if (!chat.destinatario) return 'Usuario';
    return `${chat.destinatario.nombre} ${chat.destinatario.apellido_paterno} ${chat.destinatario.apellido_materno || ''}`.trim();
  }

  getNombreCompletoUsuario(usuario: UsuarioDisponible): string {
    return `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno || ''}`.trim();
  }

  getTipoBadge(tipo: 'psicologo' | 'paciente'): string {
    return tipo === 'psicologo' ? 'bg-primary' : 'bg-success';
  }

  getTipoTexto(tipo: 'psicologo' | 'paciente'): string {
    return tipo === 'psicologo' ? 'Psicólogo' : 'Paciente';
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const ahora = new Date();
    const diferencia = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  esMensajeMio(mensaje: MensajeAdmin): boolean {
    return mensaje.remitente === 'admin';
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  // Filtrar usuarios sin chat
  get usuariosFiltrados(): UsuarioDisponible[] {
    const chatsExistentes = this.chats.map(chat => ({
      tipo: chat.destinatario_tipo,
      id: chat.destinatario_id
    }));

    let usuarios = this.usuariosDisponibles.filter(usuario => 
      !chatsExistentes.some(chat => 
        chat.tipo === usuario.tipo && chat.id === usuario.id
      )
    );

    // Aplicar filtro de tipo
    if (this.filtroTipoUsuario === 'psicologos') {
      usuarios = usuarios.filter(u => u.tipo === 'psicologo');
    } else if (this.filtroTipoUsuario === 'pacientes') {
      usuarios = usuarios.filter(u => u.tipo === 'paciente');
    }

    return usuarios;
  }
}