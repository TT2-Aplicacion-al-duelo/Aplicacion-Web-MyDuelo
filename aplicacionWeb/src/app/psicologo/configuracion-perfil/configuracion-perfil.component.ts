import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PsicologoService } from '../../services/psicologo.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CustomValidators } from '../../validators/custom-validators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-configuracion-perfil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion-perfil.component.html',
  styleUrls: ['./configuracion-perfil.component.css']
})
export class ConfiguracionPerfilComponent implements OnInit {
  perfilForm!: FormGroup;
  contrasenaForm!: FormGroup;
  
  usuarioInfo: any = null;
  loading: boolean = false;
  loadingContrasena: boolean = false;
  
  mostrarContrasenaActual: boolean = false;
  mostrarNuevaContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;

  seccionActiva: 'perfil' | 'contrasena' = 'perfil';

  constructor(
    private fb: FormBuilder,
    private psicologoService: PsicologoService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarInformacionUsuario();
    this.inicializarFormularios();
  }

  cargarInformacionUsuario(): void {
    this.usuarioInfo = this.authService.getUserInfo();
  }

  inicializarFormularios(): void {
    // Formulario de Perfil
    this.perfilForm = this.fb.group({
      telefono: ['', [Validators.required, CustomValidators.telefonoValido()]],
      correo: ['', [Validators.required, Validators.email]],
      direccionConsultorio: ['']
    });

    // Formulario de Contraseña
    this.contrasenaForm = this.fb.group({
      contrasenaActual: ['', [Validators.required]],
      nuevaContrasena: ['', [Validators.required, CustomValidators.contrasenaSegura()]],
      confirmarContrasena: ['', [Validators.required]]
    }, {
      validators: CustomValidators.contrasenasCoinciden('nuevaContrasena', 'confirmarContrasena')
    });
  }

  cambiarSeccion(seccion: 'perfil' | 'contrasena'): void {
    this.seccionActiva = seccion;
  }

  actualizarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      this.toastr.error('Por favor completa todos los campos correctamente', 'Error');
      return;
    }

    this.loading = true;

    this.psicologoService.actualizarPerfil(this.perfilForm.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success('Perfil actualizado exitosamente', 'Éxito');
        
        // Si el correo cambió, actualizar el token
        if (this.perfilForm.value.correo !== this.usuarioInfo?.correo) {
          this.toastr.info('Por favor inicia sesión nuevamente con tu nuevo correo', 'Información');
          setTimeout(() => {
            this.authService.logout();
            window.location.href = '/iniciar-sesion';
          }, 2000);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.toastr.error(
          error.error?.msg || 'Error al actualizar el perfil',
          'Error'
        );
      }
    });
  }

  cambiarContrasena(): void {
    if (this.contrasenaForm.invalid) {
      this.contrasenaForm.markAllAsTouched();
      this.toastr.error('Por favor completa todos los campos correctamente', 'Error');
      return;
    }

    this.loadingContrasena = true;

    this.psicologoService.cambiarContrasena(
      this.contrasenaForm.value.contrasenaActual,
      this.contrasenaForm.value.nuevaContrasena
    ).subscribe({
      next: (response) => {
        this.loadingContrasena = false;
        this.toastr.success('Contraseña actualizada exitosamente', 'Éxito');
        this.contrasenaForm.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.loadingContrasena = false;
        this.toastr.error(
          error.error?.msg || 'Error al cambiar la contraseña',
          'Error'
        );
      }
    });
  }

  generarContrasenaSegura(): void {
    const contrasenaGenerada = CustomValidators.generarContrasenaSegura();
    this.contrasenaForm.patchValue({
      nuevaContrasena: contrasenaGenerada,
      confirmarContrasena: contrasenaGenerada
    });
    this.toastr.success('Contraseña segura generada', 'Éxito');
  }

  obtenerMensajeErrorContrasena(): string {
    const errors = this.contrasenaForm.get('nuevaContrasena')?.errors;
    if (!errors) return '';

    const mensajes: string[] = [];
    if (errors['longitudMinima']) mensajes.push('Al menos 8 caracteres');
    if (errors['requiereMayuscula']) mensajes.push('Una letra mayúscula');
    if (errors['requiereMinuscula']) mensajes.push('Una letra minúscula');
    if (errors['requiereNumero']) mensajes.push('Un número');
    if (errors['requiereEspecial']) mensajes.push('Un carácter especial');

    return mensajes.length > 0 ? 'La contraseña debe contener: ' + mensajes.join(', ') : '';
  }

  // Getters para formulario de perfil
  get telefono() { return this.perfilForm.get('telefono'); }
  get correo() { return this.perfilForm.get('correo'); }
  get direccionConsultorio() { return this.perfilForm.get('direccionConsultorio'); }

  // Getters para formulario de contraseña
  get contrasenaActual() { return this.contrasenaForm.get('contrasenaActual'); }
  get nuevaContrasena() { return this.contrasenaForm.get('nuevaContrasena'); }
  get confirmarContrasena() { return this.contrasenaForm.get('confirmarContrasena'); }

  // Métodos para mostrar/ocultar contraseñas
  toggleMostrarContrasenaActual(): void {
    this.mostrarContrasenaActual = !this.mostrarContrasenaActual;
  }

  toggleMostrarNuevaContrasena(): void {
    this.mostrarNuevaContrasena = !this.mostrarNuevaContrasena;
  }

  toggleMostrarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}