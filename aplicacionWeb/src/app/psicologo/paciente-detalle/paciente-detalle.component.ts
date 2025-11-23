import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PacienteInfoComponent } from './componentes/paciente-info/paciente-info.component';
import { GraficasNotasComponent } from './componentes/graficas-notas/graficas-notas.component';
import { ModulosDueloComponent } from './componentes/modulos-duelo/modulos-duelo.component';
import { ActividadesPersonalizadasComponent } from './componentes/actividades-personalizadas/actividades-personalizadas.component';
import { PacientesService } from '../../services/pacientes.service';
import { Paciente } from '../../interfaces/paciente';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { DiarioEmocionesComponent } from './componentes/diario-emociones/diario-emociones.component';

@Component({
  selector: 'app-paciente-detalle',
  imports: [CommonModule,
    PacienteInfoComponent,
    GraficasNotasComponent,
    ModulosDueloComponent,
    ActividadesPersonalizadasComponent,
    DiarioEmocionesComponent
  ],
  templateUrl: './paciente-detalle.component.html',
  styleUrl: './paciente-detalle.component.css'
})
export class PacienteDetalleComponent implements OnInit {
  paciente: Paciente | null = null;
  idPaciente: number = 0;
  cargando: boolean = true;
  imageError: boolean = false;
  
  // Estado de las pestañas
  tabActiva: 'info' | 'graficas' | 'modulos' | 'actividades' | 'diario' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pacientesService: PacientesService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Obtener el ID del paciente de la URL
    this.route.params.subscribe(params => {
      this.idPaciente = +params['id'];
      if (this.idPaciente) {
        this.cargarPaciente();
      }
    });
  }

  cargarPaciente(): void {
    this.cargando = true;
    this.pacientesService.getPacientePorId(this.idPaciente).subscribe({
      next: (paciente) => {
        this.paciente = paciente;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar paciente:', error);
        this.toastr.error('Error al cargar la información del paciente');
        this.cargando = false;
        // Redirigir a la lista si no se encuentra el paciente
        this.router.navigate(['/lista-pacientes-del-psicologo']);
      }
    });
  }

  cambiarTab(tab: 'info' | 'graficas' | 'modulos' | 'actividades'| 'diario'): void {
    this.tabActiva = tab;
  }

  volver(): void {
    this.router.navigate(['/lista-pacientes-del-psicologo']);
  }

  /**
   * Obtener URL de foto de perfil
   */
  obtenerFotoUrl(): string {
    const fotoPerfil = this.paciente?.foto_perfil;
    
    if (!fotoPerfil) {
      return '';
    }
    
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    
    const baseUrl = environment.apiUrl || 'http://localhost:3017';
    return `${baseUrl}/uploads/${fotoPerfil}`;
  }

    /**
 * Manejar error de imagen
 */
  onImageError(event: any): void {
    console.warn('Error cargando foto de paciente:', this.idPaciente);
    this.imageError = true;
    event.target.style.display = 'none';
  }

  /**
   * Obtener iniciales
   */
  getIniciales(): string {
    if (!this.paciente) return '';
    const nombre = this.paciente.nombre?.charAt(0) || '';
    const apellido = this.paciente.apellido_paterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase();
  }
}