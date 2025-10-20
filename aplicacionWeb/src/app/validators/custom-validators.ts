// aplicacionWeb/src/app/validators/custom-validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  // Validar edad entre 18 y 90 años
  static edadValida(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const fechaNacimiento = new Date(control.value);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();

      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }

      if (edad < 18) {
        return { edadMinima: { requiredAge: 18, actualAge: edad } };
      }

      if (edad > 90) {
        return { edadMaxima: { requiredAge: 90, actualAge: edad } };
      }

      return null;
    };
  }

  // Validar cédula profesional (7-10 dígitos)
  static cedulaValida(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const cedula = control.value.toString();
      const regex = /^\d{7,10}$/;

      if (!regex.test(cedula)) {
        return { cedulaInvalida: true };
      }

      return null;
    };
  }

  // Validar teléfono (10 dígitos)
  static telefonoValido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const telefono = control.value.toString();
      const regex = /^\d{10}$/;

      if (!regex.test(telefono)) {
        return { telefonoInvalido: true };
      }

      return null;
    };
  }

  // Validar contraseña segura
  static contrasenaSegura(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.value;
      const errors: any = {};

      if (password.length < 8) {
        errors.longitudMinima = true;
      }

      if (!/[A-Z]/.test(password)) {
        errors.requiereMayuscula = true;
      }

      if (!/[a-z]/.test(password)) {
        errors.requiereMinuscula = true;
      }

      if (!/[0-9]/.test(password)) {
        errors.requiereNumero = true;
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.requiereEspecial = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  // Validar que las contraseñas coincidan
  static contrasenasCoinciden(controlName: string, matchingControlName: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);

      if (!control || !matchingControl) {
        return null;
      }

      if (matchingControl.errors && !matchingControl.errors['contrasenasNoCoinciden']) {
        return null;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ contrasenasNoCoinciden: true });
        return { contrasenasNoCoinciden: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }

  // Generar contraseña segura
  static generarContrasenaSegura(): string {
    const mayusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const minusculas = 'abcdefghijklmnopqrstuvwxyz';
    const numeros = '0123456789';
    const especiales = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Asegurar al menos un carácter de cada tipo
    password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
    password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
    password += numeros.charAt(Math.floor(Math.random() * numeros.length));
    password += especiales.charAt(Math.floor(Math.random() * especiales.length));
    
    // Completar hasta 12 caracteres con caracteres aleatorios
    const todosCaracteres = mayusculas + minusculas + numeros + especiales;
    for (let i = password.length; i < 12; i++) {
      password += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length));
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}