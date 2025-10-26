// asignar-actividad-modal.component.ts

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PacientesService } from '../../../../../services/pacientes.service'


export interface AsignarActividadDialogData {
  actividad: any;
}

export interface Paciente {
  id_paciente: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  email: string;
  telefono?: string;
  foto_url?: string;
  seleccionado?: boolean;
}

@Component({
  selector: 'app-asignar-actividad-modal',
  templateUrl: './asignar-actividad-modal.component.html',
  styleUrls: ['./asignar-actividad-modal.component.scss']
})
export class AsignarActividadModalComponent implements OnInit {
  
  asignacionForm: FormGroup;
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  pacientesSeleccionados: Set<number> = new Set();
  searchTerm = '';
  isLoading = false;
  todosSeleccionados = false;
  
  prioridades = [
    { value: 'baja', label: 'Baja', icon: 'arrow_downward', color: 'accent' },
    { value: 'media', label: 'Media', icon: 'remove', color: 'primary' },
    { value: 'alta', label: 'Alta', icon: 'arrow_upward', color: 'warn' }
  ];

  constructor(
    public dialogRef: MatDialogRef<AsignarActividadModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AsignarActividadDialogData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private pacientesService: PacientesService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.cargarPacientes();
  }

  inicializarFormulario(): void {
    const fechaManana = new Date();
    fechaManana.setDate(fechaManana.getDate() + 1);
    
    this.asignacionForm = this.fb.group({
      fechaLimite: [fechaManana, [Validators.required]],
      instrucciones: ['', [Validators.maxLength(500)]],
      prioridad: ['media', [Validators.required]]
    });
  }

  cargarPacientes(): void {
    this.isLoading = true;
    this.pacientesService.obtenerPacientesDelPsicologo().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = data.map(p => ({ ...p, seleccionado: false }));
        this.pacientesFiltrados = [...this.pacientes];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.snackBar.open('Error al cargar los pacientes', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  buscarPacientes(): void {
    if (!this.searchTerm) {
      this.pacientesFiltrados = [...this.pacientes];
    } else {
      const termino = this.searchTerm.toLowerCase();
      this.pacientesFiltrados = this.pacientes.filter(p => 
        p.nombre.toLowerCase().includes(termino) ||
        p.apellido_paterno.toLowerCase().includes(termino) ||
        p.apellido_materno?.toLowerCase().includes(termino) ||
        p.email.toLowerCase().includes(termino)
      );
    }
    
    // Actualizar el estado de todos seleccionados
    this.actualizarEstadoTodosSeleccionados();
  }

  togglePaciente(paciente: Paciente): void {
    if (this.pacientesSeleccionados.has(paciente.id_paciente)) {
      this.pacientesSeleccionados.delete(paciente.id_paciente);
      paciente.seleccionado = false;
    } else {
      this.pacientesSeleccionados.add(paciente.id_paciente);
      paciente.seleccionado = true;
    }
    
    this.actualizarEstadoTodosSeleccionados();
  }

  toggleTodos(): void {
    if (this.todosSeleccionados) {
      // Deseleccionar todos
      this.pacientesFiltrados.forEach(p => {
        this.pacientesSeleccionados.delete(p.id_paciente);
        p.seleccionado = false;
      });
      this.todosSeleccionados = false;
    } else {
      // Seleccionar todos los filtrados
      this.pacientesFiltrados.forEach(p => {
        this.pacientesSeleccionados.add(p.id_paciente);
        p.seleccionado = true;
      });
      this.todosSeleccionados = true;
    }
  }

  actualizarEstadoTodosSeleccionados(): void {
    const todosFiltradosSeleccionados = this.pacientesFiltrados.length > 0 &&
      this.pacientesFiltrados.every(p => this.pacientesSeleccionados.has(p.id_paciente));
    
    this.todosSeleccionados = todosFiltradosSeleccionados;
  }

  getNombreCompleto(paciente: Paciente): string {
    return `${paciente.nombre} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`.trim();
  }

  getIniciales(paciente: Paciente): string {
    const iniciales = `${paciente.nombre.charAt(0)}${paciente.apellido_paterno.charAt(0)}`;
    return iniciales.toUpperCase();
  }

  asignar(): void {
    if (this.asignacionForm.valid && this.pacientesSeleccionados.size > 0) {
      const configuracion = this.asignacionForm.value;
      
      // Formatear la fecha correctamente
      const fecha = new Date(configuracion.fechaLimite);
      configuracion.fechaLimite = fecha.toISOString().split('T')[0];
      
      this.dialogRef.close({
        pacientesSeleccionados: Array.from(this.pacientesSeleccionados),
        configuracion: configuracion
      });
    } else if (this.pacientesSeleccionados.size === 0) {
      this.snackBar.open('Debe seleccionar al menos un paciente', 'Cerrar', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
    } else {
      this.mostrarErroresFormulario();
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private mostrarErroresFormulario(): void {
    let mensaje = 'Por favor, corrija los siguientes errores:\n';
    
    Object.keys(this.asignacionForm.controls).forEach(key => {
      const control = this.asignacionForm.get(key);
      if (control && control.errors) {
        if (control.errors['required']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} es requerido\n`;
        }
        if (control.errors['maxlength']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} no debe exceder ${control.errors['maxlength'].requiredLength} caracteres\n`;
        }
      }
    });

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private obtenerNombreCampo(key: string): string {
    const nombres: { [key: string]: string } = {
      fechaLimite: 'Fecha límite',
      instrucciones: 'Instrucciones',
      prioridad: 'Prioridad'
    };
    return nombres[key] || key;
  }

  getMinDate(): Date {
    return new Date();
  }
}