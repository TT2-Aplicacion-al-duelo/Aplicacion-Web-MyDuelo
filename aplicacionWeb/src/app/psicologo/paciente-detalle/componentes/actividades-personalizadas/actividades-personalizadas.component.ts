// actividades-personalizadas.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActividadService } from '../../../../services/actividad.service';
import { PacientesService } from '../../../../services/pacientes.service';
import Swal from 'sweetalert2';
import { ActividadAsignada, Actividad } from '../../../../interfaces/actividad';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface FiltrosActividad {
  estado: string;
  prioridad: string;
  busqueda: string;
  ordenarPor: 'fecha' | 'prioridad' | 'titulo';
  mostrarSoloConEvidencia: boolean;
}

@Component({
  selector: 'app-actividades-personalizadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './actividades-personalizadas.component.html',
  styleUrls: ['./actividades-personalizadas.component.css']
})
export class ActividadesPersonalizadasComponent implements OnInit {
  @Input() idPaciente!: number;
  
  actividades: ActividadAsignada[] = [];
  actividadesFiltradas: ActividadAsignada[] = [];
  actividadesGlobales: Actividad[] = [];
  actividadSeleccionada: ActividadAsignada | null = null;
  
  cargando: boolean = false;
  menuAbierto: number | null = null;
  mostrarPanelDetalle: boolean = false;
  mostrarFiltros: boolean = false;
  
  // Filtros
  filtros: FiltrosActividad = {
    estado: 'todos',
    prioridad: 'todos',
    busqueda: '',
    ordenarPor: 'fecha',
    mostrarSoloConEvidencia: false
  };

  // Estadísticas
  estadisticas = {
    total: 0,
    enProceso: 0,
    finalizadas: 0,
    conEvidencia: 0
  };

