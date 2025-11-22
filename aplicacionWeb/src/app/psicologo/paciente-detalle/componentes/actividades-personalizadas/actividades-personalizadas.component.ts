// actividades-personalizadas.component.ts - VERSIÓN CORREGIDA
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActividadService } from '../../../../services/actividad.service';
import Swal from 'sweetalert2';
import { ActividadAsignada, Actividad } from '../../../../interfaces/actividad';
import { ActividadDetalleModalComponent } from '../actividades-globales/actividad-detalle-modal/actividad-detalle-modal.component';
import { ToastrService } from 'ngx-toastr';
import { Evidencia } from '../../../../interfaces/moduloDuelo'; 
import { VisorEvidenciaComponent } from '../modulos-duelo/componentes/visor-evidencia/visor-evidencia.component';


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
  imports: [CommonModule, FormsModule,
    ReactiveFormsModule,
    ActividadDetalleModalComponent,
    VisorEvidenciaComponent],
  templateUrl: './actividades-personalizadas.component.html',
  styleUrls: ['./actividades-personalizadas.component.css']
})
export class ActividadesPersonalizadasComponent implements OnInit {
  @Input() idPaciente!: number;

  mostrarVisorEvidencia: boolean = false;
  evidenciaSeleccionada: Evidencia | null = null;
  
  actividades: ActividadAsignada[] = [];
  actividadesFiltradas: ActividadAsignada[] = [];
  actividadesGlobales: Actividad[] = [];
  actividadSeleccionada: ActividadAsignada | null = null;
  
  cargando: boolean = false;
  menuAbierto: number | null = null;
  mostrarPanelDetalle: boolean = false;
  mostrarFiltros: boolean = false;

  mostrarModalCrear: boolean = false;
  actividadNueva: Actividad | null = null;
  
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
    private toastr: ToastrService,
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
    // ⭐ CORREGIDO: Verificar que evidencias existe y tiene elementos
    this.estadisticas.conEvidencia = this.actividades.filter(a => 
      a.evidencias && Array.isArray(a.evidencias) && a.evidencias.length > 0
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

    // ⭐ CORREGIDO: Filtro por evidencia con verificación segura
    if (this.filtros.mostrarSoloConEvidencia) {
      resultado = resultado.filter(a => 
        a.evidencias && Array.isArray(a.evidencias) && a.evidencias.length > 0
      );
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
          const prioridadOrden: Record<string, number> = { 'alta': 3, 'media': 2, 'baja': 1 };
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
            if (nuevoEstado === 'finalizada') {
              actividad.fecha_completada = new Date().toISOString();
            }
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

    const opcionesActividades = this.actividadesGlobales.reduce((acc, a) => {
      acc[a.id_actividad.toString()] = a.titulo;
      return acc;
    }, {} as Record<string, string>);

    Swal.fire({
      title: 'Asignar Actividad Existente',
      input: 'select',
      inputOptions: opcionesActividades,
      inputPlaceholder: 'Selecciona una actividad',
      showCancelButton: true,
      confirmButtonText: 'Asignar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const idActividad = parseInt(result.value);
        this.actividadService.asignarActividadAPaciente(this.idPaciente, idActividad).subscribe({
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
    // Crear actividad vacía para el modal
    this.actividadNueva = {
      id_actividad: 0,
      titulo: '',
      descripcion: '',
      tipo: 'personalizada',
      obligatoria: false,
      repetitiva: false,
      origen: 'personalizada'
    };
    
    // Mostrar el modal
    this.mostrarModalCrear = true;
  }

  // ✅ AGREGAR método para manejar el cierre del modal
  onModalCrearClose(result: any): void {
    // Limpiar el estado del modal
    this.mostrarModalCrear = false;
    
    // Limpiar backdrops residuales
    this.limpiarBackdrops();
    
    // Si se guardó la actividad, crearla y asignarla al paciente
    if (result && result.accion === 'guardar') {
      this.guardarActividadPersonalizada(result.actividad);
    }
    
    // Limpiar la actividad temporal
    this.actividadNueva = null;
  }
  
  // ✅ AGREGAR método para guardar la actividad personalizada
  private guardarActividadPersonalizada(actividad: Actividad): void {
    // Datos de la nueva actividad personalizada
    const nuevaActividad = {
      titulo: actividad.titulo,
      descripcion: actividad.descripcion || '',  // ✅ CORRECCIÓN: Garantizar que sea string
      tipo: 'personalizada',  // ✅ CORRECCIÓN: Siempre fijo
      id_paciente: this.idPaciente,
      prioridad: 'media' as 'baja' | 'media' | 'alta'
    };

    // Crear la actividad personalizada (la crea y la asigna automáticamente)
    this.actividadService.crearActividadPersonalizada(nuevaActividad).subscribe({
      next: () => {
        this.toastr.success('Actividad creada y asignada correctamente');
        this.cargarActividades();
      },
      error: (error) => {
        console.error('Error al crear actividad personalizada:', error);
        this.toastr.error('Error al crear la actividad');
      }
    });
  }
  // ✅ AGREGAR método para limpiar backdrops
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

  /**
   * Descargar evidencia
   */
  // descargarEvidencia(archivoUrl: string): void {
  //   // Crear un elemento <a> temporal para forzar la descarga
  //   const link = document.createElement('a');
  //   link.href = archivoUrl;
  //   link.target = '_blank';
    
  //   // Extraer el nombre del archivo de la URL
  //   const nombreArchivo = archivoUrl.split('/').pop() || 'evidencia';
  //   link.download = nombreArchivo;
    
  //   // Forzar click
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // }
  /**
 * Ver evidencia en modal
 */
  verEvidencia(evidencia: any): void {
    this.evidenciaSeleccionada = evidencia;
    this.mostrarVisorEvidencia = true;
  }

  /**
   * Cerrar visor de evidencia
   */
  cerrarVisorEvidencia(): void {
    this.mostrarVisorEvidencia = false;
    this.evidenciaSeleccionada = null;
  }

  /**
   * Descargar evidencia
   */
  descargarEvidencia(archivoUrl: string): void {
    window.open(archivoUrl, '_blank');
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

  // ⭐ MÉTODO AUXILIAR: Verificar si una actividad tiene evidencias
  tieneEvidencias(actividad: ActividadAsignada): boolean {
    return !!(actividad.evidencias && Array.isArray(actividad.evidencias) && actividad.evidencias.length > 0);
  }

  // ⭐ MÉTODO AUXILIAR: Obtener cantidad de evidencias
  cantidadEvidencias(actividad: ActividadAsignada): number {
    return this.tieneEvidencias(actividad) ? (actividad.evidencias?.length || 0) : 0;
  }
}