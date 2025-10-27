import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-actividad-detalle-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './actividad-detalle-modal.component.html',
  styleUrls: ['./actividad-detalle-modal.component.css']
})
export class ActividadDetalleModalComponent implements OnInit, OnChanges {
  @Input() actividad: any = null;
  @Input() modoEdicion: boolean = false;
  @Input() esNueva: boolean = false;
  @Output() cerrar = new EventEmitter<any>();

  actividadForm!: FormGroup;
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
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Detectar cambios en modoEdicion para reinicializar el formulario
    if (changes['modoEdicion'] && !changes['modoEdicion'].firstChange) {
      this.inicializarFormulario();
    }
  }

  inicializarFormulario(): void {
    this.actividadForm = this.fb.group({
      titulo: [
        { value: this.actividad?.titulo || '', disabled: !this.modoEdicion },
        [Validators.required, Validators.minLength(3), Validators.maxLength(255)]
      ],
      descripcion: [
        { value: this.actividad?.descripcion || '', disabled: !this.modoEdicion },
        [Validators.maxLength(1000)]
      ],
      tipo: [
        { value: this.actividad?.tipo || '', disabled: !this.modoEdicion },
        [Validators.required]
      ],
      obligatoria: [
        { value: this.actividad?.obligatoria || false, disabled: !this.modoEdicion }
      ],
      repetitiva: [
        { value: this.actividad?.repetitiva || false, disabled: !this.modoEdicion }
      ],
      periodo: [
        { 
          value: this.actividad?.periodo || null, 
          disabled: !this.modoEdicion || !this.actividad?.repetitiva 
        },
        [Validators.min(1), Validators.max(365)]
      ],
      archivo_url: [
        { value: this.actividad?.archivo_url || '', disabled: !this.modoEdicion },
        [Validators.pattern(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/)]
      ],
      origen: [
        { value: this.actividad?.origen || 'personalizada', disabled: !this.modoEdicion }
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

  /**
   * CORRECCIÓN: Este método debe activar la edición localmente sin cerrar el modal
   */
  editarActividad(): void {
    // Activar modo edición localmente
    this.modoEdicion = true;
    this.actividadForm.enable();
    
    // Mantener el campo periodo deshabilitado si no es repetitiva
    if (!this.actividadForm.get('repetitiva')?.value) {
      this.actividadForm.get('periodo')?.disable();
    }
  }

  cancelarEdicion(): void {
    if (this.esNueva) {
      this.cerrarModal();
    } else {
      this.modoEdicion = false;
      this.inicializarFormulario();
    }
  }

  guardarCambios(): void {
    if (this.actividadForm.valid) {
      const actividadActualizada = {
        ...this.actividad,
        ...this.actividadForm.getRawValue()
      };

      // Si no es repetitiva, asegurarse de que periodo sea null
      if (!actividadActualizada.repetitiva) {
        actividadActualizada.periodo = null;
      }

      this.cerrar.emit({
        accion: 'guardar',
        actividad: actividadActualizada
      });
    } else {
      this.mostrarErroresFormulario();
    }
  }

  asignarActividad(): void {
    this.cerrar.emit({
      accion: 'asignar',
      actividad: this.actividad
    });
  }

  eliminarActividad(): void {
    this.cerrar.emit({
      accion: 'eliminar',
      actividad: this.actividad
    });
  }

  /**
   * CORRECCIÓN: Cerrar modal correctamente sin emitir eventos adicionales
   */
  cerrarModal(): void {
    this.cerrar.emit(null);
  }

  private mostrarErroresFormulario(): void {
    const errores: string[] = [];
    
    Object.keys(this.actividadForm.controls).forEach(key => {
      const control = this.actividadForm.get(key);
      if (control && control.errors) {
        if (control.errors['required']) {
          errores.push(`${this.obtenerNombreCampo(key)} es requerido`);
        }
        if (control.errors['minlength']) {
          errores.push(`${this.obtenerNombreCampo(key)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`);
        }
        if (control.errors['maxlength']) {
          errores.push(`${this.obtenerNombreCampo(key)} no puede exceder ${control.errors['maxlength'].requiredLength} caracteres`);
        }
        if (control.errors['min']) {
          errores.push(`${this.obtenerNombreCampo(key)} debe ser mayor a ${control.errors['min'].min}`);
        }
        if (control.errors['max']) {
          errores.push(`${this.obtenerNombreCampo(key)} no puede ser mayor a ${control.errors['max'].max}`);
        }
        if (control.errors['pattern']) {
          errores.push(`${this.obtenerNombreCampo(key)} tiene un formato inválido`);
        }
      }
    });

    if (errores.length > 0) {
      this.toastr.warning(errores.join('\n'), 'Formulario incompleto', {
        timeOut: 5000,
        enableHtml: true
      });
      
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.actividadForm.controls).forEach(key => {
        this.actividadForm.get(key)?.markAsTouched();
      });
    }
  }

  private obtenerNombreCampo(key: string): string {
    const nombres: { [key: string]: string } = {
      titulo: 'Título',
      descripcion: 'Descripción',
      tipo: 'Tipo de actividad',
      obligatoria: 'Obligatoria',
      repetitiva: 'Repetitiva',
      periodo: 'Periodo',
      archivo_url: 'URL del archivo',
      origen: 'Origen'
    };
    return nombres[key] || key;
  }

  getErrorMessage(controlName: string): string {
    const control = this.actividadForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `${this.obtenerNombreCampo(controlName)} es requerido`;
    }
    if (control.errors['minlength']) {
      return `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
    }
    if (control.errors['maxlength']) {
      return `No puede exceder ${control.errors['maxlength'].requiredLength} caracteres`;
    }
    if (control.errors['min']) {
      return `Debe ser mayor a ${control.errors['min'].min}`;
    }
    if (control.errors['max']) {
      return `No puede ser mayor a ${control.errors['max'].max}`;
    }
    if (control.errors['pattern']) {
      return 'Formato inválido';
    }
    return 'Error de validación';
  }
}