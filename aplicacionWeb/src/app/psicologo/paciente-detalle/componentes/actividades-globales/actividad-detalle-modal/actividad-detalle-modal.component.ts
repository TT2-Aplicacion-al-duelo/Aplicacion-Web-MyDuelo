import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ActividadDialogData {
  actividad: any;
  modoEdicion: boolean;
  esNueva?: boolean;
}

@Component({
  selector: 'app-actividad-detalle-modal',
  templateUrl: './actividad-detalle-modal.component.html',
  styleUrls: ['./actividad-detalle-modal.component.scss']
})
export class ActividadDetalleModalComponent implements OnInit {
  
  actividadForm: FormGroup;
  modoEdicion: boolean;
  esNueva: boolean;
  tiposActividad = [
    'Meditación',
    'Ejercicio físico',
    'Lectura',
    'Escritura terapéutica',
    'Actividad social',
    'Relajación',
    'Mindfulness',
    'Arte terapia',
    'Música terapia',
    'Otro'
  ];

  constructor(
    public dialogRef: MatDialogRef<ActividadDetalleModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActividadDialogData,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.modoEdicion = data.modoEdicion || false;
    this.esNueva = data.esNueva || false;
  }

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    const actividad = this.data.actividad;
    
    this.actividadForm = this.fb.group({
      titulo: [
        { value: actividad.titulo || '', disabled: !this.modoEdicion },
        [Validators.required, Validators.minLength(3), Validators.maxLength(255)]
      ],
      descripcion: [
        { value: actividad.descripcion || '', disabled: !this.modoEdicion },
        [Validators.maxLength(1000)]
      ],
      tipo: [
        { value: actividad.tipo || '', disabled: !this.modoEdicion },
        [Validators.required]
      ],
      obligatoria: [
        { value: actividad.obligatoria || false, disabled: !this.modoEdicion }
      ],
      repetitiva: [
        { value: actividad.repetitiva || false, disabled: !this.modoEdicion }
      ],
      periodo: [
        { value: actividad.periodo || null, disabled: !this.modoEdicion || !actividad.repetitiva },
        [Validators.min(1), Validators.max(365)]
      ],
      archivo_url: [
        { value: actividad.archivo_url || '', disabled: !this.modoEdicion },
        [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]
      ],
      origen: [
        { value: actividad.origen || 'personalizada', disabled: !this.modoEdicion }
      ]
    });

    // Listener para habilitar/deshabilitar el campo periodo según repetitiva
    this.actividadForm.get('repetitiva')?.valueChanges.subscribe(isRepetitiva => {
      const periodoControl = this.actividadForm.get('periodo');
      if (isRepetitiva) {
        periodoControl?.enable();
        periodoControl?.setValidators([Validators.required, Validators.min(1), Validators.max(365)]);
      } else {
        periodoControl?.disable();
        periodoControl?.clearValidators();
        periodoControl?.setValue(null);
      }
      periodoControl?.updateValueAndValidity();
    });
  }

  activarEdicion(): void {
    this.modoEdicion = true;
    this.actividadForm.enable();
    
    // Mantener el campo periodo deshabilitado si no es repetitiva
    if (!this.actividadForm.get('repetitiva')?.value) {
      this.actividadForm.get('periodo')?.disable();
    }
  }

  cancelarEdicion(): void {
    if (this.esNueva) {
      this.dialogRef.close();
    } else {
      this.modoEdicion = false;
      this.inicializarFormulario();
    }
  }

  guardarCambios(): void {
    if (this.actividadForm.valid) {
      const actividadActualizada = {
        ...this.data.actividad,
        ...this.actividadForm.getRawValue()
      };

      // Si no es repetitiva, asegurarse de que periodo sea null
      if (!actividadActualizada.repetitiva) {
        actividadActualizada.periodo = null;
      }

      this.dialogRef.close({
        guardado: true,
        actividad: actividadActualizada
      });
    } else {
      this.mostrarErroresFormulario();
    }
  }

  asignarActividad(): void {
    this.dialogRef.close({
      accion: 'asignar',
      actividad: this.data.actividad
    });
  }

  editarActividad(): void {
    this.dialogRef.close({
      accion: 'editar',
      actividad: this.data.actividad
    });
  }

  eliminarActividad(): void {
    this.dialogRef.close({
      accion: 'eliminar',
      actividad: this.data.actividad
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  private mostrarErroresFormulario(): void {
    let mensaje = 'Por favor, corrija los siguientes errores:\n';
    
    Object.keys(this.actividadForm.controls).forEach(key => {
      const control = this.actividadForm.get(key);
      if (control && control.errors) {
        if (control.errors['required']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} es requerido\n`;
        }
        if (control.errors['minlength']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres\n`;
        }
        if (control.errors['maxlength']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} no debe exceder ${control.errors['maxlength'].requiredLength} caracteres\n`;
        }
        if (control.errors['pattern']) {
          mensaje += `- ${this.obtenerNombreCampo(key)} tiene un formato inválido\n`;
        }
      }
    });

    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      verticalPosition: 'top',
      horizontalPosition: 'end',
      panelClass: ['error-snackbar']
    });
  }

  private obtenerNombreCampo(key: string): string {
    const nombres: { [key: string]: string } = {
      titulo: 'Título',
      descripcion: 'Descripción',
      tipo: 'Tipo',
      periodo: 'Periodo',
      archivo_url: 'URL del archivo'
    };
    return nombres[key] || key;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.actividadForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.obtenerNombreCampo(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `El valor mínimo es ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `El valor máximo es ${control.errors?.['max'].max}`;
    }
    if (control?.hasError('pattern')) {
      return 'Formato de URL inválido';
    }
    
    return '';
  }
}