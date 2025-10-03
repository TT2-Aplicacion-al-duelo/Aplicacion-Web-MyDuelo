// aplicacionWeb/src/app/admin/psicologos-admin/psicologos-admin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastrService } from 'ngx-toastr';
import { PsicologoAdmin } from '../../interfaces/psicologoAdmin';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-psicologos-admin',
  imports: [CommonModule, FormsModule],
  templateUrl: './psicologos-admin.component.html',
  styleUrl: './psicologos-admin.component.css'
})
export class PsicologosAdminComponent implements OnInit {
  psicologos: PsicologoAdmin[] = [];
  psicologosFiltrados: PsicologoAdmin[] = [];
  psicologoSeleccionado: PsicologoAdmin | null = null;

  private apiUrl: string = environment.apiUrl;
  
  // Filtros
  filtroNombre: string = '';
  filtroEstado: string = 'todos';
  filtroCedula: string = 'todos';
  
  // Estados de carga
  cargando: boolean = false;
  validandoCedula: boolean = false;
  
  // Modal
  mostrarModal: boolean = false;

  constructor(
    private adminService: AdminService,
    private toastr: ToastrService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarPsicologos();
  }

  cargarPsicologos() {
    this.cargando = true;
    this.adminService.getAllPsicologos().subscribe({
      next: (psicologos) => {
        this.psicologos = psicologos;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar psicólogos:', error);
        this.toastr.error('Error al cargar la lista de psicólogos');
        this.cargando = false;
      }
    });
  }

  aplicarFiltros() {
    this.psicologosFiltrados = this.psicologos.filter(psicologo => {
      const nombreMatch = psicologo.nombre.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
                         psicologo.apellidoPaterno.toLowerCase().includes(this.filtroNombre.toLowerCase()) ||
                         psicologo.apellidoMaterno?.toLowerCase().includes(this.filtroNombre.toLowerCase());
      
      const estadoMatch = this.filtroEstado === 'todos' || psicologo.status === this.filtroEstado;
      
      const cedulaMatch = this.filtroCedula === 'todos' || 
                         (this.filtroCedula === 'verificada' && psicologo.cedula_validada) ||
                         (this.filtroCedula === 'no_verificada' && !psicologo.cedula_validada);
      
      return nombreMatch && estadoMatch && cedulaMatch;
    });
  }

  seleccionarPsicologo(psicologo: PsicologoAdmin) {
    this.psicologoSeleccionado = psicologo;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.psicologoSeleccionado = null;
  }

  async validarCedula(psicologo: PsicologoAdmin) {
    if (confirm(`¿Desea validar la cédula profesional ${psicologo.cedula} de ${psicologo.nombre} ${psicologo.apellidoPaterno}?`)) {
      this.validandoCedula = true;
      
      this.adminService.validarCedulaProfesional(psicologo.id_psicologo, psicologo.cedula).subscribe({
        next: (resultado) => {
          if (resultado.valida) {
            this.toastr.success('Cédula validada correctamente');
            psicologo.cedula_validada = true;
          } else {
            this.toastr.warning('La cédula no pudo ser validada: ' + resultado.mensaje);
          }
          this.validandoCedula = false;
        },
        error: (error) => {
          console.error('Error al validar cédula:', error);
          this.toastr.error('Error al validar la cédula profesional');
          this.validandoCedula = false;
        }
      });
    }
  }

  ///----------------------
  // Método para validar cédula con API
// validarCedulaConAPI(psicologo: any) {
//   const url = `${this.apiUrl}/api/admin/psicologos/${psicologo.id_psicologo}/validar-cedula-api`;
  
//   this.http.post(url, {}).subscribe({
//     next: (response: any) => {
//       if (response.validacion.valida) {
//         alert(`✅ Cédula validada: ${response.msg}`);
//         this.cargarPsicologos(); // Recargar lista
//       } else {
//         const confirmar = confirm(
//           `❌ No se pudo validar automáticamente.\n\n` +
//           `¿Desea validar manualmente después de revisar en el sitio oficial?\n\n` +
//           `Se abrirá la página de consulta de la SEP.`
//         );
        
//         if (confirmar) {
//           // Abrir página oficial
//           window.open(response.urlConsultaManual, '_blank');
          
//           // Preguntar si validar manualmente
//           setTimeout(() => {
//             const validarManual = confirm('¿Confirma que la cédula es válida según la consulta oficial?');
//             if (validarManual) {
//               this.validarCedulaManual(psicologo);
//             }
//           }, 2000);
//         }
//       }
//     },
//     error: (error) => {
//       console.error('Error:', error);
//       alert('Error al validar cédula: ' + error.error?.msg);
//     }
//   });
// }

// // Método para validación manual (forzada)
//   validarCedulaManual(psicologo: PsicologoAdmin) {
//       const url = `${this.apiUrl}api/admin/psicologos/${psicologo.id_psicologo}/validar-cedula-api`;
      
//       this.http.post(url, { forzarValidacion: true }).subscribe({
//         next: (response: any) => {
//           this.toastr.success(`✅ ${response.msg}`);
//           this.cargarPsicologos();
//         },
//         error: (error: any) => { // ✅ TIPADO EXPLÍCITO
//           console.error('Error:', error);
//           this.toastr.error('Error: ' + error.error?.msg);
//         }
//       });
//     }

