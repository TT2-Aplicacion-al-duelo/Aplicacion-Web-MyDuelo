import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { PacientesService } from '../../services/pacientes.service';
import { AuthService } from '../../services/auth.service';
import { Chat, Mensaje, CrearMensajeRequest, CrearChatRequest } from '../../interfaces/chat';
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
  
  // Suscripciones y control de scroll
  private actualizacionSubscription: Subscription | null = null;
  private shouldScrollToBottom: boolean = false;
  private isUserScrolling: boolean = false; // 🆕 Detectar si el usuario está scrolleando
  private lastScrollHeight: number = 0;     // 🆕 Para scroll suave

  constructor(
    private chatService: ChatService,
    private pacientesService: PacientesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerIdPsicologo();
    this.cargarChats();
    this.cargarPacientes();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy(): void {
    if (this.actualizacionSubscription) {
      this.actualizacionSubscription.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    // Solo hacer scroll si es necesario y el usuario no está scrolleando
    if (this.shouldScrollToBottom && !this.isUserScrolling) {
      this.scrollToBottomSmooth();
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

  // 🆕 MÉTODO OPTIMIZADO - Actualización automática inteligente
  private iniciarActualizacionAutomatica(): void {
    // Actualizar chats cada 10 segundos
    this.actualizacionSubscription = interval(10000).subscribe(() => {
      this.actualizarChatsEnBackground();
    });
  }

  // 🆕 MÉTODO NUEVO - Actualizar en background sin interrumpir
  private actualizarChatsEnBackground(): void {
    if (this.cargandoChats) return; // Evitar llamadas concurrentes
    
    this.chatService.getChats().subscribe({
      next: (chats) => {
        // Actualizar sin parpadeo
        this.actualizarChatsConDiferencias(chats);
        
        // Si hay un chat activo, verificar nuevos mensajes
        if (this.chatActual) {
          this.verificarMensajesNuevos();
        }
      },
      error: (error) => {
        console.error('Error al actualizar chats:', error);
      }
    });
  }

  // 🆕 MÉTODO NUEVO - Actualizar chats sin parpadeo
  private actualizarChatsConDiferencias(nuevosChats: Chat[]): void {
    // Mantener referencia del chat actual
    const chatActualId = this.chatActual?.id_chat;
    
    // Actualizar array manteniendo las referencias donde no haya cambios
    this.chats = nuevosChats.map(nuevoChat => {
      const chatExistente = this.chats.find(c => c.id_chat === nuevoChat.id_chat);
      
      // Si el chat existe y no ha cambiado, mantener la referencia
      if (chatExistente && JSON.stringify(chatExistente) === JSON.stringify(nuevoChat)) {
        return chatExistente;
      }
      
      return nuevoChat;
    });
    
    // Actualizar chatActual si cambió
    if (chatActualId) {
      const chatActualizado = this.chats.find(c => c.id_chat === chatActualId);
      if (chatActualizado) {
        this.chatActual = chatActualizado;
      }
    }
  }

  // 🆕 MÉTODO NUEVO - Verificar solo mensajes nuevos (polling eficiente)
  private verificarMensajesNuevos(): void {
    if (!this.chatActual || this.cargandoMensajes) return;
    
    // Determinar si es chat de admin o normal
    const esAdminChat = (this.chatActual as any).es_chat_admin;
    const idChatAdmin = (this.chatActual as any).id_chat_admin;
    
    const ultimoIdMensaje = this.mensajes.length > 0 
      ? Math.max(...this.mensajes.map(m => m.id_mensaje))
      : 0;
    
    // Elegir el método correcto según el tipo de chat
    const observable = esAdminChat && idChatAdmin
      ? this.chatService.getMensajesNuevosAdmin(idChatAdmin, ultimoIdMensaje)
      : this.chatService.getMensajesNuevos(this.chatActual.id_chat, ultimoIdMensaje);
    
    observable.subscribe({
      next: (mensajesNuevos) => {
        if (mensajesNuevos.length > 0) {
          // Agregar nuevos mensajes al array existente
          this.mensajes = [...this.mensajes, ...mensajesNuevos];
          
          // Si estamos cerca del fondo, hacer scroll
          const container = this.messagesContainer?.nativeElement;
          if (container) {
            const threshold = 300;
            const position = container.scrollTop + container.clientHeight;
            const height = container.scrollHeight;
            
            if ((height - position) < threshold) {
              this.shouldScrollToBottom = true;
            }
          }
          
          // Marcar como leído si no son nuestros mensajes
          const mensajesAjenos = esAdminChat 
            ? mensajesNuevos.filter(m => (m as any).remitente !== 'usuario')
            : mensajesNuevos.filter(m => m.remitente === 'paciente');
            
          if (mensajesAjenos.length > 0) {
            this.marcarComoLeidoSilencioso();
          }
        }
      },
      error: (error) => {
        console.error('Error al verificar nuevos mensajes:', error);
      }
    });
  }

  // 🆕 MÉTODO NUEVO - Marcar como leído sin recargar
  private marcarComoLeidoSilencioso(): void {
    if (!this.chatActual) return;
    
    const esAdminChat = (this.chatActual as any).es_chat_admin;
    const idChatAdmin = (this.chatActual as any).id_chat_admin;
    
    if (esAdminChat && idChatAdmin) {
      this.chatService.marcarComoLeidoAdmin(idChatAdmin).subscribe({
        next: () => {
          const chat = this.chats.find(c => (c as any).id_chat_admin === idChatAdmin);
          if (chat) chat.mensajes_no_leidos = 0;
        },
        error: (error) => console.error('Error al marcar como leído:', error)
      });
    } else {
      this.chatService.marcarComoLeido(this.chatActual.id_chat).subscribe({
        next: () => {
          const chat = this.chats.find(c => c.id_chat === this.chatActual!.id_chat);
          if (chat) chat.mensajes_no_leidos = 0;
        },
        error: (error) => console.error('Error al marcar como leído:', error)
      });
    }
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

  seleccionarChat(chat: Chat): void {
    this.chatActual = chat;
    this.isUserScrolling = false; // Reset del estado de scroll
    this.lastScrollHeight = 0;
    
    // Verificar si es un chat con admin
    if ((chat as any).es_chat_admin && (chat as any).id_chat_admin) {
      const idChatAdmin = (chat as any).id_chat_admin;
      this.cargarMensajesAdmin(idChatAdmin);
      this.marcarComoLeidoAdmin((chat as any).id_chat_admin);
    } else {
      this.cargarMensajes(chat.id_chat);
      this.marcarComoLeido(chat.id_chat);
    }
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

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim() || !this.chatActual) return;

    // Verificar si es un chat con admin
    if ((this.chatActual as any).es_chat_admin && (this.chatActual as any).id_chat_admin) {
      const idChatAdmin = (this.chatActual as any).id_chat_admin;
      
      const mensajeData = {
        id_chat_admin: idChatAdmin,
        contenido: this.nuevoMensaje.trim()
      };

      this.chatService.enviarMensajeAdmin(mensajeData).subscribe({
        next: (mensajeCreado) => {
          // Agregar mensaje al array sin recargar todo
          this.mensajes.push(mensajeCreado);
          this.nuevoMensaje = '';
          this.shouldScrollToBottom = true;
          this.isUserScrolling = false; // Asegurar scroll después de enviar
          
          // Actualizar la lista de chats en background
          this.actualizarChatsEnBackground();
        },
        error: (error) => {
          console.error('Error al enviar mensaje al admin:', error);
          alert('Error al enviar el mensaje. Inténtalo de nuevo.');
        }
      });
    } else {
      // Chat normal con paciente
      const mensaje: CrearMensajeRequest = {
        id_chat: this.chatActual.id_chat,
        contenido: this.nuevoMensaje.trim()
      };

      this.chatService.enviarMensaje(mensaje).subscribe({
        next: (mensajeCreado) => {
          // Agregar mensaje al array sin recargar todo
          this.mensajes.push(mensajeCreado);
          this.nuevoMensaje = '';
          this.shouldScrollToBottom = true;
          this.isUserScrolling = false; // Asegurar scroll después de enviar
          
          // Actualizar la lista de chats en background
          this.actualizarChatsEnBackground();
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

    const chatData: CrearChatRequest = {
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

  private marcarComoLeido(idChat: number): void {
    this.chatService.marcarComoLeido(idChat).subscribe({
      next: () => {
        const chat = this.chats.find(c => c.id_chat === idChat);
        if (chat) {
          chat.mensajes_no_leidos = 0;
        }
      },
      error: (error) => {
        console.error('Error al marcar como leído:', error);
      }
    });
  }

  private marcarComoLeidoAdmin(idChatAdmin: number): void {
    this.chatService.marcarComoLeidoAdmin(idChatAdmin).subscribe({
      next: () => {
        const chat = this.chats.find(c => (c as any).id_chat_admin === idChatAdmin);
        if (chat) {
          chat.mensajes_no_leidos = 0;
        }
      },
      error: (error) => {
        console.error('Error al marcar como leído (admin):', error);
      }
    });
  }

  // 🆕 MÉTODO NUEVO - Scroll suave sin parpadeos
  private scrollToBottomSmooth(): void {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        const currentScrollHeight = container.scrollHeight;
        
        // Solo hacer scroll si hay contenido nuevo
        if (currentScrollHeight > this.lastScrollHeight) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
          this.lastScrollHeight = currentScrollHeight;
        }
      }
    } catch(err) {
      console.error('Error en scroll:', err);
    }
  }

  // 🆕 MÉTODO NUEVO - Detectar scroll manual del usuario
  onScroll(): void {
    const container = this.messagesContainer?.nativeElement;
    if (container) {
      const threshold = 150;
      const position = container.scrollTop + container.clientHeight;
      const height = container.scrollHeight;
      
      // Si el usuario scrollea hacia arriba, desactivar auto-scroll
      this.isUserScrolling = (height - position) > threshold;
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
    
    // Verificar si es una fecha válida
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const ahora = new Date();
    const diferencia = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }

  formatearHora(fecha: string): string {
    // Parsear la fecha asumiendo que viene en formato ISO o MySQL
    const date = new Date(fecha);
    
    // Verificar si es una fecha válida
    if (isNaN(date.getTime())) {
      return '--:--';
    }
    
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }
  esChatActivo(chat: Chat): boolean {
    if (!this.chatActual) return false;
    
    const esAdminActual = (this.chatActual as any).es_chat_admin;
    const esAdminComparado = (chat as any).es_chat_admin;
    
    // Si ambos son chats de admin, comparar por id_chat_admin
    if (esAdminActual && esAdminComparado) {
      return (this.chatActual as any).id_chat_admin === (chat as any).id_chat_admin;
    }
    
    // Si ambos son chats normales, comparar por id_chat
    if (!esAdminActual && !esAdminComparado) {
      return this.chatActual.id_chat === chat.id_chat;
    }
    
    // Si uno es admin y otro no, nunca son el mismo
    return false;
  }
  esMensajeMio(mensaje: Mensaje): boolean {
    // Para chats con admin: el psicólogo envía mensajes como 'usuario'
    if ((this.chatActual as any).es_chat_admin) {
      return (mensaje as any).remitente === 'usuario';
    }
    
    // Para chats normales con pacientes
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