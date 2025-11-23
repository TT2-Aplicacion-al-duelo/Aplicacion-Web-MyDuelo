import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PacienteAdmin } from '../../interfaces/pacientesAdmin';
import { PsicologoAdmin } from '../../interfaces/psicologoAdmin';
import { environment } from '../../../environments/environment';

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
    const accion = paciente.email_verificado ? 'deshabilitar' : 'habilitar';
    const nuevoEstado = !paciente.email_verificado;
    
    if (confirm(`¿Está seguro de ${accion} la cuenta de ${paciente.nombre} ${paciente.apellido_paterno}?`)) {
      this.adminService.cambiarEstadoPaciente(paciente.id_paciente, nuevoEstado).subscribe({
        next: () => {
          this.toastr.success(`Cuenta ${accion}da correctamente`);
          paciente.email_verificado = nuevoEstado;
          this.aplicarFiltros(); // Refrescar la vista
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
    // Prioridad 1: Cuenta no verificada (rojo)
    if (!paciente.email_verificado) {
      return 'table-danger'; // Rojo para cuentas no verificadas
    }
    // Prioridad 2: Sin psicólogo asignado (amarillo)
    if (!paciente.id_psicologo) {
      return 'table-warning'; // Amarillo para sin psicólogo
    }
    // Prioridad 3: Todo bien (verde)
    return 'table-success'; // Verde para verificados con psicólogo
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  }
  /**
   * Eliminar cuenta de paciente PERMANENTEMENTE
   */
  eliminarCuentaPaciente(paciente: PacienteAdmin) {
    // Primera confirmación
    if (!confirm(`ELIMINAR CUENTA DE PACIENTE\n\n` +
      `Esta acción eliminará PERMANENTEMENTE:\n` +
      `• Paciente: ${paciente.nombre} ${paciente.apellido_paterno}\n` +
      `• Todos sus chats y mensajes\n` +
      `• Todas sus notas y actividades\n` +
      `• Todas sus citas y tests\n` +
      `• Todas sus evidencias\n` +
      `• Toda su participación en foros\n\n` +
      `Esta acción NO se puede deshacer.\n\n` +
      `¿Está seguro de que desea continuar?`)) {
      return;
    }

    // Segunda confirmación con input de texto
    const confirmacion = prompt(
      `⚠️ CONFIRMACIÓN FINAL\n\n` +
      `Para confirmar la eliminación permanente de:\n` +
      `${paciente.nombre} ${paciente.apellido_paterno} (ID: ${paciente.id_paciente})\n\n` +
      `Escriba exactamente: ELIMINAR`
    );

    if (confirmacion !== 'ELIMINAR') {
      if (confirmacion !== null) { // null significa que canceló
        this.toastr.warning('Texto de confirmación incorrecto. Operación cancelada.');
      }
      return;
    }

    // Proceder con la eliminación
    this.adminService.eliminarPaciente(paciente.id_paciente).subscribe({
      next: (response) => {
        this.toastr.success(` ${response.msg}`);
        this.cargarPacientes(); // Recargar lista
        this.cerrarModal();
      },
      error: (error) => {
        console.error('Error al eliminar paciente:', error);
        this.toastr.error('Error al eliminar la cuenta del paciente: ' + 
          (error.error?.msg || 'Error desconocido'));
      }
    });
  }
  /**
   * Obtener URL de foto de perfil del paciente
   */
  obtenerFotoUrl(paciente: PacienteAdmin): string {
    const fotoPerfil = paciente.foto_perfil;
    // ✅ DEBUG - Ver qué llega
    console.log('🔍 Paciente ID:', paciente.id_paciente);
    console.log('📸 foto_perfil en BD:', fotoPerfil);
    
    if (!fotoPerfil) {
      return '';
    }
    
    // Si es URL antigua de Azure, ignorarla
    if (fotoPerfil.startsWith('http://192.168') || 
        fotoPerfil.startsWith('http://20.') ||
        fotoPerfil.startsWith('https://192.168') || 
        fotoPerfil.startsWith('https://20.')) {
      return '';
    }
    
    // Si ya es URL completa
    if (fotoPerfil.startsWith('http')) {
      return fotoPerfil;
    }
    
    // Construir URL del servidor
    const baseUrl = environment.apiUrl || 'http://localhost:3017';
    return `${baseUrl}/uploads/${fotoPerfil}`;
  }

  /**
   * Manejar error de imagen
   */
  onImageError(event: Event, paciente: PacienteAdmin): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  /**
   * Obtener iniciales del paciente
   */
  getIniciales(paciente: PacienteAdmin): string {
    const nombre = paciente.nombre?.charAt(0) || '';
    const apellido = paciente.apellido_paterno?.charAt(0) || '';
    return (nombre + apellido).toUpperCase();
  }
}