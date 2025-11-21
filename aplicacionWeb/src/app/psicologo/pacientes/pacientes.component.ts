import { Component, OnInit } from '@angular/core';
import { Paciente } from '../../interfaces/paciente';
import { PacientesService } from '../../services/pacientes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';  

interface PacienteConError extends Paciente {
  imageError?: boolean;
}

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  // listPacientes: Paciente[] = [];
  // pacientesFiltrados: Paciente[] = [];
listPacientes: PacienteConError[] = [];
pacientesFiltrados: PacienteConError[] = [];
  
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


  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: Event, paciente: PacienteConError): void {
    console.warn('Error cargando foto de paciente:', paciente.id_paciente);
    paciente.imageError = true;
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
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

  /*
 * Obtener URL de foto de perfil del paciente
 */
obtenerFotoUrl(paciente: Paciente): string {
  const fotoPerfil = paciente.foto_perfil;
  
  if (!fotoPerfil) {
    return '';
  }
  
  // Si ya es URL completa, pero de Azure antigua, ignorarla
  if (fotoPerfil.startsWith('https://192.168') || fotoPerfil.startsWith('https://20.')) {
    return '';
  }
  
  // Si ya es URL completa válida
  if (fotoPerfil.startsWith('http')) {
    return fotoPerfil;
  }
  
  // Construir URL del servidor
  const baseUrl = environment.apiUrl || 'https://localhost:3017';
  return `${baseUrl}/uploads/${fotoPerfil}`;
}


  /**
   * Obtener nombre completo del paciente
   */
  getNombreCompleto(paciente: Paciente): string {
    const nombre = paciente.nombre || '';
    const paterno = paciente.apellido_paterno || '';
    const materno = paciente.apellido_materno || '';
    return `${nombre} ${paterno} ${materno}`.trim();
  }

  /**
   * Obtener iniciales del paciente
   */
  getIniciales(paciente: Paciente): string {
    const nombre = paciente.nombre?.charAt(0).toUpperCase() || '';
    const apellido = paciente.apellido_paterno?.charAt(0).toUpperCase() || '';
    return `${nombre}${apellido}`;
  }
}