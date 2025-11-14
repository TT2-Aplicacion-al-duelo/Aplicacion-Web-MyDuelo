// aplicacionWeb/src/app/estaticos/registro/registro.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PsicologoService } from '../../services/psicologo.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../services/error.service';
import { CustomValidators } from '../../validators/custom-validators';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, CommonModule, FormsModule, RouterModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent implements OnInit {
  registroForm!: FormGroup;
  mostrarContrasena: boolean = false;
  mostrarConfirmarContrasena: boolean = false;
  loading: boolean = false;

   especialidades: string[] = [
    'Psicología Clínica',
    'Tanatología',
    'Psicoterapia',
    'Psiquiatría',
    'Trabajo Social',
    'Consejería/Counseling',
    'Terapia Familiar y de Pareja',
    'Psicología de la Salud',
    'Psicología del Duelo y Pérdida',
    'Neuropsicología',
    'Psicooncología',
    'Terapia Cognitivo-Conductual',
    'Terapia Humanista',
    'Enfermería en Salud Mental',
    'Otra especialidad relacionada'
  ];

  constructor(
    private fb: FormBuilder,
    private userService: PsicologoService,
    private router: Router,
    private toastr: ToastrService,
    private _errorServices: ErrorService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.registroForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.minLength(2)]],
      fecha_nacimiento: ['', [Validators.required, CustomValidators.edadValida()]],
      especialidad: ['', [Validators.required, Validators.minLength(3)]],
      cedulaProfesional: ['', [Validators.required, CustomValidators.cedulaValida()]],
      numTelefonico: ['', [Validators.required, CustomValidators.telefonoValido()]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, CustomValidators.contrasenaSegura()]],
      confirmarContrasena: ['', [Validators.required]],
      aceptaTerminos: [false, [Validators.requiredTrue]]
    }, {
      validators: CustomValidators.contrasenasCoinciden('contrasena', 'confirmarContrasena')
    });
  }

  // Getters para acceso fácil a los campos del formulario
  get nombre() { return this.registroForm.get('nombre'); }
  get apellidoPaterno() { return this.registroForm.get('apellidoPaterno'); }
  get apellidoMaterno() { return this.registroForm.get('apellidoMaterno'); }
  get fecha_nacimiento() { return this.registroForm.get('fecha_nacimiento'); }
  get especialidad() { return this.registroForm.get('especialidad'); }
  get cedulaProfesional() { return this.registroForm.get('cedulaProfesional'); }
  get numTelefonico() { return this.registroForm.get('numTelefonico'); }
  get correo() { return this.registroForm.get('correo'); }
  get contrasena() { return this.registroForm.get('contrasena'); }
  get confirmarContrasena() { return this.registroForm.get('confirmarContrasena'); }
  get aceptaTerminos() { return this.registroForm.get('aceptaTerminos'); }

  toggleMostrarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  toggleMostrarConfirmarContrasena(): void {
    this.mostrarConfirmarContrasena = !this.mostrarConfirmarContrasena;
  }

  generarContrasenaSegura(): void {
    const contrasenaGenerada = CustomValidators.generarContrasenaSegura();
    this.registroForm.patchValue({
      contrasena: contrasenaGenerada,
      confirmarContrasena: contrasenaGenerada
    });
    this.toastr.success('Contraseña segura generada', 'Éxito');
  }

  obtenerMensajeErrorContrasena(): string {
    const errors = this.contrasena?.errors;
    if (!errors) return '';

    const mensajes: string[] = [];
    if (errors['longitudMinima']) mensajes.push('Al menos 8 caracteres');
    if (errors['requiereMayuscula']) mensajes.push('Una letra mayúscula');
    if (errors['requiereMinuscula']) mensajes.push('Una letra minúscula');
    if (errors['requiereNumero']) mensajes.push('Un número');
    if (errors['requiereEspecial']) mensajes.push('Un carácter especial (!@#$%^&*...)');

    return mensajes.length > 0 ? 'La contraseña debe contener: ' + mensajes.join(', ') : '';
  }

  obtenerMensajeErrorEdad(): string {
    const errors = this.fecha_nacimiento?.errors;
    if (!errors) return '';

    if (errors['edadMinima']) {
      return `Debes tener al menos 18 años (tienes ${errors['edadMinima'].actualAge} años)`;
    }
    if (errors['edadMaxima']) {
      return `La edad máxima permitida es 90 años (tienes ${errors['edadMaxima'].actualAge} años)`;
    }
    return '';
  }

  registrarPsicologo(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.toastr.error('Por favor completa todos los campos correctamente', 'Error');
      return;
    }

    this.loading = true;

    const psicologo = {
      nombre: this.registroForm.value.nombre,
      apellidoPaterno: this.registroForm.value.apellidoPaterno,
      apellidoMaterno: this.registroForm.value.apellidoMaterno,
      fecha_nacimiento: this.registroForm.value.fecha_nacimiento,
      especialidad: this.registroForm.value.especialidad,
      cedula: this.registroForm.value.cedulaProfesional,
      telefono: this.registroForm.value.numTelefonico,
      correo: this.registroForm.value.correo,
      contrasena: this.registroForm.value.contrasena,
      aceptaTerminos: this.registroForm.value.aceptaTerminos
    };

    this.userService.registrarUsuario(psicologo).subscribe({
      next: (response) => {
        this.loading = false;
        this.toastr.success(
          'Por favor revisa tu correo electrónico para activar tu cuenta. El enlace expira en 48 horas.',
          'Registro exitoso',
          { timeOut: 10000 }
        );
        this.router.navigate(['/iniciar-sesion']);
      },
      error: (event: HttpErrorResponse) => {
        this.loading = false;
        this._errorServices.mensajeError(event);
      }
    });
  }

  // Solo permitir números en campos numéricos
  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
}