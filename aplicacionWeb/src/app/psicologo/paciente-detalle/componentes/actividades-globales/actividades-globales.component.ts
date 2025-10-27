import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActividadesService } from '../../../../services/actividades.service';
import { PacientesService } from '../../../../services/pacientes.service';
import { ActividadDetalleModalComponent } from './actividad-detalle-modal/actividad-detalle-modal.component';
import { AsignarActividadModalComponent } from './asignar-actividad-modal/asignar-actividad-modal.component';
import Swal from 'sweetalert2';
import { Actividad } from '../../../../interfaces/actividad';

declare var bootstrap: any;

// export interface Actividad {
//   id_actividad: number;
//   titulo: string;
//   descripcion: string;
//   tipo: string;
//   obligatoria: boolean;
//   repetitiva: boolean;
//   periodo?: number;
//   archivo_url?: string;
//   origen: 'personalizada' | 'modulo';
//   id_psicologo_creador?: number;
//   fecha_creacion?: Date;
// }

// export interface Paciente {
//   id_paciente: number;
//   nombre: string;
//   apellido_paterno: string;
//   apellido_materno: string;
//   email: string;
//   telefono?: string;
//   foto_url?: string;
// }

@Component({
  selector: 'app-actividades-globales',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ActividadDetalleModalComponent,
    AsignarActividadModalComponent
  ],
  templateUrl: './actividades-globales.component.html',
  styleUrls: ['./actividades-globales.component.css']
})
export class ActividadesGlobalesComponent implements OnInit {
  @Input() idPaciente?: number;
  
  actividades: Actividad[] = [];
  actividadesFiltradas: Actividad[] = [];
  isLoading = false;
  searchTerm = '';
  tipoFiltro = 'todas';
  
  // Propiedades para manejar los modales
  mostrarModalDetalle = false;
  mostrarModalAsignar = false;
  actividadSeleccionada: Actividad | null = null;
  modoEdicion = false;
  esNueva = false;
  
