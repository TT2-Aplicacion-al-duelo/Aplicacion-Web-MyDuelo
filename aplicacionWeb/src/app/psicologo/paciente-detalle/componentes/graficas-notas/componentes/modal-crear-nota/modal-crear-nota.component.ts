import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ActualizarNotaRequest, CrearNotaRequest, Nota } from '../../../../../../interfaces/nota';
import { NotasService } from '../../../../../../services/notas.service';
import { TestsService } from '../../../../../../services/tests.service';
import { AplicacionTest } from '../../../../../../interfaces/test';

@Component({
  selector: 'app-modal-crear-nota',
  standalone: true,
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
  idTestSeleccionado?: number; // ✅ CORREGIDO: Usar undefined en lugar de null

  // Lista de tests disponibles
  testsDisponibles: AplicacionTest[] = [];
  cargandoTests: boolean = false;

  guardando: boolean = false;

  constructor(
    private notasService: NotasService,
    private testsService: TestsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Si hay nota, cargar sus datos (modo edición)
    if (this.nota) {
      this.titulo = this.nota.titulo;
      this.contenido = this.nota.contenido;
      this.tipo = this.nota.tipo;
      this.idTestSeleccionado = this.nota.id_aplicacion;
    }

    // Si hay id_aplicacion proporcionado, es una nota de test
    if (this.idAplicacion) {
      this.tipo = 'test';
      this.idTestSeleccionado = this.idAplicacion;
    }

    // Cargar tests disponibles del paciente
    this.cargarTestsDisponibles();
  }

  /**
   * Cargar tests completados del paciente
   */
  cargarTestsDisponibles(): void {
    this.cargandoTests = true;
    this.testsService.getHistorialTests(this.idPaciente).subscribe({
      next: (tests) => {
        // Solo tests completados
        this.testsDisponibles = tests.filter(t => t.estado === 'completado');
        this.cargandoTests = false;
      },
      error: (error) => {
        console.error('Error al cargar tests:', error);
        this.cargandoTests = false;
      }
    });
  }

  /**
   * Cambiar tipo de nota (general o test)
   */
  onTipoChange(): void {
    if (this.tipo === 'general') {
      this.idTestSeleccionado = undefined; // ✅ CORREGIDO: Usar undefined
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

    // Validar que si es nota de test, se haya seleccionado un test
    if (this.tipo === 'test' && !this.idTestSeleccionado && !this.idAplicacion) {
      this.toastr.warning('Por favor selecciona un test para vincular la nota');
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

    // Agregar id_aplicacion si es nota de test
    if (this.tipo === 'test') {
      notaData.id_aplicacion = this.idTestSeleccionado || this.idAplicacion;
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

  /**
   * Obtener nombre del test seleccionado
   */
  getNombreTestSeleccionado(): string {
    if (!this.idTestSeleccionado && !this.idAplicacion) return '';
    
    const idBuscar = this.idTestSeleccionado || this.idAplicacion;
    const test = this.testsDisponibles.find(t => t.id_aplicacion === idBuscar);
    return test?.test?.nombre || '';
  }
}