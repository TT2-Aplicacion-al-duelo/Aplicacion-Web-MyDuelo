import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Mensaje } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-tema-foro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tema-foro.component.html',
  styleUrls: ['./tema-foro.component.css']
})
export class TemaForoComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  
  cargando = true;
  enviando = false;
  
  idTema!: number;
  idForo!: number;
  usuarioActual: any;
  autoScroll = true;

  constructor(
    private route: ActivatedRoute,
    private foroService: ForoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserInfo();
    this.idForo = parseInt(this.route.snapshot.params['idForo']);
    this.idTema = parseInt(this.route.snapshot.params['idTema']);
    this.cargarMensajes();
  }

  ngAfterViewChecked(): void {
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  cargarMensajes(): void {
    this.cargando = true;
    this.foroService.listarMensajes(this.idTema).subscribe({
      next: (r) => {
        this.mensajes = r.data;
        this.cargando = false;
        this.autoScroll = true;
      },
      error: () => {
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
      error: () => {
        alert('Error al enviar mensaje');
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
}