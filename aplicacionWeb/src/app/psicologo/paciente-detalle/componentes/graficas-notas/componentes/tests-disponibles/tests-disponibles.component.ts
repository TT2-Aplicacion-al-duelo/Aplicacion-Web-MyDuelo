// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/graficas-notas/componentes/tests-disponibles/tests-disponibles.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Test, PreguntaTest } from '../../../../../../interfaces/test';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { TestsService } from '../../../../../../services/tests.service';
import { ITRDInterpretacionHelper } from '../../../../../../services/helpers/itrd-interpretacion.helper';

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
  
  // Estados del modal
  mostrarModalInfo: boolean = false;  // Modal de información del test
  mostrarModalAplicacion: boolean = false;  // Modal para aplicar el test
  
  // Respuestas del test siendo aplicado
  respuestas: Map<number, string> = new Map();

  // Helper para interpretación ITRD
  itrdHelper = ITRDInterpretacionHelper;

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
   * Ver información completa del test antes de aplicarlo
   */
  verInformacionTest(test: Test): void {
    this.testsService.getDetalleTest(test.id_test).subscribe({
      next: (detalleTest) => {
        this.testSeleccionado = detalleTest;
        this.mostrarModalInfo = true;
      },
      error: (error) => {
        console.error('Error al cargar detalle del test:', error);
        this.toastr.error('Error al cargar los detalles del test');
      }
    });
  }

  /**
   * Cerrar modal de información
   */
  cerrarModalInfo(): void {
    this.mostrarModalInfo = false;
  }

  /**
   * Iniciar aplicación del test (desde el modal de información)
   */
  iniciarAplicacion(): void {
    this.mostrarModalInfo = false;
    this.respuestas.clear();
    this.mostrarModalAplicacion = true;
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

    // Determinar el tipo de test basado en el nombre
    // ITRD Pasado es siempre "inicial" (solo una vez)
    // ITRD Presente es siempre "seguimiento" (múltiples veces)
    let tipoTest = 'seguimiento';
    if (this.esITRDPasado(this.testSeleccionado.nombre)) {
      tipoTest = 'inicial';
    }

    const data = {
      id_test: this.testSeleccionado.id_test,
      id_paciente: this.idPaciente,
      respuestas: respuestasArray,
      tipo: tipoTest
    };

    this.testsService.aplicarTest(data).subscribe({
      next: () => {
        this.toastr.success('Test aplicado exitosamente');
        this.cerrarModalAplicacion();
        this.testAplicado.emit();
        this.aplicandoTest = false;
      },
      error: (error) => {
        console.error('Error al aplicar test:', error);
        const mensajeError = error.error?.msg || 'Error al aplicar el test';
        this.toastr.error(mensajeError);
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
   * Obtener etiqueta de la opción de escala para ITRD
   */
  getEtiquetaEscalaITRD(valor: number): string {
    const etiquetas: { [key: number]: string } = ITRDInterpretacionHelper.ESCALA_RESPUESTAS;
    return etiquetas[valor] || '';
  }

  /**
   * Obtener etiqueta genérica de escala
   */
  getEtiquetaEscala(valor: number, total: number): string {
    if (valor === 1) return 'Muy en desacuerdo';
    if (valor === total) return 'Muy de acuerdo';
    if (valor === Math.ceil(total / 2)) return 'Neutral';
    return '';
  }

  /**
   * Cerrar modal de aplicación
   */
  cerrarModalAplicacion(): void {
    this.mostrarModalAplicacion = false;
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

  /**
   * Verificar si el test es ITRD
   */
  esTestITRD(nombreTest: string): boolean {
    return ITRDInterpretacionHelper.esTestITRD(nombreTest);
  }

  /**
   * Verificar si es ITRD Pasado
   */
  esITRDPasado(nombreTest: string): boolean {
    return ITRDInterpretacionHelper.esITRDPasado(nombreTest);
  }

  /**
   * Verificar si es ITRD Presente
   */
  esITRDPresente(nombreTest: string): boolean {
    return ITRDInterpretacionHelper.esITRDPresente(nombreTest);
  }

  /**
   * Obtener información específica del ITRD
   */
  getInfoITRD(nombreTest: string): any {
    if (this.esITRDPasado(nombreTest)) {
      return ITRDInterpretacionHelper.ITRD_PASADO;
    } else if (this.esITRDPresente(nombreTest)) {
      return ITRDInterpretacionHelper.ITRD_PRESENTE;
    }
    return null;
  }

  /**
   * Obtener descripción de la escala
   */
  getDescripcionEscala(): string {
    return ITRDInterpretacionHelper.getDescripcionEscala();
  }

  /**
   * Obtener badge de tipo de test
   */
  getTipoBadge(nombreTest: string): { text: string, class: string } {
    if (this.esITRDPasado(nombreTest)) {
      return { text: 'Única aplicación', class: 'bg-warning' };
    } else if (this.esITRDPresente(nombreTest)) {
      return { text: 'Aplicación múltiple', class: 'bg-success' };
    }
    return { text: 'Test psicológico', class: 'bg-info' };
  }
}