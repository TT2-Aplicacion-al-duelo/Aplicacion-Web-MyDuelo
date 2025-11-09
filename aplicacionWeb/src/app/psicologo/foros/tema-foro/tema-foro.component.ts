import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Mensaje, Tema } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';
import { ModeracionAvanzadaService } from '../../../services/moderacion-avanzada.service';

@Component({
  selector: 'app-tema-foro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tema-foro.component.html',
  styleUrls: ['./tema-foro.component.css']
})
export class TemaForoComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  
  mensajes: Mensaje[] = [];  // ✅ Array de mensajes (plural)
  nuevoMensaje = '';
  
  cargando = true;
  enviando = false;
  
  idTema!: number;
  idForo!: number;
  usuarioActual: any;
  autoScroll = true;

  tema: Tema | null = null;
  esModerador = false;
  mensajeEditando: number | null = null;
  contenidoEditado = '';

  constructor(
    private route: ActivatedRoute,
    private foroService: ForoService,
    private authService: AuthService,
    private moderacionAvanzadaService: ModeracionAvanzadaService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserInfo();
    this.idForo = parseInt(this.route.snapshot.params['idForo']);
    this.idTema = parseInt(this.route.snapshot.params['idTema']);
    this.cargarDatos();
  }

  ngAfterViewChecked(): void {
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  cargarDatos(): void {
    this.cargarTema();
    this.cargarMensajes();
  }

  cargarTema(): void {
    this.foroService.obtenerForo(this.idForo).subscribe({
      next: (foro) => {
        this.esModerador = foro.rol_usuario === 'admin' || foro.rol_usuario === 'moderador';
        
        // Buscar el tema específico
        this.foroService.listarTemas(this.idForo).subscribe({
          next: (response) => {
            this.tema = response.data.find(t => t.id_tema === this.idTema) || null;
          },
          error: () => console.error('Error al cargar tema')
        });
      },
      error: () => console.error('Error al cargar foro')
    });
  }

  cargarMensajes(): void {
    this.cargando = true;
    this.foroService.listarMensajes(this.idTema).subscribe({
      next: (response) => {
        this.mensajes = response.data;
        this.cargando = false;
        this.autoScroll = true;
      },
      error: () => {
        alert('Error al cargar mensajes');
        this.cargando = false;
      }
    });
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;

    this.enviando = true;
    this.foroService.crearMensaje(this.idTema, {
      contenido: this.nuevoMensaje.trim()
    }).subscribe({
      next: (mensaje) => {
        this.mensajes.push(mensaje);
        this.nuevoMensaje = '';
        this.enviando = false;
        this.autoScroll = true;
      },
      error: (err) => {
        alert('Error al enviar mensaje: ' + (err.error?.error || 'Error desconocido'));
        this.enviando = false;
      }
    });
  }

  scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  esMiMensaje(mensaje: Mensaje): boolean {
    const miId = this.usuarioActual?.id_psicologo || this.usuarioActual?.id_paciente;
    return mensaje.autor.id === miId;
  }

  // ==================== MÉTODOS DE MODERACIÓN DE MENSAJES ====================

  iniciarEdicion(mensaje: Mensaje): void {
    this.mensajeEditando = mensaje.id_mensaje_foro;
    this.contenidoEditado = mensaje.contenido;
    this.autoScroll = false;
  }

  cancelarEdicion(): void {
    this.mensajeEditando = null;
    this.contenidoEditado = '';
  }

  guardarEdicion(mensaje: Mensaje): void {
    if (!this.contenidoEditado.trim()) {
      alert('El mensaje no puede estar vacío');
      return;
    }

    this.moderacionAvanzadaService.editarMensaje(
      this.idForo,
      mensaje.id_mensaje_foro,
      { contenido: this.contenidoEditado.trim() }
    ).subscribe({
      next: () => {
        mensaje.contenido = this.contenidoEditado.trim();
        mensaje.editado = true;
        mensaje.fecha_edicion = new Date();
        this.cancelarEdicion();
        alert('Mensaje editado correctamente');
      },
      error: (err) => {
        alert('Error al editar mensaje: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  eliminarMensaje(mensaje: Mensaje): void {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    this.moderacionAvanzadaService.eliminarMensaje(this.idForo, mensaje.id_mensaje_foro).subscribe({
      next: () => {
        mensaje.eliminado = true;
        alert('Mensaje eliminado');
      },
      error: (err) => {
        alert('Error al eliminar: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  restaurarMensaje(mensaje: Mensaje): void {
    if (!confirm('¿Restaurar este mensaje?')) return;

    this.moderacionAvanzadaService.restaurarMensaje(this.idForo, mensaje.id_mensaje_foro).subscribe({
      next: () => {
        mensaje.eliminado = false;
        alert('Mensaje restaurado');
      },
      error: (err) => {
        alert('Error al restaurar: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  // ==================== MÉTODOS DE MODERACIÓN DE TEMAS ====================

  cerrarTema(tema: Tema): void {
    if (!confirm('¿Cerrar este tema? No se podrán enviar más mensajes.')) return;

    this.moderacionAvanzadaService.cerrarTema(this.idForo, tema.id_tema).subscribe({
      next: () => {
        tema.cerrado = true;
        alert('Tema cerrado');
      },
      error: (err) => {
        alert('Error: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  abrirTema(tema: Tema): void {
    if (!confirm('¿Abrir este tema?')) return;

    this.moderacionAvanzadaService.abrirTema(this.idForo, tema.id_tema).subscribe({
      next: () => {
        tema.cerrado = false;
        alert('Tema abierto');
      },
      error: (err) => {
        alert('Error: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  fijarTema(tema: Tema): void {
    this.moderacionAvanzadaService.fijarTema(this.idForo, tema.id_tema).subscribe({
      next: () => {
        tema.fijado = true;
        alert('Tema fijado');
      },
      error: (err) => {
        alert('Error: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }

  desfijarTema(tema: Tema): void {
    this.moderacionAvanzadaService.desfijarTema(this.idForo, tema.id_tema).subscribe({
      next: () => {
        tema.fijado = false;
        alert('Tema desfijado');
      },
      error: (err) => {
        alert('Error: ' + (err.error?.error || 'Error desconocido'));
      }
    });
  }
}