  constructor(
    private actividadService: ActividadService,
    private pacienteService: PacientesService,
    private sanitizer: DomSanitizer
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
        this.calcularEstadisticas();
        this.aplicarFiltros();
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

  calcularEstadisticas(): void {
    this.estadisticas.total = this.actividades.length;
    this.estadisticas.enProceso = this.actividades.filter(a => a.estado === 'en_proceso').length;
    this.estadisticas.finalizadas = this.actividades.filter(a => a.estado === 'finalizada').length;
    this.estadisticas.conEvidencia = this.actividades.filter(a => 
      a.evidencias && a.evidencias.length > 0
    ).length;
  }

  aplicarFiltros(): void {
    let resultado = [...this.actividades];

    // Filtro por estado
    if (this.filtros.estado !== 'todos') {
      resultado = resultado.filter(a => a.estado === this.filtros.estado);
    }

    // Filtro por prioridad
    if (this.filtros.prioridad !== 'todos') {
      resultado = resultado.filter(a => a.prioridad === this.filtros.prioridad);
    }

    // Filtro por búsqueda
    if (this.filtros.busqueda.trim()) {
      const busqueda = this.filtros.busqueda.toLowerCase();
      resultado = resultado.filter(a => 
        a.actividad?.titulo?.toLowerCase().includes(busqueda) ||
        a.actividad?.descripcion?.toLowerCase().includes(busqueda) ||
        a.instrucciones_personalizadas?.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por evidencia
    if (this.filtros.mostrarSoloConEvidencia) {
      resultado = resultado.filter(a => a.evidencias && a.evidencias.length > 0);
    }

    // Ordenamiento
    resultado = this.ordenarActividades(resultado);

    this.actividadesFiltradas = resultado;
  }

  ordenarActividades(actividades: ActividadAsignada[]): ActividadAsignada[] {
    return actividades.sort((a, b) => {
      switch (this.filtros.ordenarPor) {
        case 'fecha':
          const fechaA = a.fecha_limite ? new Date(a.fecha_limite).getTime() : 0;
          const fechaB = b.fecha_limite ? new Date(b.fecha_limite).getTime() : 0;
          return fechaB - fechaA;
        
        case 'prioridad':
          const prioridadOrden = { 'alta': 3, 'media': 2, 'baja': 1 };
          return (prioridadOrden[b.prioridad || 'baja'] || 0) - (prioridadOrden[a.prioridad || 'baja'] || 0);
        
        case 'titulo':
          return (a.actividad?.titulo || '').localeCompare(b.actividad?.titulo || '');
        
        default:
          return 0;
      }
    });
  }

  toggleMenu(idAsignacion: number): void {
    this.menuAbierto = this.menuAbierto === idAsignacion ? null : idAsignacion;
  }

  cerrarMenu(): void {
    this.menuAbierto = null;
  }

  verDetalleActividad(actividad: ActividadAsignada): void {
    this.actividadSeleccionada = actividad;
    this.mostrarPanelDetalle = true;
    this.cerrarMenu();
  }

  cerrarPanelDetalle(): void {
    this.mostrarPanelDetalle = false;
    this.actividadSeleccionada = null;
  }

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  limpiarFiltros(): void {
    this.filtros = {
      estado: 'todos',
      prioridad: 'todos',
      busqueda: '',
      ordenarPor: 'fecha',
      mostrarSoloConEvidencia: false
    };
    this.aplicarFiltros();
  }

  cambiarEstado(actividad: ActividadAsignada): void {
    const nuevoEstado = actividad.estado === 'en_proceso' ? 'finalizada' : 'en_proceso';
    
    Swal.fire({
      title: '¿Cambiar estado?',
      text: `¿Deseas marcar esta actividad como "${nuevoEstado === 'finalizada' ? 'Finalizada' : 'En Proceso'}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.actualizarEstadoActividad(actividad.id_asignacion, nuevoEstado).subscribe({
          next: () => {
            actividad.estado = nuevoEstado;
            this.calcularEstadisticas();
            this.aplicarFiltros();
            Swal.fire('¡Actualizado!', 'El estado ha sido cambiado', 'success');
          },
          error: (error) => {
            console.error('Error al cambiar estado:', error);
            Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
          }
        });
      }
    });
    this.cerrarMenu();
  }

  editarActividad(actividad: ActividadAsignada): void {
    Swal.fire({
      title: 'Editar Instrucciones',
      input: 'textarea',
      inputLabel: 'Instrucciones personalizadas',
      inputValue: actividad.instrucciones_personalizadas || '',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Las instrucciones no pueden estar vacías';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.actualizarInstruccionesActividad(
          actividad.id_asignacion, 
          result.value
        ).subscribe({
          next: () => {
            actividad.instrucciones_personalizadas = result.value;
            this.aplicarFiltros();
            Swal.fire('¡Actualizado!', 'Las instrucciones han sido actualizadas', 'success');
          },
          error: (error) => {
            console.error('Error al actualizar instrucciones:', error);
            Swal.fire('Error', 'No se pudieron actualizar las instrucciones', 'error');
          }
        });
      }
    });
    this.cerrarMenu();
  }

  eliminarActividad(actividad: ActividadAsignada): void {
    Swal.fire({
      title: '¿Eliminar actividad?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actividadService.eliminarActividadAsignada(actividad.id_asignacion).subscribe({
          next: () => {
            this.actividades = this.actividades.filter(a => a.id_asignacion !== actividad.id_asignacion);
            this.calcularEstadisticas();
            this.aplicarFiltros();
            Swal.fire('¡Eliminada!', 'La actividad ha sido eliminada', 'success');
          },
          error: (error) => {
            console.error('Error al eliminar actividad:', error);
            Swal.fire('Error', 'No se pudo eliminar la actividad', 'error');
          }
        });
      }
    });
    this.cerrarMenu();
  }

  asignarActividad(): void {
    if (this.actividadesGlobales.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin plantillas',
        text: 'No hay actividades globales disponibles para asignar'
      });
      return;
    }

    const opcionesActividades = this.actividadesGlobales.map(a => ({
      value: a.id_actividad.toString(),
      text: a.titulo
    }));

    Swal.fire({
      title: 'Asignar Actividad Existente',
      input: 'select',
      inputOptions: Object.fromEntries(opcionesActividades.map(o => [o.value, o.text])),
      inputPlaceholder: 'Selecciona una actividad',
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const idActividad = parseInt(result.value);
        this.actividadService.asignarActividad(this.idPaciente, idActividad).subscribe({
          next: () => {
            this.cargarActividades();
            Swal.fire('¡Asignada!', 'La actividad ha sido asignada al paciente', 'success');
          },
          error: (error) => {
            console.error('Error al asignar actividad:', error);
            Swal.fire('Error', 'No se pudo asignar la actividad', 'error');
          }
        });
      }
    });
  }

  crearActividad(): void {
    Swal.fire({
      title: 'Nueva Actividad Personalizada',
      html: `
        <input id="titulo" class="swal2-input" placeholder="Título de la actividad">
        <textarea id="descripcion" class="swal2-textarea" placeholder="Descripción"></textarea>
        <select id="prioridad" class="swal2-select">
          <option value="baja">Prioridad Baja</option>
          <option value="media" selected>Prioridad Media</option>
          <option value="alta">Prioridad Alta</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const titulo = (document.getElementById('titulo') as HTMLInputElement).value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value;
        const prioridad = (document.getElementById('prioridad') as HTMLSelectElement).value;

        if (!titulo) {
          Swal.showValidationMessage('El título es requerido');
          return null;
        }

        return { titulo, descripcion, prioridad };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevaActividad = {
          titulo: result.value.titulo,
          descripcion: result.value.descripcion,
          tipo: 'personalizada',
          id_paciente: this.idPaciente,
          prioridad: result.value.prioridad
        };

        this.actividadService.crearActividad(nuevaActividad).subscribe({
          next: () => {
            this.cargarActividades();
            Swal.fire('¡Creada!', 'La actividad ha sido creada', 'success');
          },
          error: (error) => {
            console.error('Error al crear actividad:', error);
            Swal.fire('Error', 'No se pudo crear la actividad', 'error');
          }
        });
      }
    });
  }

  descargarEvidencia(url: string): void {
    window.open(url, '_blank');
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'en_proceso': 'badge bg-warning text-dark',
      'finalizada': 'badge bg-success'
    };
    return classes[estado] || 'badge bg-secondary';
  }

  getPrioridadClass(prioridad: string): string {
    const classes: Record<string, string> = {
      'alta': 'badge bg-danger',
      'media': 'badge bg-warning text-dark',
      'baja': 'badge bg-info'
    };
    return classes[prioridad] || 'badge bg-secondary';
  }

  getTipoArchivoIcon(tipoArchivo: string): string {
    const iconos: Record<string, string> = {
      'imagen': 'bi-file-earmark-image',
      'video': 'bi-file-earmark-play',
      'audio': 'bi-file-earmark-music',
      'documento': 'bi-file-earmark-text',
      'otro': 'bi-file-earmark'
    };
    return iconos[tipoArchivo] || 'bi-file-earmark';
  }

  getTipoArchivoColor(tipoArchivo: string): string {
    const colores: Record<string, string> = {
      'imagen': 'primary',
      'video': 'danger',
      'audio': 'warning',
      'documento': 'info',
      'otro': 'secondary'
    };
    return colores[tipoArchivo] || 'secondary';
  }
}