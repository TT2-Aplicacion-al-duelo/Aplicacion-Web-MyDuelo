import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Test, PreguntaTest } from '../../../../../../interfaces/test';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { TestsService } from '../../../../../../services/tests.service';

@Component({
  selector: 'app-tests-disponibles',
  imports: [CommonModule, FormsModule],
  templateUrl: './tests-disponibles.component.html',
  styleUrls: ['./tests-disponibles.component.css']
})
export class TestsDisponiblesComponent implements OnInit {
  @Input() idPaciente!: number;
  @Output() testAplicado = new EventEmitter<void>();

  testsDisponibles: Test[] = [];
  testSeleccionado: (Test & { preguntas: PreguntaTest[] }) | null = null;
  
  cargando: boolean = false;
  aplicandoTest: boolean = false;
  mostrarModalTest: boolean = false;
  
  // Respuestas del test siendo aplicado
  respuestas: Map<number, string> = new Map();

  constructor(
    private testsService: TestsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarTestsDisponibles();
  }

  /**
   * Cargar todos los tests disponibles
   */
  cargarTestsDisponibles(): void {
    this.cargando = true;
    this.testsService.getTestsDisponibles().subscribe({
      next: (tests) => {
        this.testsDisponibles = tests.filter(test => test.activo);
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar tests:', error);
        this.toastr.error('Error al cargar los tests disponibles');
        this.cargando = false;
      }
    });
  }

  /**
   * Ver detalles de un test y preparar para aplicarlo
   */
  verDetalleTest(test: Test): void {
    this.testsService.getDetalleTest(test.id_test).subscribe({
      next: (detalleTest) => {
        this.testSeleccionado = detalleTest;
        this.respuestas.clear();
        this.mostrarModalTest = true;
      },
      error: (error) => {
        console.error('Error al cargar detalle del test:', error);
        this.toastr.error('Error al cargar los detalles del test');
      }
    });
  }

  /**
   * Aplicar el test al paciente
   */
  aplicarTest(): void {
    if (!this.testSeleccionado) return;

    // Validar que todas las preguntas estén respondidas
    const totalPreguntas = this.testSeleccionado.preguntas.length;
    const respuestasCompletas = this.respuestas.size;

    if (respuestasCompletas < totalPreguntas) {
      this.toastr.warning(`Por favor responde todas las preguntas (${respuestasCompletas}/${totalPreguntas})`);
      return;
    }

    Swal.fire({
      title: '¿Aplicar test?',
      text: `¿Deseas aplicar el test "${this.testSeleccionado.nombre}" a este paciente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, aplicar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarAplicarTest();
      }
    });
  }

  /**
   * Confirmar y enviar la aplicación del test
   */
  private confirmarAplicarTest(): void {
    if (!this.testSeleccionado) return;

    this.aplicandoTest = true;

    const respuestasArray = Array.from(this.respuestas.entries()).map(([id_pregunta, respuesta]) => ({
      id_pregunta,
      respuesta
    }));

    const data = {
      id_test: this.testSeleccionado.id_test,
      id_paciente: this.idPaciente,
      respuestas: respuestasArray
    };

    this.testsService.aplicarTest(data).subscribe({
      next: () => {
        this.toastr.success('Test aplicado exitosamente');
        this.cerrarModal();
        this.testAplicado.emit();
        this.aplicandoTest = false;
      },
      error: (error) => {
        console.error('Error al aplicar test:', error);
        this.toastr.error('Error al aplicar el test');
        this.aplicandoTest = false;
      }
    });
  }

  /**
   * Guardar respuesta de una pregunta
   */
  guardarRespuesta(idPregunta: number, respuesta: string): void {
    this.respuestas.set(idPregunta, respuesta);
  }

  /**
   * Obtener opciones de escala según el tipo
   */
  getOpcionesEscala(tipoEscala: string): number[] {
    if (tipoEscala === 'likert_5') {
      return [1, 2, 3, 4, 5];
    } else if (tipoEscala === 'likert_7') {
      return [1, 2, 3, 4, 5, 6, 7];
    }
    return [];
  }

  /**
   * Obtener etiqueta de la opción de escala
   */
  getEtiquetaEscala(valor: number, total: number): string {
    if (valor === 1) return 'Muy en desacuerdo';
    if (valor === total) return 'Muy de acuerdo';
    if (valor === Math.ceil(total / 2)) return 'Neutral';
    return '';
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.mostrarModalTest = false;
    this.testSeleccionado = null;
    this.respuestas.clear();
  }

  /**
   * Obtener progreso de respuestas
   */
  getProgreso(): number {
    if (!this.testSeleccionado) return 0;
    const total = this.testSeleccionado.preguntas.length;
    const completadas = this.respuestas.size;
    return (completadas / total) * 100;
  }
}