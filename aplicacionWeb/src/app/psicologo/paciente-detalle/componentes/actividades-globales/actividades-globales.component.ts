// aplicacionWeb/src/app/psicologo/actividades-globales/actividades-globales.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadService } from '../../../../services/actividad.service';
import { PacientesService } from '../../../../services/pacientes.service';
import Swal from 'sweetalert2';
import { Actividad, AsignarActividadRequest } from '../../../../interfaces/actividad';

interface Paciente {
  id_paciente: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
}

@Component({
  selector: 'app-actividades-globales',
  imports: [CommonModule, FormsModule],
  templateUrl: './actividades-globales.component.html',
  styleUrls: ['./actividades-globales.component.css']
})
export class ActividadesGlobalesComponent implements OnInit {
  actividades: Actividad[] = [];
  pacientes: Paciente[] = [];
  cargando: boolean = false;
  menuAbierto: number | null = null;

  constructor(
    private actividadService: ActividadService,
    private pacienteService: PacientesService
  ) {}

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarPacientes();
  }

  cargarActividades(): void {
    this.cargando = true;
    this.actividadService.getActividadesGlobales().subscribe({
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

  cargarPacientes(): void {
    this.pacienteService.getPacientesPorPsicologo().subscribe({
      next: (data: any) => {
        this.pacientes = data;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
      }
    });
  }

  async crearActividad(): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Actividad',
      html:
        `<div class="text-start">
          <label class="form-label">Título *</label>
          <input id="titulo" type="text" class="swal2-input" placeholder="Ej: Diario de emociones" style="width: 100%;">
          
          <label class="form-label mt-3">Descripción *</label>
          <textarea id="descripcion" class="swal2-textarea" placeholder="Describe la actividad..." style="width: 100%; height: 120px;"></textarea>
          
          <label class="form-label mt-3">Tipo</label>
          <input id="tipo" type="text" class="swal2-input" placeholder="Ej: Reflexión, Ejercicio, Lectura" style="width: 100%;">
          
          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" id="obligatoria">
            <label class="form-check-label" for="obligatoria">
              Actividad obligatoria
            </label>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      width: '600px',
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value;
        const tipo = (document.getElementById('tipo') as HTMLInputElement).value;
        const obligatoria = (document.getElementById('obligatoria') as HTMLInputElement).checked;

        if (!titulo || !descripcion) {
          Swal.showValidationMessage('El título y la descripción son requeridos');
          return null;
        }

        return { titulo, descripcion, tipo, obligatoria };
      }
    });

    if (formValues) {
      this.actividadService.crearActividadGlobal(formValues).subscribe({
        next: (nueva) => {
          this.actividades.unshift(nueva);
          Swal.fire('Éxito', 'Actividad creada correctamente', 'success');
        },
        error: (error) => {
          console.error('Error al crear actividad:', error);
          Swal.fire('Error', 'No se pudo crear la actividad', 'error');
        }
      });
    }
  }

  async editarActividad(actividad: Actividad): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Actividad',
      html:
        `<div class="text-start">
          <label class="form-label">Título *</label>
          <input id="titulo" type="text" class="swal2-input" value="${actividad.titulo}" style="width: 100%;">
          
          <label class="form-label mt-3">Descripción *</label>
          <textarea id="descripcion" class="swal2-textarea" style="width: 100%; height: 120px;">${actividad.descripcion || ''}</textarea>
          
          <label class="form-label mt-3">Tipo</label>
          <input id="tipo" type="text" class="swal2-input" value="${actividad.tipo || ''}" style="width: 100%;">
          
          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" id="obligatoria" ${actividad.obligatoria ? 'checked' : ''}>
            <label class="form-check-label" for="obligatoria">
              Actividad obligatoria
            </label>
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      width: '600px',
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value;
        const tipo = (document.getElementById('tipo') as HTMLInputElement).value;
        const obligatoria = (document.getElementById('obligatoria') as HTMLInputElement).checked;

        if (!titulo || !descripcion) {
          Swal.showValidationMessage('El título y la descripción son requeridos');
          return null;
        }

        return { titulo, descripcion, tipo, obligatoria };
      }
    });

    if (formValues) {
      this.actividadService.actualizarActividadGlobal(actividad.id_actividad, formValues).subscribe({
        next: (actualizada) => {
          Object.assign(actividad, actualizada);
          this.cerrarMenu();
          Swal.fire('Éxito', 'Actividad actualizada correctamente', 'success');
        },
        error: (error) => {
          console.error('Error al actualizar actividad:', error);
          Swal.fire('Error', 'No se pudo actualizar la actividad', 'error');
        }
      });
    }
  }

  async asignarActividad(actividad: Actividad): Promise<void> {
    // Crear opciones de pacientes
    const pacientesOptions = this.pacientes.map(p => 
      `<option value="${p.id_paciente}">${p.nombre} ${p.apellido_paterno}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: `Asignar: ${actividad.titulo}`,
      html:
        `<div class="text-start">
          <label class="form-label">Seleccionar paciente(s) *</label>
          <select id="pacientes" class="swal2-select" multiple style="width: 100%; height: 150px;">
            ${pacientesOptions}
          </select>
          <small class="text-muted">Mantén Ctrl/Cmd para seleccionar varios</small>
          
          <label class="form-label mt-3">Instrucciones personalizadas</label>
          <textarea id="instrucciones" class="swal2-textarea" placeholder="Opcional: personaliza las instrucciones para este(os) paciente(s)" style="width: 100%; height: 100px;">${actividad.descripcion}</textarea>
          
          <label class="form-label mt-3">Fecha límite</label>
          <input id="fecha" type="date" class="swal2-input" style="width: 100%;">
          
          <label class="form-label mt-3">Prioridad</label>
          <select id="prioridad" class="swal2-select" style="width: 100%;">
            <option value="baja">Baja</option>
            <option value="media" selected>Media</option>
            <option value="alta">Alta</option>
          </select>
          
          <div class="alert alert-info mt-3" style="font-size: 12px;">
            <i class="bi bi-info-circle me-2"></i>
            Las instrucciones personalizadas no afectarán la plantilla original.
          </div>
        </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar',
      width: '650px',
      preConfirm: () => {
        const selectElement = document.getElementById('pacientes') as HTMLSelectElement;
        const pacientesSeleccionados = Array.from(selectElement.selectedOptions).map(option => parseInt(option.value));
        const instrucciones = (document.getElementById('instrucciones') as HTMLTextAreaElement).value;
        const fecha = (document.getElementById('fecha') as HTMLInputElement).value;
        const prioridad = (document.getElementById('prioridad') as HTMLSelectElement).value;

        if (pacientesSeleccionados.length === 0) {
          Swal.showValidationMessage('Debes seleccionar al menos un paciente');
          return null;
        }

        return { pacientesSeleccionados, instrucciones, fecha, prioridad };
      }
    });

    if (formValues) {
      const request: AsignarActividadRequest = {
        id_actividad: actividad.id_actividad,
        pacientes: formValues.pacientesSeleccionados,
        instrucciones_personalizadas: formValues.instrucciones || undefined,
        fecha_limite: formValues.fecha || undefined,
        prioridad: formValues.prioridad as 'baja' | 'media' | 'alta'
      };

      this.actividadService.asignarActividad(request).subscribe({
        next: (response) => {
          this.cerrarMenu();
          Swal.fire(
            'Éxito', 
            `Actividad asignada a ${formValues.pacientesSeleccionados.length} paciente(s)`, 
            'success'
          );
        },
        error: (error) => {
          console.error('Error al asignar actividad:', error);
          Swal.fire('Error', 'No se pudo asignar la actividad', 'error');
        }
      });
    }
  }

  eliminarActividad(actividad: Actividad): void {
    Swal.fire({
      title: '¿Eliminar plantilla?',
      text: `Se eliminará la plantilla: ${actividad.titulo}. Las asignaciones existentes no se verán afectadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.eliminarActividadGlobal(actividad.id_actividad).subscribe({
          next: () => {
            this.actividades = this.actividades.filter(a => a.id_actividad !== actividad.id_actividad);
            this.cerrarMenu();
            Swal.fire('Eliminado', 'Plantilla eliminada correctamente', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar actividad:', error);
            Swal.fire('Error', 'No se pudo eliminar la plantilla', 'error');
          }
        });
      }
    });
  }

  toggleMenu(idActividad: number): void {
    this.menuAbierto = this.menuAbierto === idActividad ? null : idActividad;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }
}