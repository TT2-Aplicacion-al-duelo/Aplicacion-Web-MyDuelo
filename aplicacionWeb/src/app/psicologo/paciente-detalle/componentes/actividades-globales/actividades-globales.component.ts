import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActividadesService } from '../../../../services/actividades.service';
import { PacientesService } from '../../../../services/pacientes.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ActividadDetalleModalComponent } from './actividad-detalle-modal/actividad-detalle-modal.component';
import { AsignarActividadModalComponent } from './asignar-actividad-modal/asignar-actividad-modal.component';

export interface Actividad {
  id_actividad: number;
  titulo: string;
  descripcion: string;
  tipo: string;
  obligatoria: boolean;
  repetitiva: boolean;
  periodo?: number;
  archivo_url?: string;
  origen: 'personalizada' | 'modulo';
  id_psicologo_creador?: number;
  fecha_creacion?: Date;
}

export interface Paciente {
  id_paciente: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  telefono?: string;
  foto_url?: string;
}

@Component({
  selector: 'app-actividades-globales',
  templateUrl: './actividades-globales.component.html',
  styleUrls: ['./actividades-globales.component.scss']
})
export class ActividadesGlobalesComponent implements OnInit {
  
  actividades: Actividad[] = [];
  actividadesFiltradas: Actividad[] = [];
  isLoading = false;
  searchTerm = '';
  tipoFiltro = 'todas';
  
  displayedColumns: string[] = ['titulo', 'tipo', 'descripcion', 'obligatoria', 'origen', 'acciones'];
  
  constructor(
    private actividadesService: ActividadesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
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
      error: (error) => {
        console.error('Error al cargar actividades:', error);
        this.mostrarMensaje('Error al cargar las actividades', 'error');
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
    const dialogRef = this.dialog.open(ActividadDetalleModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { 
        actividad: actividad,
        modoEdicion: false 
      },
      panelClass: 'actividad-detalle-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.accion === 'editar') {
          this.editarActividad(result.actividad);
        } else if (result.accion === 'asignar') {
          this.asignarActividad(result.actividad);
        } else if (result.accion === 'eliminar') {
          this.eliminarActividad(result.actividad);
        }
      }
    });
  }

  editarActividad(actividad: Actividad): void {
    const dialogRef = this.dialog.open(ActividadDetalleModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { 
        actividad: actividad,
        modoEdicion: true 
      },
      panelClass: 'actividad-detalle-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.guardado) {
        this.actualizarActividad(result.actividad);
      }
    });
  }

  actualizarActividad(actividad: Actividad): void {
    this.isLoading = true;
    this.actividadesService.actualizarActividad(actividad.id_actividad, actividad).subscribe({
      next: (response) => {
        this.mostrarMensaje('Actividad actualizada correctamente', 'success');
        this.cargarActividades();
      },
      error: (error) => {
        console.error('Error al actualizar actividad:', error);
        this.mostrarMensaje('Error al actualizar la actividad', 'error');
        this.isLoading = false;
      }
    });
  }

  asignarActividad(actividad: Actividad): void {
    const dialogRef = this.dialog.open(AsignarActividadModalComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '80vh',
      data: { actividad: actividad }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.pacientesSeleccionados && result.pacientesSeleccionados.length > 0) {
        this.asignarAPacientes(actividad, result.pacientesSeleccionados, result.configuracion);
      }
    });
  }

  asignarAPacientes(actividad: Actividad, pacientes: number[], configuracion: any): void {
    this.isLoading = true;
    
    const asignaciones = pacientes.map(idPaciente => ({
      id_actividad: actividad.id_actividad,
      id_paciente: idPaciente,
      fecha_limite: configuracion.fechaLimite,
      instrucciones_personalizadas: configuracion.instrucciones,
      prioridad: configuracion.prioridad || 'media'
    }));

    this.actividadesService.asignarActividadMultiple(asignaciones).subscribe({
      next: (response) => {
        this.mostrarMensaje(
          `Actividad asignada a ${pacientes.length} paciente(s) correctamente`,
          'success'
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al asignar actividad:', error);
        this.mostrarMensaje('Error al asignar la actividad', 'error');
        this.isLoading = false;
      }
    });
  }

  eliminarActividad(actividad: Actividad): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Confirmar eliminación',
        mensaje: `¿Está seguro de que desea eliminar la actividad "${actividad.titulo}"?`,
        textoConfirmar: 'Eliminar',
        textoCancelar: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isLoading = true;
        this.actividadesService.eliminarActividad(actividad.id_actividad).subscribe({
          next: (response) => {
            this.mostrarMensaje('Actividad eliminada correctamente', 'success');
            this.cargarActividades();
          },
          error: (error) => {
            console.error('Error al eliminar actividad:', error);
            this.mostrarMensaje('Error al eliminar la actividad', 'error');
            this.isLoading = false;
          }
        });
      }
    });
  }

  crearNuevaActividad(): void {
    const nuevaActividad: Partial<Actividad> = {
      titulo: '',
      descripcion: '',
      tipo: '',
      obligatoria: false,
      repetitiva: false,
      origen: 'personalizada'
    };

    const dialogRef = this.dialog.open(ActividadDetalleModalComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { 
        actividad: nuevaActividad,
        modoEdicion: true,
        esNueva: true
      },
      panelClass: 'actividad-detalle-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.guardado) {
        this.guardarNuevaActividad(result.actividad);
      }
    });
  }

  guardarNuevaActividad(actividad: Partial<Actividad>): void {
    this.isLoading = true;
    this.actividadesService.crearActividad(actividad).subscribe({
      next: (response) => {
        this.mostrarMensaje('Actividad creada correctamente', 'success');
        this.cargarActividades();
      },
      error: (error) => {
        console.error('Error al crear actividad:', error);
        this.mostrarMensaje('Error al crear la actividad', 'error');
        this.isLoading = false;
      }
    });
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: tipo === 'error' ? 5000 : 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${tipo}`]
    });
  }
}