  constructor(
    private actividadesService: ActividadesService,
    private pacientesService: PacientesService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(): void {
    this.isLoading = true;
    this.actividadesService.obtenerActividadesGlobales().subscribe({
      next: (data: Actividad[]) => {
        this.actividades = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar actividades:', error);
        this.toastr.error('Error al cargar las actividades');
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros(): void {
    let actividadesFiltradas = [...this.actividades];

    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const termino = this.searchTerm.toLowerCase();
      actividadesFiltradas = actividadesFiltradas.filter(actividad =>
        actividad.titulo.toLowerCase().includes(termino) ||
        actividad.descripcion?.toLowerCase().includes(termino) ||
        actividad.tipo?.toLowerCase().includes(termino)
      );
    }

    // Filtrar por tipo
    if (this.tipoFiltro !== 'todas') {
      if (this.tipoFiltro === 'obligatorias') {
        actividadesFiltradas = actividadesFiltradas.filter(a => a.obligatoria);
      } else if (this.tipoFiltro === 'personalizadas') {
        actividadesFiltradas = actividadesFiltradas.filter(a => a.origen === 'personalizada');
      } else if (this.tipoFiltro === 'modulo') {
        actividadesFiltradas = actividadesFiltradas.filter(a => a.origen === 'modulo');
      }
    }

    this.actividadesFiltradas = actividadesFiltradas;
  }

  onSearchChange(): void {
    this.aplicarFiltros();
  }

  onTipoFiltroChange(): void {
    this.aplicarFiltros();
  }

  verDetalleActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.modoEdicion = false;
    this.esNueva = false;
    this.mostrarModalDetalle = true;
    
    // Abrir modal de Bootstrap
    setTimeout(() => {
      const modalElement = document.getElementById('modalDetalleActividad');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 100);
  }

  editarActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.modoEdicion = true;
    this.esNueva = false;
    this.mostrarModalDetalle = true;
    
    setTimeout(() => {
      const modalElement = document.getElementById('modalDetalleActividad');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 100);
  }

  asignarActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.mostrarModalAsignar = true;
    
    setTimeout(() => {
      const modalElement = document.getElementById('modalAsignarActividad');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 100);
  }

  eliminarActividad(actividad: Actividad): void {
    Swal.fire({
      title: '¿Está seguro?',
      text: `¿Desea eliminar la actividad "${actividad.titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;
        this.actividadesService.eliminarActividad(actividad.id_actividad).subscribe({
          next: () => {
            this.toastr.success('Actividad eliminada correctamente');
            this.cargarActividades();
          },
          error: (error: any) => {
            console.error('Error al eliminar actividad:', error);
            this.toastr.error('Error al eliminar la actividad');
            this.isLoading = false;
          }
        });
      }
    });
  }

  crearNuevaActividad(): void {
    this.actividadSeleccionada = {
      id_actividad: 0,
      titulo: '',
      descripcion: '',
      tipo: '',
      obligatoria: false,
      repetitiva: false,
      origen: 'personalizada'
    };
    this.modoEdicion = true;
    this.esNueva = true;
    this.mostrarModalDetalle = true;
    
    setTimeout(() => {
      const modalElement = document.getElementById('modalDetalleActividad');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
      }
    }, 100);
  }

  onModalDetalleClose(result: any): void {
    this.mostrarModalDetalle = false;
    
    // Cerrar modal de Bootstrap
    const modalElement = document.getElementById('modalDetalleActividad');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    
    if (result) {
      if (result.accion === 'guardar') {
        if (this.esNueva) {
          this.guardarNuevaActividad(result.actividad);
        } else {
          this.actualizarActividad(result.actividad);
        }
      } else if (result.accion === 'editar') {
        this.editarActividad(result.actividad);
      } else if (result.accion === 'asignar') {
        this.asignarActividad(result.actividad);
      } else if (result.accion === 'eliminar') {
        this.eliminarActividad(result.actividad);
      }
    }
  }

  onModalAsignarClose(result: any): void {
    this.mostrarModalAsignar = false;
    
    // Cerrar modal de Bootstrap
    const modalElement = document.getElementById('modalAsignarActividad');
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
    
    if (result && result.pacientesSeleccionados && result.pacientesSeleccionados.length > 0) {
      this.asignarAPacientes(result.pacientesSeleccionados, result.configuracion);
    }
  }

  private actualizarActividad(actividad: Actividad): void {
    this.isLoading = true;
    this.actividadesService.actualizarActividad(actividad.id_actividad, actividad).subscribe({
      next: () => {
        this.toastr.success('Actividad actualizada correctamente');
        this.cargarActividades();
      },
      error: (error: any) => {
        console.error('Error al actualizar actividad:', error);
        this.toastr.error('Error al actualizar la actividad');
        this.isLoading = false;
      }
    });
  }

  private guardarNuevaActividad(actividad: Partial<Actividad>): void {
    this.isLoading = true;
    this.actividadesService.crearActividad(actividad).subscribe({
      next: () => {
        this.toastr.success('Actividad creada correctamente');
        this.cargarActividades();
      },
      error: (error: any) => {
        console.error('Error al crear actividad:', error);
        this.toastr.error('Error al crear la actividad');
        this.isLoading = false;
      }
    });
  }

  private asignarAPacientes(pacientes: number[], configuracion: any): void {
    if (!this.actividadSeleccionada) return;
    
    this.isLoading = true;
    
    const asignaciones = pacientes.map(idPaciente => ({
      id_actividad: this.actividadSeleccionada!.id_actividad,
      id_paciente: idPaciente,
      fecha_limite: configuracion.fechaLimite,
      instrucciones_personalizadas: configuracion.instrucciones,
      prioridad: configuracion.prioridad || 'media'
    }));

    this.actividadesService.asignarActividadMultiple(asignaciones).subscribe({
      next: () => {
        this.toastr.success(`Actividad asignada a ${pacientes.length} paciente(s) correctamente`);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al asignar actividad:', error);
        this.toastr.error('Error al asignar la actividad');
        this.isLoading = false;
      }
    });
  }
}