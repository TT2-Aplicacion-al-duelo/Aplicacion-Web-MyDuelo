import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PacienteAdmin } from '../../interfaces/pacientesAdmin';
import { PsicologoAdmin } from '../../interfaces/psicologoAdmin';

@Component({
  selector: 'app-pacientes-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './pacientes-admin.component.html',
  styleUrl: './pacientes-admin.component.css'
})
export class PacientesAdminComponent implements OnInit {
  pacientes: PacienteAdmin[] = [];
  pacientesFiltrados: PacienteAdmin[] = [];
  pacienteSeleccionado: PacienteAdmin | null = null;
  
  // Lista de psicólogos para reasignación
  psicologos: PsicologoAdmin[] = [];
  
  // Filtros
  filtroTexto: string = '';
  filtroPsicologo: string = 'todos';
  
  // Estados de carga
  cargando: boolean = false;
  cargandoPsicologos: boolean = false;
  
  // Modal
  mostrarModal: boolean = false;
  mostrarModalReasignar: boolean = false;
  
  // Reasignación
  nuevoPsicologoId: number | null = null;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarPacientes();
    this.cargarPsicologos();
  }

  cargarPacientes() {
    this.cargando = true;
    this.adminService.getAllPacientesAdmin().subscribe({
      next: (pacientes) => {
        this.pacientes = pacientes;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.toastr.error('Error al cargar la lista de pacientes');
        this.cargando = false;
      }
    });
  }

  cargarPsicologos() {
    this.cargandoPsicologos = true;
    this.adminService.getAllPsicologos().subscribe({
      next: (psicologos) => {
        // Solo psicólogos activos y con cédula validada
        this.psicologos = psicologos.filter((p: PsicologoAdmin) => 
          p.status === 'activo' && p.cedula_validada
        );
        this.cargandoPsicologos = false;
      },
      error: (error) => {
        console.error('Error al cargar psicólogos:', error);
        this.cargandoPsicologos = false;
      }
    });
  }

  aplicarFiltros() {
    this.pacientesFiltrados = this.pacientes.filter(paciente => {
      const textoMatch = 
        paciente.nombre.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_paterno.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_materno?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.email.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.id_paciente.toString().includes(this.filtroTexto);
      
      const psicologoMatch = 
        this.filtroPsicologo === 'todos' ||
        (this.filtroPsicologo === 'sin_asignar' && !paciente.id_psicologo) ||
        (this.filtroPsicologo === 'asignados' && paciente.id_psicologo) ||
        paciente.id_psicologo?.toString() === this.filtroPsicologo;
      
      return textoMatch && psicologoMatch;
    });
  }

  seleccionarPaciente(paciente: PacienteAdmin) {
    this.pacienteSeleccionado = paciente;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.pacienteSeleccionado = null;
  }

  abrirModalReasignar(paciente: PacienteAdmin) {
    this.pacienteSeleccionado = paciente;
    this.nuevoPsicologoId = paciente.id_psicologo;
    this.mostrarModalReasignar = true;
  }

  cerrarModalReasignar() {
    this.mostrarModalReasignar = false;
    this.pacienteSeleccionado = null;
    this.nuevoPsicologoId = null;
  }

  reasignarPsicologo() {
    if (!this.pacienteSeleccionado || this.nuevoPsicologoId === null) {
      this.toastr.warning('Seleccione un psicólogo');
      return;
    }

    if (this.nuevoPsicologoId === this.pacienteSeleccionado.id_psicologo) {
      this.toastr.info('El paciente ya está asignado a este psicólogo');
      return;
    }

    const psicologoNuevo = this.psicologos.find(p => p.id_psicologo === this.nuevoPsicologoId);
    const nombrePsicologo = psicologoNuevo ? 
      `${psicologoNuevo.nombre} ${psicologoNuevo.apellidoPaterno}` : 
      'el nuevo psicólogo';

    if (confirm(`¿Confirmar reasignación de ${this.pacienteSeleccionado.nombre} ${this.pacienteSeleccionado.apellido_paterno} a ${nombrePsicologo}?`)) {
      this.adminService.reasignarPaciente(this.pacienteSeleccionado.id_paciente, this.nuevoPsicologoId).subscribe({
        next: (response) => {
          this.toastr.success('Paciente reasignado correctamente');
          this.cargarPacientes();
          this.cerrarModalReasignar();
          this.cerrarModal();
        },
        error: (error) => {
          console.error('Error al reasignar paciente:', error);
          this.toastr.error('Error al reasignar el paciente');
        }
      });
    }
  }

  deshabilitarCuenta(paciente: PacienteAdmin) {
    const accion = paciente.status === 'activo' ? 'deshabilitar' : 'habilitar';
    const nuevoEstado = paciente.status === 'activo' ? 'inactivo' : 'activo';
    
    if (confirm(`¿Está seguro de ${accion} la cuenta de ${paciente.nombre} ${paciente.apellido_paterno}?`)) {
      this.adminService.cambiarEstadoPaciente(paciente.id_paciente, nuevoEstado).subscribe({
        next: () => {
          this.toastr.success(`Cuenta ${accion}da correctamente`);
          paciente.status = nuevoEstado;
          this.cargarPacientes();
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.toastr.error(`Error al ${accion} la cuenta`);
        }
      });
    }
  }

  getNombrePsicologo(paciente: PacienteAdmin): string {
    if (!paciente.psicologo) return 'Sin asignar';
    return `${paciente.psicologo.nombre} ${paciente.psicologo.apellidoPaterno}`;
  }

  getClaseFilaPaciente(paciente: PacienteAdmin): string {
    if (!paciente.id_psicologo) {
      return 'table-warning'; // Amarillo para sin psicólogo
    }
    if (paciente.status === 'inactivo') {
      return 'table-danger'; // Rojo para inactivos
    }
    return 'table-success'; // Verde para activos con psicólogo
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}