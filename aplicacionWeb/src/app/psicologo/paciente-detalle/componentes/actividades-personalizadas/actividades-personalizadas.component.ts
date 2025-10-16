// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/actividades-personalizadas/actividades-personalizadas.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActividadService } from '../../../../services/actividad.service';
import { PacientesService } from '../../../../services/pacientes.service';
import Swal from 'sweetalert2';
import { ActividadAsignada, Actividad } from '../../../../interfaces/actividad';

@Component({
  selector: 'app-actividades-personalizadas',
  imports: [CommonModule],
  templateUrl: './actividades-personalizadas.component.html',
  styleUrls: ['./actividades-personalizadas.component.css']
})
export class ActividadesPersonalizadasComponent implements OnInit {
  @Input() idPaciente!: number;
  
  actividades: ActividadAsignada[] = [];
  actividadesGlobales: Actividad[] = [];
  cargando: boolean = false;
  menuAbierto: number | null = null;

  constructor(
    private actividadService: ActividadService,
    private pacienteService: PacientesService
  ) {}

  ngOnInit(): void {
    this.cargarActividades();
    this.cargarActividadesGlobales();
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
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las actividades'
        });
      }
    });
  }

  cargarActividadesGlobales(): void {
    this.actividadService.getActividadesGlobales().subscribe({
      next: (data) => {
        this.actividadesGlobales = data;
      },
      error: (error) => {
        console.error('Error al cargar plantillas:', error);
      }
    });
  }

  toggleMenu(idAsignacion: number): void {
    this.menuAbierto = this.menuAbierto === idAsignacion ? null : idAsignacion;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }

  // ==================== NUEVA ACTIVIDAD ====================
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
              rows="3"></textarea>
          </div>

          <!-- Fecha límite -->
          <div class="mb-3">
            <label for="fecha_limite" class="form-label fw-bold">
              <i class="bi bi-calendar-event text-primary"></i> Fecha límite
            </label>
            <input 
              id="fecha_limite" 
              type="date" 
              class="form-control">
          </div>

          <!-- Prioridad -->
          <div class="mb-3">
            <label for="prioridad" class="form-label fw-bold">
              <i class="bi bi-flag text-primary"></i> Prioridad
            </label>
            <select id="prioridad" class="form-select">
              <option value="baja">🟢 Baja</option>
              <option value="media" selected>🟡 Media</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>

          <!-- Instrucciones personalizadas -->
          <div class="mb-3">
            <label for="instrucciones" class="form-label fw-bold">
              <i class="bi bi-chat-left-text text-primary"></i> Instrucciones personalizadas
            </label>
            <textarea 
              id="instrucciones" 
              class="form-control" 
              rows="2"
              placeholder="Instrucciones específicas para este paciente..."></textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Crear y Asignar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value.trim();
        const fecha_limite = (document.getElementById('fecha_limite') as HTMLInputElement).value;
        const prioridad = (document.getElementById('prioridad') as HTMLSelectElement).value;
        const instrucciones = (document.getElementById('instrucciones') as HTMLTextAreaElement).value.trim();

        if (!titulo) {
          Swal.showValidationMessage('El título es obligatorio');
          return null;
        }

        if (!descripcion) {
          Swal.showValidationMessage('La descripción es obligatoria');
          return null;
        }

        return {
          titulo,
          descripcion,
          fecha_limite: fecha_limite || null,
          prioridad: prioridad as 'baja' | 'media' | 'alta',
          instrucciones_personalizadas: instrucciones || null
        };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Creando actividad...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Primero crear la plantilla
      this.actividadService.crearActividadGlobal({
        titulo: formValues.titulo,
        descripcion: formValues.descripcion,
        tipo: 'personalizada',
        obligatoria: false,
        repetitiva: false
      }).subscribe({
        next: (nuevaActividad) => {
          // Luego asignarla al paciente
          this.actividadService.asignarActividad({
            id_actividad: nuevaActividad.id_actividad,
            pacientes: [this.idPaciente],
            fecha_limite: formValues.fecha_limite,
            instrucciones_personalizadas: formValues.instrucciones_personalizadas,
            prioridad: formValues.prioridad
          }).subscribe({
            next: () => {
              this.cargarActividades();
              Swal.fire({
                icon: 'success',
                title: '¡Actividad creada!',
                text: 'La actividad se ha creado y asignado correctamente',
                timer: 2500,
                showConfirmButton: false
              });
            },
            error: (error) => {
              console.error('Error al asignar actividad:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'La actividad se creó pero no se pudo asignar'
              });
            }
          });
        },
        error: (error) => {
          console.error('Error al crear actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la actividad'
          });
        }
      });
    }
  }

  // ==================== ASIGNAR ACTIVIDAD EXISTENTE ====================
  async asignarActividad(): Promise<void> {
    if (this.actividadesGlobales.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin plantillas',
        text: 'No tienes plantillas de actividades creadas. Crea una primero.'
      });
      return;
    }

    const opcionesActividades = this.actividadesGlobales
      .map(act => `<option value="${act.id_actividad}">${act.titulo}</option>`)
      .join('');

    const { value: formValues } = await Swal.fire({
      title: '<i class="bi bi-link-45deg text-primary"></i> Asignar Actividad Existente',
      html: `
        <div class="text-start px-3">
          <!-- Selección de actividad -->
          <div class="mb-3">
            <label for="actividad_select" class="form-label fw-bold">
              <i class="bi bi-file-earmark-text text-primary"></i> Selecciona una plantilla *
            </label>
            <select id="actividad_select" class="form-select">
              <option value="">Seleccionar...</option>
              ${opcionesActividades}
            </select>
          </div>

          <!-- Fecha límite -->
          <div class="mb-3">
            <label for="fecha_limite_asign" class="form-label fw-bold">
              <i class="bi bi-calendar-event text-primary"></i> Fecha límite
            </label>
            <input 
              id="fecha_limite_asign" 
              type="date" 
              class="form-control">
          </div>

          <!-- Prioridad -->
          <div class="mb-3">
            <label for="prioridad_asign" class="form-label fw-bold">
              <i class="bi bi-flag text-primary"></i> Prioridad
            </label>
            <select id="prioridad_asign" class="form-select">
              <option value="baja">🟢 Baja</option>
              <option value="media" selected>🟡 Media</option>
              <option value="alta">🔴 Alta</option>
            </select>
          </div>

          <!-- Instrucciones personalizadas -->
          <div class="mb-3">
            <label for="instrucciones_asign" class="form-label fw-bold">
              <i class="bi bi-chat-left-text text-primary"></i> Instrucciones personalizadas
            </label>
            <textarea 
              id="instrucciones_asign" 
              class="form-control" 
              rows="3"
              placeholder="Instrucciones específicas para este paciente..."></textarea>
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
        const id_actividad = parseInt((document.getElementById('actividad_select') as HTMLSelectElement).value);
        const fecha_limite = (document.getElementById('fecha_limite_asign') as HTMLInputElement).value;
        const prioridad = (document.getElementById('prioridad_asign') as HTMLSelectElement).value;
        const instrucciones = (document.getElementById('instrucciones_asign') as HTMLTextAreaElement).value.trim();

        if (!id_actividad) {
          Swal.showValidationMessage('Debes seleccionar una actividad');
          return null;
        }

        return {
          id_actividad,
          fecha_limite: fecha_limite || null,
          prioridad: prioridad as 'baja' | 'media' | 'alta',
          instrucciones_personalizadas: instrucciones || null
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

      this.actividadService.asignarActividad({
        id_actividad: formValues.id_actividad,
        pacientes: [this.idPaciente],
        fecha_limite: formValues.fecha_limite,
        instrucciones_personalizadas: formValues.instrucciones_personalizadas,
        prioridad: formValues.prioridad
      }).subscribe({
        next: () => {
          this.cargarActividades();
          Swal.fire({
            icon: 'success',
            title: '¡Actividad asignada!',
            text: 'La actividad se asignó correctamente',
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

  // ==================== CAMBIAR ESTADO ====================
  cambiarEstado(actividad: ActividadAsignada): void {
    const nuevoEstado = actividad.estado === 'en_proceso' ? 'finalizada' : 'en_proceso';
    
    this.cerrarMenu();

    Swal.fire({
      title: 'Cambiando estado...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadService.actualizarActividadAsignada(actividad.id_asignacion, {
      estado: nuevoEstado
    }).subscribe({
      next: () => {
        actividad.estado = nuevoEstado;
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: `La actividad ahora está: ${nuevoEstado === 'finalizada' ? 'Finalizada' : 'En Proceso'}`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cambiar el estado'
        });
      }
    });
  }

  // ==================== MODIFICAR ACTIVIDAD ====================
  async modificarActividad(actividad: ActividadAsignada): Promise<void> {
    this.cerrarMenu();

    const { value: formValues } = await Swal.fire({
      title: '<i class="bi bi-pencil-fill text-primary"></i> Modificar Actividad',
      html: `
        <div class="text-start px-3">
          <p class="text-muted mb-3">
            <strong>Actividad:</strong> ${actividad.actividad?.titulo || 'Sin título'}
          </p>

          <!-- Fecha límite -->
          <div class="mb-3">
            <label for="fecha_limite_mod" class="form-label fw-bold">
              <i class="bi bi-calendar-event text-primary"></i> Fecha límite
            </label>
            <input 
              id="fecha_limite_mod" 
              type="date" 
              class="form-control"
              value="${actividad.fecha_limite || ''}">
          </div>

          <!-- Prioridad -->
          <div class="mb-3">
            <label for="prioridad_mod" class="form-label fw-bold">
              <i class="bi bi-flag text-primary"></i> Prioridad
            </label>
            <select id="prioridad_mod" class="form-select">
              <option value="baja" ${actividad.prioridad === 'baja' ? 'selected' : ''}>🟢 Baja</option>
              <option value="media" ${actividad.prioridad === 'media' ? 'selected' : ''}>🟡 Media</option>
              <option value="alta" ${actividad.prioridad === 'alta' ? 'selected' : ''}>🔴 Alta</option>
            </select>
          </div>

          <!-- Estado -->
          <div class="mb-3">
            <label for="estado_mod" class="form-label fw-bold">
              <i class="bi bi-check-circle text-primary"></i> Estado
            </label>
            <select id="estado_mod" class="form-select">
              <option value="en_proceso" ${actividad.estado === 'en_proceso' ? 'selected' : ''}>En Proceso</option>
              <option value="finalizada" ${actividad.estado === 'finalizada' ? 'selected' : ''}>Finalizada</option>
            </select>
          </div>

          <!-- Instrucciones personalizadas -->
          <div class="mb-3">
            <label for="instrucciones_mod" class="form-label fw-bold">
              <i class="bi bi-chat-left-text text-primary"></i> Instrucciones personalizadas
            </label>
            <textarea 
              id="instrucciones_mod" 
              class="form-control" 
              rows="3"
              placeholder="Instrucciones específicas...">${actividad.instrucciones_personalizadas || ''}</textarea>
          </div>
        </div>
      `,
      width: '600px',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-circle me-1"></i> Guardar cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const fecha_limite = (document.getElementById('fecha_limite_mod') as HTMLInputElement).value;
        const prioridad = (document.getElementById('prioridad_mod') as HTMLSelectElement).value;
        const estado = (document.getElementById('estado_mod') as HTMLSelectElement).value;
        const instrucciones = (document.getElementById('instrucciones_mod') as HTMLTextAreaElement).value.trim();

        return {
          fecha_limite: fecha_limite || null,
          prioridad: prioridad as 'baja' | 'media' | 'alta',
          estado: estado as 'en_proceso' | 'finalizada',
          instrucciones_personalizadas: instrucciones || null
        };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Guardando cambios...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.actividadService.actualizarActividadAsignada(actividad.id_asignacion, formValues).subscribe({
        next: () => {
          this.cargarActividades();
          Swal.fire({
            icon: 'success',
            title: '¡Cambios guardados!',
            text: 'La actividad se actualizó correctamente',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (error) => {
          console.error('Error al modificar actividad:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron guardar los cambios'
          });
        }
      });
    }
  }

  // ==================== ELIMINAR ACTIVIDAD ====================
  async eliminarActividad(actividad: ActividadAsignada): Promise<void> {
    this.cerrarMenu();

    const result = await Swal.fire({
      title: '¿Eliminar actividad asignada?',
      html: `
        <p>¿Estás seguro de que deseas eliminar la asignación de:</p>
        <p class="fw-bold text-primary">"${actividad.actividad?.titulo || 'Sin título'}"</p>
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

      this.actividadService.eliminarActividadAsignada(actividad.id_asignacion).subscribe({
        next: () => {
          this.actividades = this.actividades.filter(a => a.id_asignacion !== actividad.id_asignacion);
          Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'La actividad ha sido desasignada',
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

  // ==================== ENVIAR RECORDATORIO ====================
  mandarRecordatorio(actividad: ActividadAsignada): void {
    this.cerrarMenu();

    Swal.fire({
      title: 'Enviando recordatorio...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadService.enviarRecordatorio(actividad.id_asignacion).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Recordatorio enviado!',
          text: 'El paciente recibirá una notificación',
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('Error al enviar recordatorio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo enviar el recordatorio'
        });
      }
    });
  }

  // ==================== UTILIDADES ====================
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