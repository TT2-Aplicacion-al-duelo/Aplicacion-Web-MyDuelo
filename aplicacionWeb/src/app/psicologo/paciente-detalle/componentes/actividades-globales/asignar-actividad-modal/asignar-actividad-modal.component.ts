// asignar-actividad-modal.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PacientesService } from '../../../../../services/pacientes.service';
import { Paciente } from '../../../../../interfaces/paciente';

// export interface Paciente {
//   id_paciente: number;
//   nombre: string;
//   apellido_paterno: string;
//   apellido_materno: string;
//   email: string;
//   telefono?: string;
//   foto_url?: string;
//   seleccionado?: boolean;
// }

@Component({
  selector: 'app-asignar-actividad-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './asignar-actividad-modal.component.html',
  styleUrls: ['./asignar-actividad-modal.component.css']
})
export class AsignarActividadModalComponent implements OnInit {
  @Input() actividad: any = null;
  @Output() cerrar = new EventEmitter<any>();

  asignacionForm!: FormGroup;
  pacientes: Paciente[] = [];
  pacientesFiltrados: Paciente[] = [];
  pacientesSeleccionados: Set<number> = new Set();
  searchTerm = '';
  isLoading = false;
  todosSeleccionados = false;
  
  prioridades = [
    { value: 'baja', label: 'Baja', icon: 'bi-arrow-down', color: 'success' },
    { value: 'media', label: 'Media', icon: 'bi-dash', color: 'warning' },
    { value: 'alta', label: 'Alta', icon: 'bi-arrow-up', color: 'danger' }
  ];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
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
      fechaLimite: [this.formatearFecha(fechaManana), [Validators.required]],
      instrucciones: ['', [Validators.maxLength(500)]],
      prioridad: ['media', [Validators.required]]
    });
  }

  formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cargarPacientes(): void {
    this.isLoading = true;
    this.pacientesService.getPacientesPorPsicologo().subscribe({
      next: (data: Paciente[]) => {
        this.pacientes = data.map(p => ({ ...p, seleccionado: false }));
        this.pacientesFiltrados = [...this.pacientes];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pacientes:', error);
        this.toastr.error('Error al cargar los pacientes');
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
      
      this.cerrar.emit({
        pacientesSeleccionados: Array.from(this.pacientesSeleccionados),
        configuracion: configuracion
      });
    } else if (this.pacientesSeleccionados.size === 0) {
      this.toastr.warning('Debe seleccionar al menos un paciente');
    } else {
      this.mostrarErroresFormulario();
    }
  }

  cancelar(): void {
    this.cerrar.emit(null);
  }

  private mostrarErroresFormulario(): void {
    const errores: string[] = [];
    
    Object.keys(this.asignacionForm.controls).forEach(key => {
      const control = this.asignacionForm.get(key);
      if (control && control.errors) {
        if (control.errors['required']) {
          errores.push(`${this.obtenerNombreCampo(key)} es requerido`);
        }
        if (control.errors['maxlength']) {
          errores.push(`${this.obtenerNombreCampo(key)} no debe exceder ${control.errors['maxlength'].requiredLength} caracteres`);
        }
      }
    });

    errores.forEach(error => {
      this.toastr.error(error);
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

  getMinDate(): string {
    const today = new Date();
    return this.formatearFecha(today);
  }
}
