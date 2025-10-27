// actividades-globales.component.ts

import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActividadService } from '../../../../services/actividad.service';
import { PacientesService } from '../../../../services/pacientes.service';
import { ActividadDetalleModalComponent } from './actividad-detalle-modal/actividad-detalle-modal.component';
import { AsignarActividadModalComponent } from './asignar-actividad-modal/asignar-actividad-modal.component';
import Swal from 'sweetalert2';
import { Actividad } from '../../../../interfaces/actividad';

declare var bootstrap: any;

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
    private actividadService: ActividadService,
    private pacientesService: PacientesService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(): void {
    this.isLoading = true;
    this.actividadService.obtenerActividadesGlobales().subscribe({
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
  }

  editarActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.modoEdicion = true;
    this.esNueva = false;
    this.mostrarModalDetalle = true;
  }

  asignarActividad(actividad: Actividad): void {
    this.actividadSeleccionada = actividad;
    this.mostrarModalAsignar = true;
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
        this.actividadService.eliminarActividad(actividad.id_actividad).subscribe({
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
  }

  /**
   * CORRECCIÓN: Manejo mejorado del cierre del modal de detalle
   * Este método se ejecuta cuando el modal de detalle emite el evento 'cerrar'
   */
  onModalDetalleClose(result: any): void {
    // Limpiar el estado del modal
    this.mostrarModalDetalle = false;
    this.actividadSeleccionada = null;
    this.modoEdicion = false;
    this.esNueva = false;
    
    // Limpiar cualquier backdrop residual de Bootstrap
    this.limpiarBackdrops();
    
    // Procesar la acción si hay resultado
    if (result) {
      if (result.accion === 'guardar') {
        if (this.esNueva) {
          this.guardarNuevaActividad(result.actividad);
        } else {
          this.actualizarActividad(result.actividad);
        }
      } else if (result.accion === 'editar') {
        // El modal interno maneja la edición, no necesitamos reabrir
        this.editarActividad(result.actividad);
      } else if (result.accion === 'asignar') {
        this.asignarActividad(result.actividad);
      } else if (result.accion === 'eliminar') {
        this.eliminarActividad(result.actividad);
      }
    }
  }

  /**
   * CORRECCIÓN: Manejo mejorado del cierre del modal de asignar
   */
  onModalAsignarClose(result: any): void {
    // Limpiar el estado del modal
    this.mostrarModalAsignar = false;
    this.actividadSeleccionada = null;
    
    // Limpiar cualquier backdrop residual de Bootstrap
    this.limpiarBackdrops();
    
    // Procesar la asignación si hay pacientes seleccionados
    if (result && result.pacientesSeleccionados && result.pacientesSeleccionados.length > 0) {
      this.asignarAPacientes(result.pacientesSeleccionados, result.configuracion);
    }
  }

  /**
   * CORRECCIÓN: Método para limpiar backdrops residuales de Bootstrap
   * Esto soluciona el problema de bloqueo al cerrar el modal
   */
  private limpiarBackdrops(): void {
    // Remover la clase 'modal-open' del body
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
    
    // Eliminar cualquier backdrop residual
    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }
  }

  private actualizarActividad(actividad: Actividad): void {
    this.isLoading = true;
    this.actividadService.actualizarActividad(actividad.id_actividad, actividad).subscribe({
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

  private guardarNuevaActividad(actividad: Actividad): void {
    this.isLoading = true;
    this.actividadService.crearActividad(actividad).subscribe({
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

  private asignarAPacientes(pacientesIds: number[], configuracion: any): void {
    this.isLoading = true;

    const asignaciones = pacientesIds.map(idPaciente => ({
      id_paciente: idPaciente,
      id_actividad: this.actividadSeleccionada!.id_actividad,
      fecha_limite: configuracion.fechaLimite,
      instrucciones_adicionales: configuracion.instrucciones || null,
      prioridad: configuracion.prioridad
    }));

    this.actividadService.asignarActividadMultiple(asignaciones).subscribe({
      next: () => {
        this.toastr.success(`Actividad asignada a ${pacientesIds.length} paciente(s) correctamente`);
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