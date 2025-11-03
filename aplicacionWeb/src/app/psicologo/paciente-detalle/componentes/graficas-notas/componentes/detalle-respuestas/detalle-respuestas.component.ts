import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AplicacionTest, RespuestaTest } from '../../../../../../interfaces/test';
import { Paciente } from '../../../../../../interfaces/paciente';
import { ToastrService } from 'ngx-toastr';
import { TestsService } from '../../../../../../services/tests.service';
import { PdfGeneratorService } from '../../../../../../services/pdf-generator.service';

@Component({
  selector: 'app-detalle-respuestas',
  imports: [CommonModule],
  templateUrl: './detalle-respuestas.component.html',
  styleUrls: ['./detalle-respuestas.component.css']
})
export class DetalleRespuestasComponent implements OnInit {
  @Input() aplicacion!: AplicacionTest;
  @Input() paciente!: Paciente; // ✅ NUEVO: Recibir datos del paciente
  @Output() cerrar = new EventEmitter<void>();
  @Output() crearNota = new EventEmitter<number>(); // ✅ NUEVO: Emitir evento para crear nota

  respuestas: RespuestaTest[] = [];
  cargando: boolean = false;

  constructor(
    private testsService: TestsService,
    private pdfService: PdfGeneratorService, // ✅ NUEVO: Servicio para generar PDF
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarRespuestas();
  }

  /**
   * Cargar respuestas del test
   */
  cargarRespuestas(): void {
    this.cargando = true;
    this.testsService.getRespuestasTest(this.aplicacion.id_aplicacion).subscribe({
      next: (respuestas) => {
        this.respuestas = respuestas;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar respuestas:', error);
        this.toastr.error('Error al cargar las respuestas del test');
        this.cargando = false;
      }
    });
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.cerrar.emit();
  }

  /**
   * ✅ CORREGIDO: Descargar PDF usando el servicio de generación de PDF
   */
  async descargarPDF(): Promise<void> {
    this.toastr.info('Generando PDF...', '', { timeOut: 2000 });

    try {
      // Obtener nombre completo del paciente
      const nombrePaciente = this.paciente 
        ? `${this.paciente.nombre} ${this.paciente.apellido_paterno} ${this.paciente.apellido_materno}`.trim()
        : 'Paciente';

      // Generar PDF usando el servicio
      await this.pdfService.generarPDFTest(
        this.aplicacion,
        this.respuestas,
        nombrePaciente
      );

      this.toastr.success('PDF generado y descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      this.toastr.error('Error al generar el PDF');
    }
  }

  /**
   * ✅ NUEVO: Crear nota vinculada a este test
   */
  crearNotaTest(): void {
    this.crearNota.emit(this.aplicacion.id_aplicacion);
  }

  /**
   * Obtener color de respuesta según el valor (para escalas)
   */
  getColorRespuesta(respuesta: string): string {
    const valor = parseInt(respuesta);
    if (isNaN(valor)) return 'secondary';
    
    if (valor <= 2) return 'success';
    if (valor <= 4) return 'warning';
    return 'danger';
  }
}