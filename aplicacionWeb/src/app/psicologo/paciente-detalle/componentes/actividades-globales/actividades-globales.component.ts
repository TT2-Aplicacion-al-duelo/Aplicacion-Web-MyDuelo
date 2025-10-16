// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/actividades-globales/actividades-globales.component.ts
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las actividades'
        });
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
      title: '<i class="bi bi-plus-circle-fill text-primary"></i> Nueva Actividad',
      html: `
        <div class="text-start px-3">
          <!-- Título -->
          <div class="mb-3">
            <label for="titulo" class="form-label fw-bold">
              <i class="bi bi-type text-primary"></i> Título *
            </label>
            <input 
              id="titulo" 
              type="text" 
              class="form-control" 
              placeholder="Ej: Diario de emociones semanales"
              maxlength="255">
          </div>

          <!-- Descripción -->
          <div class="mb-3">
            <label for="descripcion" class="form-label fw-bold">
              <i class="bi bi-card-text text-primary"></i> Descripción *
            </label>
            <textarea 
              id="descripcion" 
              class="form-control" 
              placeholder="Describe los objetivos y pasos de la actividad..."
              rows="4"
              maxlength="2000"></textarea>
            <small class="text-muted">Máximo 2000 caracteres</small>
          </div>

          <!-- Tipo de actividad -->
          <div class="mb-3">
            <label for="tipo" class="form-label fw-bold">
              <i class="bi bi-tag text-primary"></i> Tipo de Actividad
            </label>
            <select id="tipo" class="form-select">
              <option value="">Seleccionar tipo...</option>
              <option value="Reflexión">Reflexión</option>
              <option value="Ejercicio Práctico">Ejercicio Práctico</option>
              <option value="Lectura">Lectura</option>
              <option value="Escritura">Escritura</option>
              <option value="Meditación">Meditación</option>
              <option value="Tarea">Tarea</option>
              <option value="Cuestionario">Cuestionario</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <!-- Archivo adjunto (URL) -->
          <div class="mb-3">
            <label for="archivo_url" class="form-label fw-bold">
              <i class="bi bi-paperclip text-primary"></i> Archivo o Recurso (URL)
            </label>
            <input 
              id="archivo_url" 
              type="url" 
              class="form-control" 
              placeholder="https://ejemplo.com/recurso.pdf">
            <small class="text-muted">
              Puedes adjuntar un enlace a Google Drive, Dropbox, etc.
            </small>
          </div>

          <hr class="my-3">

          <!-- Configuración de la actividad -->
          <div class="mb-3">
            <label class="form-label fw-bold">
              <i class="bi bi-gear text-primary"></i> Configuración
            </label>
            
            <!-- Obligatoria -->
            <div class="form-check form-switch mb-2">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="obligatoria"
                role="switch">
              <label class="form-check-label" for="obligatoria">
                <strong>Actividad obligatoria</strong>
                <small class="d-block text-muted">Los pacientes deben completarla</small>
              </label>
            </div>

            <!-- Repetitiva -->
            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="repetitiva"
                role="switch">
              <label class="form-check-label" for="repetitiva">
                <strong>Actividad repetitiva</strong>
                <small class="d-block text-muted">Se repite periódicamente</small>
              </label>
            </div>
          </div>

          <!-- Periodo (solo si es repetitiva) -->
          <div class="mb-3" id="periodoContainer" style="display: none;">
            <label for="periodo" class="form-label fw-bold">
              <i class="bi bi-arrow-repeat text-primary"></i> Periodo de Repetición (días)
            </label>
            <input 
              id="periodo" 
              type="number" 
              class="form-control" 
              placeholder="7"
              min="1"
              max="365">
            <small class="text-muted">
              Cada cuántos días se debe repetir la actividad
            </small>
          </div>
        </div>
      `,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Crear Actividad',
      cancelButtonText: '<i class="bi bi-x-circle me-1"></i> Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      focusConfirm: false,
      didOpen: () => {
        // Mostrar/ocultar periodo según checkbox repetitiva
        const repetitivaCheckbox = document.getElementById('repetitiva') as HTMLInputElement;
        const periodoContainer = document.getElementById('periodoContainer') as HTMLElement;
        
        repetitivaCheckbox?.addEventListener('change', function() {
          if (this.checked) {
            periodoContainer.style.display = 'block';
          } else {
            periodoContainer.style.display = 'none';
            (document.getElementById('periodo') as HTMLInputElement).value = '';
          }
        });
      },
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value.trim();
        const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
        const archivo_url = (document.getElementById('archivo_url') as HTMLInputElement).value.trim();
        const obligatoria = (document.getElementById('obligatoria') as HTMLInputElement).checked;
        const repetitiva = (document.getElementById('repetitiva') as HTMLInputElement).checked;
        const periodo = (document.getElementById('periodo') as HTMLInputElement).value;

        // Validaciones
        if (!titulo) {
          Swal.showValidationMessage('El título es requerido');
          return null;
        }

        if (!descripcion) {
          Swal.showValidationMessage('La descripción es requerida');
          return null;
        }

        if (repetitiva && !periodo) {
          Swal.showValidationMessage('El periodo es requerido para actividades repetitivas');
          return null;
        }

        if (archivo_url && !this.esURLValida(archivo_url)) {
          Swal.showValidationMessage('La URL del archivo no es válida');
          return null;
        }

        return {
          titulo,
          descripcion,
          tipo: tipo || null,
          archivo_url: archivo_url || null,
          obligatoria,
          repetitiva,
          periodo: repetitiva ? parseInt(periodo) : null
        };
      }
    });

    if (formValues) {
      // Mostrar loading
      Swal.fire({
        title: 'Creando actividad...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadService.crearActividadGlobal(formValues).subscribe({
        next: (nueva) => {
          this.actividades.unshift(nueva);
          Swal.fire({
            icon: 'success',
            title: '¡Actividad creada!',
            text: 'La plantilla se ha creado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al crear actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la actividad. Intenta nuevamente.'
          });
        }
      });
    }
  }

  async editarActividad(actividad: Actividad): Promise<void> {
    const { value: formValues } = await Swal.fire({
      title: '<i class="bi bi-pencil-fill text-primary"></i> Editar Actividad',
      html: `
        <div class="text-start px-3">
          <!-- Título -->
          <div class="mb-3">
            <label for="titulo" class="form-label fw-bold">
              <i class="bi bi-type text-primary"></i> Título *
            </label>
            <input 
              id="titulo" 
              type="text" 
              class="form-control" 
              value="${this.escaparHTML(actividad.titulo)}"
              maxlength="255">
          </div>

          <!-- Descripción -->
          <div class="mb-3">
            <label for="descripcion" class="form-label fw-bold">
              <i class="bi bi-card-text text-primary"></i> Descripción *
            </label>
            <textarea 
              id="descripcion" 
              class="form-control" 
              rows="4"
              maxlength="2000">${this.escaparHTML(actividad.descripcion || '')}</textarea>
          </div>

          <!-- Tipo -->
          <div class="mb-3">
            <label for="tipo" class="form-label fw-bold">
              <i class="bi bi-tag text-primary"></i> Tipo de Actividad
            </label>
            <select id="tipo" class="form-select">
              <option value="">Seleccionar tipo...</option>
              <option value="Reflexión" ${actividad.tipo === 'Reflexión' ? 'selected' : ''}>Reflexión</option>
              <option value="Ejercicio Práctico" ${actividad.tipo === 'Ejercicio Práctico' ? 'selected' : ''}>Ejercicio Práctico</option>
              <option value="Lectura" ${actividad.tipo === 'Lectura' ? 'selected' : ''}>Lectura</option>
              <option value="Escritura" ${actividad.tipo === 'Escritura' ? 'selected' : ''}>Escritura</option>
              <option value="Meditación" ${actividad.tipo === 'Meditación' ? 'selected' : ''}>Meditación</option>
              <option value="Tarea" ${actividad.tipo === 'Tarea' ? 'selected' : ''}>Tarea</option>
              <option value="Cuestionario" ${actividad.tipo === 'Cuestionario' ? 'selected' : ''}>Cuestionario</option>
              <option value="Otro" ${actividad.tipo === 'Otro' ? 'selected' : ''}>Otro</option>
            </select>
          </div>

          <!-- Archivo URL -->
          <div class="mb-3">
            <label for="archivo_url" class="form-label fw-bold">
              <i class="bi bi-paperclip text-primary"></i> Archivo o Recurso (URL)
            </label>
            <input 
              id="archivo_url" 
              type="url" 
              class="form-control" 
              value="${actividad.archivo_url || ''}"
              placeholder="https://ejemplo.com/recurso.pdf">
          </div>

          <hr class="my-3">

          <!-- Configuración -->
          <div class="mb-3">
            <label class="form-label fw-bold">
              <i class="bi bi-gear text-primary"></i> Configuración
            </label>
            
            <div class="form-check form-switch mb-2">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="obligatoria"
                ${actividad.obligatoria ? 'checked' : ''}>
              <label class="form-check-label" for="obligatoria">
                <strong>Actividad obligatoria</strong>
              </label>
            </div>

            <div class="form-check form-switch">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="repetitiva"
                ${actividad.repetitiva ? 'checked' : ''}>
              <label class="form-check-label" for="repetitiva">
                <strong>Actividad repetitiva</strong>
              </label>
            </div>
          </div>

          <!-- Periodo -->
          <div class="mb-3" id="periodoContainer" style="display: ${actividad.repetitiva ? 'block' : 'none'};">
            <label for="periodo" class="form-label fw-bold">
              <i class="bi bi-arrow-repeat text-primary"></i> Periodo de Repetición (días)
            </label>
            <input 
              id="periodo" 
              type="number" 
              class="form-control" 
              value="${actividad.periodo || ''}"
              min="1"
              max="365">
          </div>
        </div>
      `,
      width: '650px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Guardar Cambios',
      cancelButtonText: '<i class="bi bi-x-circle me-1"></i> Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      focusConfirm: false,
      didOpen: () => {
        const repetitivaCheckbox = document.getElementById('repetitiva') as HTMLInputElement;
        const periodoContainer = document.getElementById('periodoContainer') as HTMLElement;
        
        repetitivaCheckbox?.addEventListener('change', function() {
          if (this.checked) {
            periodoContainer.style.display = 'block';
          } else {
            periodoContainer.style.display = 'none';
            (document.getElementById('periodo') as HTMLInputElement).value = '';
          }
        });
      },
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value.trim();
        const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
        const archivo_url = (document.getElementById('archivo_url') as HTMLInputElement).value.trim();
        const obligatoria = (document.getElementById('obligatoria') as HTMLInputElement).checked;
        const repetitiva = (document.getElementById('repetitiva') as HTMLInputElement).checked;
        const periodo = (document.getElementById('periodo') as HTMLInputElement).value;

        if (!titulo || !descripcion) {
          Swal.showValidationMessage('El título y la descripción son requeridos');
          return null;
        }

        if (repetitiva && !periodo) {
          Swal.showValidationMessage('El periodo es requerido para actividades repetitivas');
          return null;
        }

        if (archivo_url && !this.esURLValida(archivo_url)) {
          Swal.showValidationMessage('La URL del archivo no es válida');
          return null;
        }

        return {
          titulo,
          descripcion,
          tipo: tipo || null,
          archivo_url: archivo_url || null,
          obligatoria,
          repetitiva,
          periodo: repetitiva ? parseInt(periodo) : null
        };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Actualizando...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadService.actualizarActividadGlobal(actividad.id_actividad, formValues).subscribe({
        next: (actualizada) => {
          const index = this.actividades.findIndex(a => a.id_actividad === actividad.id_actividad);
          if (index !== -1) {
            this.actividades[index] = actualizada;
          }
          Swal.fire({
            icon: 'success',
            title: '¡Actividad actualizada!',
            text: 'Los cambios se han guardado correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al actualizar actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la actividad'
          });
        }
      });
    }
  }

  async eliminarActividad(actividad: Actividad): Promise<void> {
    this.cerrarMenu();

    const result = await Swal.fire({
      title: '¿Eliminar actividad?',
      html: `
        <p>¿Estás seguro de que deseas eliminar la plantilla:</p>
        <p class="fw-bold text-primary">"${this.escaparHTML(actividad.titulo)}"</p>
        <p class="text-muted small">Esta acción no se puede deshacer</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-trash me-1"></i> Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Eliminando...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadService.eliminarActividadGlobal(actividad.id_actividad).subscribe({
        next: () => {
          this.actividades = this.actividades.filter(a => a.id_actividad !== actividad.id_actividad);
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'La actividad ha sido eliminada',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al eliminar actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la actividad'
          });
        }
      });
    }
  }

  async asignarActividad(actividad: Actividad): Promise<void> {
    this.cerrarMenu();

    if (this.pacientes.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin pacientes',
        text: 'No tienes pacientes registrados para asignar esta actividad'
      });
      return;
    }

    const opcionesPacientes = this.pacientes.map(p => 
      `<option value="${p.id_paciente}">${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}</option>`
    ).join('');

    const { value: formValues } = await Swal.fire({
      title: '<i class="bi bi-person-plus-fill text-primary"></i> Asignar Actividad',
      html: `
        <div class="text-start px-3">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>${this.escaparHTML(actividad.titulo)}</strong>
          </div>

          <div class="mb-3">
            <label for="pacientes" class="form-label fw-bold">
              <i class="bi bi-people text-primary"></i> Paciente(s) *
            </label>
            <select 
              id="pacientes" 
              class="form-select" 
              multiple 
              size="6">
              ${opcionesPacientes}
            </select>
            <small class="text-muted">
              Mantén presionado Ctrl (Cmd en Mac) para seleccionar varios pacientes
            </small>
          </div>

          <div class="mb-3">
            <label for="fecha_limite" class="form-label fw-bold">
              <i class="bi bi-calendar-event text-primary"></i> Fecha Límite
            </label>
            <input 
              id="fecha_limite" 
              type="date" 
              class="form-control"
              min="${new Date().toISOString().split('T')[0]}">
          </div>

          <div class="mb-3">
            <label for="notas" class="form-label fw-bold">
              <i class="bi bi-sticky text-primary"></i> Notas Adicionales
            </label>
            <textarea 
              id="notas" 
              class="form-control" 
              rows="3"
              placeholder="Instrucciones específicas para el paciente..."></textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const selectElement = document.getElementById('pacientes') as HTMLSelectElement;
        const selectedOptions = Array.from(selectElement.selectedOptions);
        const pacientesSeleccionados = selectedOptions.map(option => parseInt(option.value));
        const fecha_limite = (document.getElementById('fecha_limite') as HTMLInputElement).value;
        const notas = (document.getElementById('notas') as HTMLTextAreaElement).value.trim();

        if (pacientesSeleccionados.length === 0) {
          Swal.showValidationMessage('Debes seleccionar al menos un paciente');
          return null;
        }

        return {
          id_actividad: actividad.id_actividad,
          pacientes: pacientesSeleccionados,  
          fecha_limite: fecha_limite || null,
          instrucciones_personalizadas: notas || null  
        };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Asignando actividad...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadService.asignarActividad(formValues).subscribe({
        next: (response) => {
          const cantidadAsignada = formValues.pacientes.length;
          Swal.fire({
            icon: 'success',
            title: '¡Actividad asignada!',
            text: `Se asignó correctamente a ${cantidadAsignada} paciente${cantidadAsignada > 1 ? 's' : ''}`,
            timer: 2500,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al asignar actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo asignar la actividad'
          });
        }
      });
    }
  }

  toggleMenu(idActividad: number): void {
    this.menuAbierto = this.menuAbierto === idActividad ? null : idActividad;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }

  // Métodos auxiliares
  private escaparHTML(texto: string): string {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  private esURLValida(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}