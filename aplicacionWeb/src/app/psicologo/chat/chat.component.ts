import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { PacientesService } from '../../services/pacientes.service';
import { AuthService } from '../../services/auth.service';
import { Chat, Mensaje } from '../../interfaces/chat';
import { Paciente } from '../../interfaces/paciente';
import { interval, Subscription } from 'rxjs'; 

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  // Datos principales
  chats: Chat[] = [];
  chatActual: Chat | null = null;
  mensajes: Mensaje[] = [];
  pacientes: Paciente[] = [];
  
  // Estado de la UI
  terminoBusqueda: string = '';
  nuevoMensaje: string = '';
  mostrarModalNuevoChat: boolean = false;
  pacienteSeleccionado: number | null = null;
  cargandoMensajes: boolean = false;
  cargandoChats: boolean = false;
  
  // ID del psicólogo autenticado
  idPsicologo: number = 0;
  
  // Suscripciones
  private actualizacionSubscription: Subscription | null = null;
  private shouldScrollToBottom: boolean = false;

  constructor(
    private chatService: ChatService,
    private pacientesService: PacientesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerIdPsicologo();
    this.cargarPacientes();
    this.cargarChats();
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

  private obtenerIdPsicologo(): void {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.idPsicologo = payload.id_psicologo;
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
        this.cargarMensajes(this.chatActual.id_chat);
      }
    });
  }

  cargarChats(): void {
    this.cargandoChats = true;
    this.chatService.getChats().subscribe({
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

  cargarPacientes(): void {
    this.pacientesService.getPacientesPorPsicologo().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
      }
    });
  }

  // seleccionarChat(chat: Chat): void {
  //   this.chatActual = chat;
  //   this.cargarMensajes(chat.id_chat);
  //   this.marcarComoLeido(chat.id_chat);
  // }

  seleccionarChat(chat: Chat): void {
    this.chatActual = chat;
    
    // Verificar si es un chat con admin usando la nueva propiedad
    if ((chat as any).es_chat_admin && (chat as any).id_chat_admin) {
      // Usar el ID real del chat admin
      const idChatAdmin = (chat as any).id_chat_admin;
      this.cargarMensajesAdmin(idChatAdmin);
      this.marcarComoLeido(chat.id_chat);  // Ahora usa el ID numérico
    } else {
      this.cargarMensajes(chat.id_chat);
      this.marcarComoLeido(chat.id_chat);
    }
  }
  // AGREGAR ESTA NUEVA FUNCIÓN
  private cargarMensajesAdmin(idChatAdmin: number): void {
    this.cargandoMensajes = true;
    this.chatService.getMensajesAdmin(idChatAdmin).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.cargandoMensajes = false;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error al cargar mensajes de admin:', error);
        this.cargandoMensajes = false;
      }
    });
  }


  cargarMensajes(idChat: number): void {
    this.cargandoMensajes = true;
    this.chatService.getMensajes(idChat).subscribe({
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

  // enviarMensaje(): void {
  //   if (!this.nuevoMensaje.trim() || !this.chatActual) {
  //     return;
  //   }

  //   const mensajeData = {
  //     id_chat: this.chatActual.id_chat,
  //     contenido: this.nuevoMensaje.trim()
  //   };

  //   this.chatService.enviarMensaje(mensajeData).subscribe({
  //     next: (mensaje) => {
  //       this.mensajes.push(mensaje);
  //       this.nuevoMensaje = '';
  //       this.shouldScrollToBottom = true;
  //       // Actualizar la lista de chats para reflejar el último mensaje
  //       this.cargarChats();
  //     },
  //     error: (error) => {
  //       console.error('Error al enviar mensaje:', error);
  //       alert('Error al enviar el mensaje. Inténtalo de nuevo.');
  //     }
  //   });
  // }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.chatActual) {
      return;
    }

    // Verificar si es un chat con admin
    if ((this.chatActual as any).es_admin) {
      const idChatAdmin = parseInt(this.chatActual.id_chat.toString().replace('admin_', ''));
      
      const mensajeData = {
        id_chat_admin: idChatAdmin,
        contenido: this.nuevoMensaje.trim()
      };

      this.chatService.enviarMensajeAdmin(mensajeData).subscribe({
        next: (mensaje) => {
          this.mensajes.push(mensaje);
          this.nuevoMensaje = '';
          this.shouldScrollToBottom = true;
          this.cargarChats();
        },
        error: (error) => {
          console.error('Error al enviar mensaje al admin:', error);
          alert('Error al enviar el mensaje. Inténtalo de nuevo.');
        }
      });
    } else {
      // Lógica normal para chat con pacientes
      const mensajeData = {
        id_chat: this.chatActual.id_chat,
        contenido: this.nuevoMensaje.trim()
      };

      this.chatService.enviarMensaje(mensajeData).subscribe({
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
  }

  crearNuevoChat(): void {
    if (!this.pacienteSeleccionado) {
      alert('Selecciona un paciente');
      return;
    }

    const chatData = {
      id_paciente: this.pacienteSeleccionado
    };

    this.chatService.crearChat(chatData).subscribe({
      next: (nuevoChat) => {
        this.chats.unshift(nuevoChat);
        this.seleccionarChat(nuevoChat);
        this.cerrarModalNuevoChat();
      },
      error: (error) => {
        console.error('Error al crear chat:', error);
        if (error.status === 409) {
          alert('Ya existe un chat con este paciente');
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

    this.chatService.buscarChats(this.terminoBusqueda).subscribe({
      next: (chats) => {
        this.chats = chats;
      },
      error: (error) => {
        console.error('Error en búsqueda:', error);
      }
    });
  }

  private marcarComoLeido(idChat: number | string): void {
    // Buscar el chat actual para ver si es de admin
    const chat = this.chats.find(c => c.id_chat === idChat);
    
    if (chat && (chat as any).es_chat_admin && (chat as any).id_chat_admin) {
      // Es un chat de admin
      const idChatAdmin = (chat as any).id_chat_admin;
      
      this.chatService.marcarComoLeidoAdmin(idChatAdmin).subscribe({
        next: () => {
          if (chat) {
            chat.mensajes_no_leidos = 0;
          }
        },
        error: (error) => {
          console.error('Error al marcar como leído (admin):', error);
        }
      });
    } else {
      // Chat normal con paciente
      this.chatService.marcarComoLeido(idChat as number).subscribe({
        next: () => {
          if (chat) {
            chat.mensajes_no_leidos = 0;
          }
        },
        error: (error) => {
          console.error('Error al marcar como leído:', error);
        }
      });
    }
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
    this.pacienteSeleccionado = null;
  }

  cerrarModalNuevoChat(): void {
    this.mostrarModalNuevoChat = false;
    this.pacienteSeleccionado = null;
  }

  getNombreCompleto(chat: Chat): string {
    if (!chat.paciente) return 'Paciente';
    return `${chat.paciente.nombre} ${chat.paciente.apellido_paterno} ${chat.paciente.apellido_materno || ''}`.trim();
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

  esMensajeMio(mensaje: Mensaje): boolean {
    return mensaje.remitente === 'psicologo';
  }

  onEnterPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  // Método para obtener pacientes que no tienen chat
  get pacientesSinChat(): Paciente[] {
    const pacientesConChat = this.chats.map(chat => chat.id_paciente);
    return this.pacientes.filter(paciente => 
      !pacientesConChat.includes(paciente.id_paciente || 0)
    );
  }
}