  /**
 * ✅ MÉTODO CORREGIDO: Validar cédula manualmente (solo admin)
 */


  // Método para abrir consulta oficial
  abrirConsultaOficial() {
    const url = 'https://www.cedulaprofesional.sep.gob.mx/cedula/presidencia/indexAvanzada.action';
    window.open(url, '_blank');
  }



  //------------------------------------------------------

  cambiarEstadoCuenta(psicologo: PsicologoAdmin, nuevoEstado: 'activo' | 'inactivo') {
    const accion = nuevoEstado === 'activo' ? 'habilitar' : 'inhabilitar';
    
    if (confirm(`¿Está seguro de ${accion} la cuenta de ${psicologo.nombre} ${psicologo.apellidoPaterno}?`)) {
      this.adminService.cambiarEstadoPsicologo(psicologo.id_psicologo, nuevoEstado).subscribe({
        next: () => {
          this.toastr.success(`Cuenta ${accion}da correctamente`);
          psicologo.status = nuevoEstado;
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.toastr.error(`Error al ${accion} la cuenta`);
        }
      });
    }
  }

  eliminarCuenta(psicologo: PsicologoAdmin) {
    if (confirm(`¿ADVERTENCIA: Está a punto de eliminar permanentemente la cuenta de ${psicologo.nombre} ${psicologo.apellidoPaterno}. Esta acción NO se puede deshacer. ¿Continuar?`)) {
      if (confirm('Escriba "ELIMINAR" para confirmar que desea borrar esta cuenta:') && 
          prompt('Escriba "ELIMINAR":') === 'ELIMINAR') {
        
        this.adminService.eliminarPsicologo(psicologo.id_psicologo).subscribe({
          next: () => {
            this.toastr.success('Cuenta eliminada correctamente');
            this.cargarPsicologos(); // Recargar lista
            this.cerrarModal();
          },
          error: (error) => {
            console.error('Error al eliminar cuenta:', error);
            this.toastr.error('Error al eliminar la cuenta');
          }
        });
      }
    }
  }

  /**
   * Validar cédula manualmente (sin API, solo confirmación del admin)
   */
  validarCedulaManualmente(psicologo: PsicologoAdmin) {
    // Primera confirmación
    const confirmar = confirm(
      `⚠️ VALIDACIÓN MANUAL DE CÉDULA\n\n` +
      `¿Ha verificado manualmente la cédula profesional ${psicologo.cedula} de:\n` +
      `${psicologo.nombre} ${psicologo.apellidoPaterno} ${psicologo.apellidoMaterno}?\n\n` +
      `Esta acción marcará la cédula como validada en el sistema.\n\n` +
      `¿Confirmar validación manual?`
    );

    if (!confirmar) {
      return;
    }

    // Segunda confirmación para evitar errores
    const confirmarFinal = confirm(
      `Última confirmación:\n\n` +
      `¿Está completamente seguro de que la cédula ${psicologo.cedula} es válida?\n\n` +
      `Presione OK para confirmar la validación.`
    );

    if (!confirmarFinal) {
      return;
    }

    // Proceder con la validación
    this.adminService.validarCedulaManual(psicologo.id_psicologo).subscribe({
      next: (response) => {
        this.toastr.success(`✅ ${response.msg}`);
        psicologo.cedula_validada = true;
        this.cargarPsicologos(); // Recargar lista
      },
      error: (error) => {
        console.error('Error al validar cédula:', error);
        this.toastr.error('Error al validar la cédula: ' + (error.error?.msg || 'Error desconocido'));
      }
    });
  }

  getEstadoCedulaTexto(validada: boolean): string {
    return validada ? 'Verificada' : 'No Verificada';
  }

  getClaseFilaPsicologo(psicologo: PsicologoAdmin): string {
    if (!psicologo.cedula_validada) {
      return 'table-warning'; // Amarillo para cédulas no verificadas
    }
    if (psicologo.status === 'inactivo') {
      return 'table-danger'; // Rojo para cuentas inactivas
    }
    return 'table-success'; // Verde para cuentas activas y verificadas
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}