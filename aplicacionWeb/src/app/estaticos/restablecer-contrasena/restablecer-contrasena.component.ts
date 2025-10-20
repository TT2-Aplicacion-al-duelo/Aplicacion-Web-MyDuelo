// aplicacionWeb/src/app/estaticos/restablecer-contrasena/restablecer-contrasena.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PsicologoService } from '../../services/psicologo.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { CustomValidators } from '../../validators/custom-validators';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-restablecer-contrasena',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './restablecer-contrasena.component.html',
  styleUrls: ['./restablecer-contrasena.component.css']
})
export class RestablecerContrasenaComponent implements OnInit {
  restablecerForm!: FormGroup;
  token: string = '';
  loading: boolean = true;
  tokenValido: boolean = false;
  mostrarContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;
  procesando: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private psicologoService: PsicologoService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.loading = false;
      this.tokenValido = false;
      return;
    }

    this.inicializarFormulario();
    this.verificarToken();
  }

  inicializarFormulario(): void {
    this.restablecerForm = this.fb.group({
      nuevaContrasena: ['', [Validators.required, CustomValidators.contrasenaSegura()]],
      confirmarContrasena: ['', [Validators.required]]
    }, {
      validators: CustomValidators.contrasenasCoinciden('nuevaContrasena', 'confirmarContrasena')
    });
  }

  verificarToken(): void {
    this.psicologoService.verificarTokenRecuperacion(this.token).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.tokenValido = response.valido;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.tokenValido = false;
        this.toastr.error('El enlace de recuperación no es válido o ha expirado', 'Error');
      }
    });
  }

  get nuevaContrasena() { return this.restablecerForm.get('nuevaContrasena'); }
  get confirmarContrasena() { return this.restablecerForm.get('confirmarContrasena'); }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleMostrarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  generarContrasenaSegura(): void {
    const contrasenaGenerada = CustomValidators.generarContrasenaSegura();
    this.restablecerForm.patchValue({
      nuevaContrasena: contrasenaGenerada,
      confirmarContrasena: contrasenaGenerada
    });
    this.toastr.success('Contraseña segura generada', 'Éxito');
  }

  obtenerMensajeErrorContrasena(): string {
    const errors = this.nuevaContrasena?.errors;
    if (!errors) return '';

    const mensajes: string[] = [];
    if (errors['longitudMinima']) mensajes.push('Al menos 8 caracteres');
    if (errors['requiereMayuscula']) mensajes.push('Una letra mayúscula');
    if (errors['requiereMinuscula']) mensajes.push('Una letra minúscula');
    if (errors['requiereNumero']) mensajes.push('Un número');
    if (errors['requiereEspecial']) mensajes.push('Un carácter especial');

    return mensajes.length > 0 ? 'La contraseña debe contener: ' + mensajes.join(', ') : '';
  }

  restablecerContrasena(): void {
    if (this.restablecerForm.invalid) {
      this.restablecerForm.markAllAsTouched();
      this.toastr.error('Por favor completa todos los campos correctamente', 'Error');
      return;
    }

    this.procesando = true;

    this.psicologoService.restablecerContrasena(
      this.token, 
      this.restablecerForm.value.nuevaContrasena
    ).subscribe({
      next: (response) => {
        this.procesando = false;
        this.toastr.success(
          'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.',
          'Éxito',
          { timeOut: 8000 }
        );
        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.procesando = false;
        this.toastr.error(
          error.error?.msg || 'Error al restablecer la contraseña',
          'Error'
        );
      }
    });
  }
}