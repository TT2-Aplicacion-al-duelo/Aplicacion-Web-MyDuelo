import { Component, OnInit } from '@angular/core';
import { Paciente } from '../../interfaces/paciente';
import { PacientesService } from '../../services/pacientes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  listPacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  
  // Filtros
  filtroTexto: string = '';
  filtroVerificado: string = 'todos';
  
  // Estados
  cargando: boolean = false;

  constructor(
    private _pacienteServices: PacientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getPacientesPorPsicologo();
  }

  getPacientesPorPsicologo() {
    this.cargando = true;
    this._pacienteServices.getPacientesPorPsicologo().subscribe({
      next: (data: Paciente[]) => {
        console.log('Pacientes cargados:', data);
        this.listPacientes = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.listPacientes = [];
        this.pacientesFiltrados = [];
        this.cargando = false;
        
        if (error.status === 401) {
          console.log('Token inválido o expirado. Redirigiendo al login...');
        }
      }
    });
  }

  aplicarFiltros() {
    this.pacientesFiltrados = this.listPacientes.filter(paciente => {
      const textoMatch = 
        paciente.nombre?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_paterno?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_materno?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.email.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.id_paciente?.toString().includes(this.filtroTexto);
      
      const verificadoMatch = 
        this.filtroVerificado === 'todos' ||
        (this.filtroVerificado === 'verificados' && paciente.email_verificado) ||
        (this.filtroVerificado === 'no_verificados' && !paciente.email_verificado);
      
      return textoMatch && verificadoMatch;
    });
  }

  verDetallePaciente(paciente: Paciente): void {
    if (paciente.id_paciente) {
      this.router.navigate(['/paciente', paciente.id_paciente]);
    }
  }

  getClaseFilaPaciente(paciente: Paciente): string {
    if (!paciente.email_verificado) {
      return 'table-warning'; // Amarillo para no verificados
    }
    return 'table-success'; // Verde para verificados
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  /**
 * Obtener URL de foto de perfil
 */
  obtenerFotoUrl(paciente: any): string {
    // Si ya tiene una URL completa, usarla directamente
    if (paciente.foto_perfil && paciente.foto_perfil.startsWith('http')) {
      return paciente.foto_perfil;
    }
    
    // Si tiene solo el nombre del archivo, construir la URL
    if (paciente.foto_perfil) {
      const baseUrl = this.environment.production 
        ? 'https://api.midueloapp.com'
        : 'http://localhost:3017';
      return `${baseUrl}/uploads/${paciente.foto_perfil}`;
    }
    
    // Si no tiene foto, retornar un placeholder
    return '/assets/default-avatar.png';
  }
}