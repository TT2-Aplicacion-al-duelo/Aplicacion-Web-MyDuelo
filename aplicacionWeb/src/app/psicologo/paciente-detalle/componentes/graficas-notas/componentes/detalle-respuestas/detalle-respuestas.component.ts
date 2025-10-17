import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AplicacionTest, RespuestaTest } from '../../../../../../interfaces/test';
import { ToastrService } from 'ngx-toastr';
import { TestsService } from '../../../../../../services/tests.service';

@Component({
  selector: 'app-detalle-respuestas',
  imports: [CommonModule],
  templateUrl: './detalle-respuestas.component.html',
  styleUrls: ['./detalle-respuestas.component.css']
})
export class DetalleRespuestasComponent implements OnInit {
  @Input() aplicacion!: AplicacionTest;
  @Output() cerrar = new EventEmitter<void>();

  respuestas: RespuestaTest[] = [];
  cargando: boolean = false;

  constructor(
    private testsService: TestsService,
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
   * Descargar PDF
   */
  descargarPDF(): void {
    const nombreArchivo = `Respuestas_${this.aplicacion.test?.nombre}_${new Date(this.aplicacion.fecha).toLocaleDateString()}.pdf`;
    this.testsService.descargarPDF(this.aplicacion.id_aplicacion, nombreArchivo);
    this.toastr.success('Descargando PDF...');
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