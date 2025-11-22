import { Component } from '@angular/core';
import { PsicologoService } from '../../services/psicologo.service';
import { ToastrService } from 'ngx-toastr';
import { Router, RouterModule } from '@angular/router';
import { LoadingComponent } from "../../compartidos/loading/loading.component";
import { FormsModule } from "@angular/forms";
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../services/error.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [LoadingComponent, FormsModule, CommonModule,RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  logoPath: string = '/imagenes/branding/logo.png'; 

  correo: string = '';
  contrasena: string = '';
  loading: boolean = false;
  mostrarContrasena: boolean = false;
  
  // Modal de recuperación
  mostrarModalRecuperacion: boolean = false;
  correoOTelefonoRecuperacion: string = '';
  loadingRecuperacion: boolean = false;

  constructor(
    private _psicologoService: PsicologoService,
    private toastr: ToastrService,
    private router: Router,
    private _errorServices: ErrorService,
    private _authService: AuthService
  ) {}

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  iniciarSeccion(): void {
    if (this.correo === '' || this.contrasena === '') {
      this.toastr.error("Todos los campos son obligatorios", "Error");
      return;
    }

    const psicologo = {
      correo: this.correo,
      contrasena: this.contrasena
    };

    this.loading = true;

    this._psicologoService.iniciarSesion(psicologo).subscribe({
      next: (response: any) => {
        // ✅ NUEVO: VERIFICAR SI REQUIERE VALIDACIÓN DE CÉDULA
        if (response.requiere_validacion === true || response.cedula_validada === false) {
          // Guardar datos del usuario temporalmente
          localStorage.setItem('usuario_pendiente', JSON.stringify(response.usuario));
          this.loading = false;
          
          // Mostrar mensaje informativo
          this.toastr.warning(
            'Tus credenciales aún no han sido validadas por el administrador',
            'Acceso Restringido',
            { timeOut: 5000 }
          );
          
          // Redirigir a página de credenciales no validadas
          this.router.navigate(['/credenciales-no-validadas']);
          return;
        }

        // ✅ LOGIN NORMAL (si pasó la validación)
        const token = response.token;
        this._authService.setToken(token);
        
        this.loading = false;

        // Verificar si la cuenta está limitada (lógica original mantenida)
        if (response.cuenta_limitada) {
          this.toastr.warning(
            response.advertencia,
            'Acceso Limitado',
            { timeOut: 10000 }
          );
        } else if (response.diasRestantesValidacion !== null && response.diasRestantesValidacion <= 3) {
          this.toastr.info(
            `Tu cédula aún no ha sido validada. Te quedan ${response.diasRestantesValidacion} días de acceso completo.`,
            'Validación Pendiente',
            { timeOut: 8000 }
          );
        }

        this.toastr.success("", "Bienvenido");
        
        // Redirigir según el rol
        if (response.usuario.rol_admin) {
          this.router.navigate(['/admin/psicologos']);
        } else {
          this.router.navigate(['/agenda']);
        }
      },
      error: (event: HttpErrorResponse) => {
        this.loading = false;

        // ✅ NUEVO: MANEJAR ERROR 403 DE CREDENCIALES NO VALIDADAS
        if (event.status === 403 && event.error?.requiere_validacion) {
          // Guardar datos del usuario temporalmente
          localStorage.setItem('usuario_pendiente', JSON.stringify(event.error.usuario));
          
          this.toastr.warning(
            'Tus credenciales profesionales aún no han sido validadas por el administrador. Recibirás un correo cuando sean aprobadas.',
            'Acceso Restringido',
            { 
              timeOut: 8000,
              closeButton: true
            }
          );
          
          // Redirigir a página de credenciales no validadas
          this.router.navigate(['/credenciales-no-validadas']);
          return;
        }

        // Manejar error de cuenta no activada (lógica original mantenida)
        if (event.error?.requiereActivacion) {
          this.toastr.error(
            event.error.msg,
            'Cuenta No Activada',
            { 
              timeOut: 10000,
              closeButton: true
            }
          );
          
          // Mostrar botón para reenviar activación
          setTimeout(() => {
            if (confirm('¿Deseas que reenviemos el correo de activación?')) {
              this.reenviarActivacion();
            }
          }, 2000);
        } else {
          this._errorServices.mensajeError(event);
        }
      }
    });
  }

  reenviarActivacion(): void {
    if (!this.correo) {
      this.toastr.error('Por favor ingresa tu correo electrónico', 'Error');
      return;
    }

    this._psicologoService.reenviarActivacion(this.correo).subscribe({
      next: (response) => {
        this.toastr.success(
          'Se ha enviado un nuevo correo de activación. Revisa tu bandeja de entrada.',
          'Correo Enviado',
          { timeOut: 8000 }
        );
      },
      error: (event: HttpErrorResponse) => {
        this._errorServices.mensajeError(event);
      }
    });
  }

  abrirModalRecuperacion(): void {
    this.mostrarModalRecuperacion = true;
    this.correoOTelefonoRecuperacion = '';
  }

  cerrarModalRecuperacion(): void {
    this.mostrarModalRecuperacion = false;
    this.correoOTelefonoRecuperacion = '';
  }

  solicitarRecuperacion(): void {
    if (!this.correoOTelefonoRecuperacion) {
      this.toastr.error('Por favor ingresa tu correo electrónico o teléfono', 'Error');
      return;
    }

    this.loadingRecuperacion = true;

    this._psicologoService.solicitarRecuperacion(this.correoOTelefonoRecuperacion).subscribe({
      next: (response: any) => {
        this.loadingRecuperacion = false;
        this.cerrarModalRecuperacion();

        if (response.esTelefono) {
          this.toastr.success(
            'Se ha enviado un correo de recuperación al email registrado con ese número telefónico.',
            'Correo Enviado',
            { timeOut: 8000 }
          );
        } else {
          this.toastr.success(
            'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar tu contraseña.',
            'Correo Enviado',
            { timeOut: 8000 }
          );
        }
      },
      error: (event: HttpErrorResponse) => {
        this.loadingRecuperacion = false;
        this._errorServices.mensajeError(event);
      }
    });
  }
}