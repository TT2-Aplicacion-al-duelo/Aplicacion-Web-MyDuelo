import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';
import { ActualizarNotaRequest, CrearNotaRequest, Nota } from '../../../../../../interfaces/nota';
import { NotasService } from '../../../../../../services/notas.service';

@Component({
  selector: 'app-modal-crear-nota',
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-nota.component.html',
  styleUrls: ['./modal-crear-nota.component.css']
})
export class ModalCrearNotaComponent implements OnInit {
  @Input() idPaciente!: number;
  @Input() nota: Nota | null = null;
  @Input() modoEdicion: boolean = false;
  @Input() idAplicacion?: number; // Opcional si la nota está relacionada con un test
  
  @Output() notaGuardada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  // Modelo del formulario
  titulo: string = '';
  contenido: string = '';
  tipo: 'general' | 'test' = 'general';

  guardando: boolean = false;

  constructor(
    private notasService: NotasService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Si hay nota, cargar sus datos (modo edición)
    if (this.nota) {
      this.titulo = this.nota.titulo;
      this.contenido = this.nota.contenido;
      this.tipo = this.nota.tipo;
    }

    // Si hay id_aplicacion, es una nota de test
    if (this.idAplicacion) {
      this.tipo = 'test';
    }
  }

  /**
   * Guardar nota (crear o actualizar)
   */
  guardarNota(): void {
    // Validaciones
    if (!this.titulo.trim()) {
      this.toastr.warning('Por favor ingresa un título');
      return;
    }

    if (!this.contenido.trim()) {
      this.toastr.warning('Por favor ingresa contenido para la nota');
      return;
    }

    if (this.modoEdicion && this.nota) {
      this.actualizarNota();
    } else {
      this.crearNota();
    }
  }

  /**
   * Crear nueva nota
   */
  private crearNota(): void {
    this.guardando = true;

    const notaData: CrearNotaRequest = {
      id_paciente: this.idPaciente,
      titulo: this.titulo.trim(),
      contenido: this.contenido.trim(),
      tipo: this.tipo
    };

    // Agregar id_aplicacion si existe
    if (this.idAplicacion) {
      notaData.id_aplicacion = this.idAplicacion;
    }

    this.notasService.crearNota(notaData).subscribe({
      next: () => {
        this.toastr.success('Nota creada exitosamente');
        this.notaGuardada.emit();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al crear nota:', error);
        this.toastr.error('Error al crear la nota');
        this.guardando = false;
      }
    });
  }

  /**
   * Actualizar nota existente
   */
  private actualizarNota(): void {
    if (!this.nota) return;

    this.guardando = true;

    const notaData: ActualizarNotaRequest = {
      titulo: this.titulo.trim(),
      contenido: this.contenido.trim()
    };

    this.notasService.actualizarNota(this.nota.id_nota, notaData).subscribe({
      next: () => {
        this.toastr.success('Nota actualizada exitosamente');
        this.notaGuardada.emit();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al actualizar nota:', error);
        this.toastr.error('Error al actualizar la nota');
        this.guardando = false;
      }
    });
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    if (this.guardando) return;
    this.cerrar.emit();
  }

  /**
   * Contador de caracteres
   */
  get contadorTitulo(): string {
    return `${this.titulo.length}/100`;
  }

  get contadorContenido(): string {
    return `${this.contenido.length}/1000`;
  }
}