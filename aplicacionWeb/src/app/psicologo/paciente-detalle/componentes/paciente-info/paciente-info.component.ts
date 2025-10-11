import { Component , Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Paciente } from '../../../../interfaces/paciente';
import { ChatService } from '../../../../services/chat.service';
import { CitaService } from '../../../../services/cita.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-paciente-info',
  imports: [CommonModule],
  templateUrl: './paciente-info.component.html',
  styleUrl: './paciente-info.component.css'
})
export class PacienteInfoComponent implements OnInit {
  @Input() paciente!: Paciente;
  @Input() idPaciente!: number;
  
  chatExiste: boolean = false;
  proximaCita: any = null;
  cargandoChat: boolean = false;
  cargandoCita: boolean = false;

  constructor(
    private chatService: ChatService,
    private citaService: CitaService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.verificarChat();
    this.cargarProximaCita();
  }

  verificarChat(): void {
    this.cargandoChat = true;
    this.chatService.verificarChatPaciente(this.idPaciente).subscribe({
      next: (response) => {
        this.chatExiste = response.existe;
        this.cargandoChat = false;
      },
      error: (error) => {
        console.error('Error verificando chat:', error);
        this.cargandoChat = false;
      }
    });
  }

  cargarProximaCita(): void {
    this.cargandoCita = true;
    this.citaService.getProximaCitaPaciente(this.idPaciente).subscribe({
      next: (cita) => {
        this.proximaCita = cita;
        this.cargandoCita = false;
      },
      error: (error) => {
        console.error('Error cargando cita:', error);
        this.cargandoCita = false;
      }
    });
  }

  abrirChat(): void {
    this.router.navigate(['/chat-pacientes-del-psicologo'], { 
      queryParams: { paciente: this.idPaciente }
    });
  }

  crearChat(): void {
    if (confirm('¿Desea crear un chat con este paciente?')) {
      this.cargandoChat = true;
      this.chatService.crearChat({ id_paciente: this.idPaciente }).subscribe({
        next: (nuevoChat) => {
          this.toastr.success('Chat creado exitosamente');
          this.chatExiste = true;
          this.cargandoChat = false;
          // Redirigir al chat
          this.abrirChat();
        },
        error: (error) => {
          console.error('Error creando chat:', error);
          this.toastr.error('Error al crear el chat');
          this.cargandoChat = false;
        }
      });
    }
  }

  agendarCita(): void {
    this.router.navigate(['/agenda'], { 
      queryParams: { paciente: this.idPaciente }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatearHora(hora: string): string {
    if (!hora) return '';
    return hora.substring(0, 5); // Formato HH:mm
  }

  getEdad(): number {
    if (!this.paciente.fecha_nacimiento) return 0;
    const hoy = new Date();
    const nacimiento = new Date(this.paciente.fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }
}