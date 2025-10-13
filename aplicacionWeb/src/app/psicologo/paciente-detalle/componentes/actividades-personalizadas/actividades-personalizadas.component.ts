// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/actividades-personalizadas/actividades-personalizadas.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadService } from '../../../../services/actividad.service';
import Swal from 'sweetalert2';
import { ActividadAsignada } from '../../../../interfaces/actividad';


@Component({
  selector: 'app-actividades-personalizadas',
  imports: [CommonModule],
  templateUrl: './actividades-personalizadas.component.html',
  styleUrls: ['./actividades-personalizadas.component.css']
})
export class ActividadesPersonalizadasComponent implements OnInit {
  @Input() idPaciente!: number;
  
  actividades: ActividadAsignada[] = [];
  cargando: boolean = false;
  menuAbierto: number | null = null;

  constructor(private actividadService: ActividadService) {}

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(): void {
    this.cargando = true;
    this.actividadService.getActividadesPaciente(this.idPaciente).subscribe({
      next: (data) => {
        this.actividades = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar actividades:', error);
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar las actividades', 'error');
      }
    });
  }

  toggleMenu(idAsignacion: number): void {
    this.menuAbierto = this.menuAbierto === idAsignacion ? null : idAsignacion;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }

  cambiarEstado(actividad: ActividadAsignada): void {
    const nuevoEstado = actividad.estado === 'en_proceso' ? 'finalizada' : 'en_proceso';
    
    this.actividadService.actualizarActividadAsignada(actividad.id_asignacion, {
      estado: nuevoEstado
    }).subscribe({
      next: () => {
        actividad.estado = nuevoEstado;
        this.cerrarMenu();
        Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      }
    });
  }

  async modificarActividad(actividad: ActividadAsignada): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Modificar Actividad',
      html:
        `<div class="text-start">
          <label class="form-label">Instrucciones personalizadas:</label>
          <textarea id="instrucciones" class="swal2-textarea" style="width: 100%; height: 150px;">${actividad.instrucciones_personalizadas || actividad.actividad?.descripcion || ''}</textarea>
          
          <label class="form-label mt-3">Fecha límite:</label>
          <input id="fecha" type="date" class="swal2-input" value="${actividad.fecha_limite || ''}" style="width: 100%;">
          
          <label class="form-label mt-3">Prioridad:</label>
          <select id="prioridad" class="swal2-select" style="width: 100%;">
            <option value="baja" ${actividad.prioridad === 'baja' ? 'selected' : ''}>Baja</option>
            <option value="media" ${actividad.prioridad === 'media' ? 'selected' : ''}>Media</option>
            <option value="alta" ${actividad.prioridad === 'alta' ? 'selected' : ''}>Alta</option>
          </select>
          
          <div class="alert alert-warning mt-3" style="font-size: 12px;">
            <i class="bi bi-info-circle me-2"></i>
            Los cambios solo afectarán esta asignación, no la plantilla base.
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      preConfirm: () => {
        return {
          instrucciones: (document.getElementById('instrucciones') as HTMLTextAreaElement).value,
          fecha: (document.getElementById('fecha') as HTMLInputElement).value,
          prioridad: (document.getElementById('prioridad') as HTMLSelectElement).value
        }
      }
    });
  
    if (formValues) {
      this.actividadService.actualizarActividadAsignada(actividad.id_asignacion, {
        instrucciones_personalizadas: formValues.instrucciones,
        fecha_limite: formValues.fecha || undefined,
        prioridad: formValues.prioridad as 'baja' | 'media' | 'alta'
      }).subscribe({
        next: (updatedActividad) => {
          Object.assign(actividad, updatedActividad);
          this.cerrarMenu();
          Swal.fire('Éxito', 'Actividad modificada correctamente', 'success');
        },
        error: (error) => {
          console.error('Error al modificar actividad:', error);
          Swal.fire('Error', 'No se pudo modificar la actividad', 'error');
        }
      });
    }
    this.cerrarMenu();
  }

  eliminarActividad(actividad: ActividadAsignada): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.eliminarActividadAsignada(actividad.id_asignacion).subscribe({
          next: () => {
            this.actividades = this.actividades.filter(a => a.id_asignacion !== actividad.id_asignacion);
            this.cerrarMenu();
            Swal.fire('Eliminada', 'La actividad ha sido eliminada.', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar actividad:', error);
            Swal.fire('Error', 'No se pudo eliminar la actividad', 'error');
          }
        });
      }
    });
  }

  mandarRecordatorio(actividad: ActividadAsignada): void {
    this.actividadService.enviarRecordatorio(actividad.id_asignacion).subscribe({
      next: () => {
        this.cerrarMenu();
        Swal.fire('Éxito', 'Recordatorio enviado correctamente', 'success');
      },
      error: (error) => {
        console.error('Error al enviar recordatorio:', error);
        Swal.fire('Error', 'No se pudo enviar el recordatorio', 'error');
      }
    });
  }

  crearActividad(): void {
    // Abrir el modal de actividades globales desde el componente padre
    const event = new CustomEvent('abrirModalActividades', { 
      detail: { idPaciente: this.idPaciente } 
    });
    window.dispatchEvent(event);
  }

  asignarActividad(): void {
    // Abrir el modal de asignación desde el componente padre
    const event = new CustomEvent('abrirModalAsignacion', { 
      detail: { idPacienteActual: this.idPaciente } 
    });
    window.dispatchEvent(event);
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'en_proceso':
        return 'badge bg-warning text-dark';
      case 'finalizada':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  getPrioridadClass(prioridad?: string): string {
    switch (prioridad) {
      case 'alta':
        return 'badge bg-danger';
      case 'media':
        return 'badge bg-warning text-dark';
      case 'baja':
        return 'badge bg-info text-dark';
      default:
        return 'badge bg-secondary';
    }
  }
}