import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AplicacionTest, RespuestaTest } from '../interfaces/test';
import { ITRDInterpretacionHelper } from './helpers/itrd-interpretacion.helper';

@Injectable({
  providedIn: 'root'
})
export class PdfGeneratorService {

  constructor() {}

  /**
   * Generar PDF completo de un test
   */
  async generarPDFTest(
    aplicacion: AplicacionTest,
    respuestas: RespuestaTest[],
    nombrePaciente: string,
    chartImageData?: string
  ): Promise<void> {
    
    const doc = new jsPDF();
    let yPosition = 20;

    // ========================================
    // ENCABEZADO
    // ========================================
    doc.setFillColor(13, 110, 253);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Test Psicológico', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-MX')}`, 105, 23, { align: 'center' });
    
    yPosition = 40;
    doc.setTextColor(0, 0, 0);

    // ========================================
    // INFORMACIÓN DEL TEST
    // ========================================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Información del Test', 14, yPosition);
    yPosition += 10;

    const infoData = [
      ['Test', aplicacion.test?.nombre || 'N/A'],
      ['Paciente', nombrePaciente],
      ['Fecha de Aplicación', new Date(aplicacion.fecha).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      ['Estado', aplicacion.estado === 'completado' ? 'Completado' : 'Pendiente'],
      ['Tipo', aplicacion.tipo === 'inicial' ? 'Inicial' : 'Seguimiento']
    ];

    // ✅ CORRECCIÓN: Usar sintaxis correcta para autoTable
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: infoData,
      theme: 'grid',
      headStyles: { fillColor: [13, 110, 253] },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 120 }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ========================================
    // PREGUNTAS Y RESPUESTAS
    // ========================================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Preguntas y Respuestas', 14, yPosition);
    yPosition += 10;

    const preguntasData = respuestas.map((resp, index) => [
      `${index + 1}`,
      resp.pregunta?.texto_pregunta || 'Pregunta no disponible',
      this.formatearRespuesta(resp.respuesta, aplicacion.test?.nombre || '')
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Pregunta', 'Respuesta']],
      body: preguntasData,
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253], fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        // ✅ CORRECCIÓN: Especificar ancho sin 'as number'
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 120 },
        2: { cellWidth: 50 }
      },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const respuesta = respuestas[data.row.index].respuesta;
          if (this.esRespuestaEscala(respuesta)) {
            const valor = parseInt(respuesta);
            if (valor >= 4) {
              data.cell.styles.fillColor = [255, 193, 7, 0.3];
            }
          }
        }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // ========================================
    // RESULTADOS
    // ========================================
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados y Evaluación', 14, yPosition);
    yPosition += 10;

    if (aplicacion.resultado) {
      const resultadoData = [
        ['Puntaje Total', aplicacion.resultado.puntaje_total.toString()],
        ['Categoría', this.obtenerCategoria(aplicacion)],
        ['Interpretación', aplicacion.resultado.interpretacion || 'No disponible']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: resultadoData,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 140 }
        },
        didParseCell: (data) => {
          if (data.row.index === 0 && data.column.index === 1) {
            const puntaje = aplicacion.resultado?.puntaje_total || 0;
            const maxPuntaje = this.obtenerPuntajeMaximo(aplicacion.test?.nombre || '');
            const porcentaje = (puntaje / maxPuntaje) * 100;
            
            if (porcentaje >= 80) {
              data.cell.styles.fillColor = [220, 53, 69, 0.3];
            } else if (porcentaje >= 60) {
              data.cell.styles.fillColor = [255, 193, 7, 0.3];
            } else {
              data.cell.styles.fillColor = [25, 135, 84, 0.3];
            }
          }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // ========================================
    // RECOMENDACIONES (si es ITRD)
    // ========================================
    if (this.esTestITRD(aplicacion.test?.nombre || '')) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendaciones Clínicas', 14, yPosition);
      yPosition += 10;

      const recomendaciones = this.obtenerRecomendacionesITRD(aplicacion);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      recomendaciones.forEach((recomendacion, index) => {
        const lineas = doc.splitTextToSize(`${index + 1}. ${recomendacion}`, 180);
        lineas.forEach((linea: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(linea, 14, yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });

      yPosition += 10;
    }

    // ========================================
    // GRÁFICA (si se proporciona)
    // ========================================
    if (chartImageData) {
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Gráfica de Evolución', 14, yPosition);
      yPosition += 10;

      try {
        doc.addImage(chartImageData, 'PNG', 14, yPosition, 180, 90);
        yPosition += 95;
      } catch (error) {
        console.error('Error al agregar imagen:', error);
      }
    }

    // ========================================
    // PIE DE PÁGINA
    // ========================================
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
      doc.text(
        'Documento generado por MiDuelo - Sistema de Gestión Psicológica',
        105,
        285,
        { align: 'center' }
      );
    }

    // ========================================
    // GUARDAR PDF
    // ========================================
    const nombreArchivo = `Test_${aplicacion.test?.nombre.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
  }

  /**
   * Formatear respuesta según el tipo de test
   */
  private formatearRespuesta(respuesta: string, nombreTest: string): string {
    if (!this.esRespuestaEscala(respuesta)) {
      return respuesta;
    }

    if (this.esTestITRD(nombreTest)) {
      const etiquetas = ITRDInterpretacionHelper.ESCALA_RESPUESTAS;
      const valor = parseInt(respuesta) as keyof typeof etiquetas;
      return `${respuesta} - ${etiquetas[valor]}`;
    }

    const etiquetasGenericas: {[key: string]: string} = {
      '1': 'Muy en desacuerdo',
      '2': 'En desacuerdo',
      '3': 'Neutral',
      '4': 'De acuerdo',
      '5': 'Muy de acuerdo',
      '6': 'Bastante de acuerdo',
      '7': 'Totalmente de acuerdo'
    };

    return `${respuesta} - ${etiquetasGenericas[respuesta] || 'N/A'}`;
  }

  /**
   * Verificar si la respuesta es de tipo escala numérica
   */
  private esRespuestaEscala(respuesta: string): boolean {
    const numero = parseInt(respuesta);
    return !isNaN(numero) && numero >= 1 && numero <= 7;
  }

  /**
   * Verificar si es test ITRD
   */
  private esTestITRD(nombreTest: string): boolean {
    return nombreTest.toLowerCase().includes('itrd') || 
           nombreTest.toLowerCase().includes('inventario texas');
  }

  /**
   * Obtener categoría del resultado
   */
  private obtenerCategoria(aplicacion: AplicacionTest): string {
    const puntaje = aplicacion.resultado?.puntaje_total || 0;
    const nombreTest = aplicacion.test?.nombre || '';

    if (!this.esTestITRD(nombreTest)) {
      return 'No disponible';
    }

    const esITRDPasado = nombreTest.toLowerCase().includes('pasado');
    
    if (esITRDPasado) {
      const resultado = ITRDInterpretacionHelper.interpretarITRDPasado(puntaje);
      return resultado.categoria;
    } else {
      const resultado = ITRDInterpretacionHelper.interpretarITRDPresente(puntaje);
      return resultado.categoria;
    }
  }

  /**
   * Obtener puntaje máximo según el test
   */
  private obtenerPuntajeMaximo(nombreTest: string): number {
    if (nombreTest.toLowerCase().includes('itrd')) {
      if (nombreTest.toLowerCase().includes('pasado')) {
        return ITRDInterpretacionHelper.ITRD_PASADO.puntajeMaximo;
      } else if (nombreTest.toLowerCase().includes('presente')) {
        return ITRDInterpretacionHelper.ITRD_PRESENTE.puntajeMaximo;
      }
    }
    return 100;
  }

  /**
   * Obtener recomendaciones ITRD
   */
  private obtenerRecomendacionesITRD(aplicacion: AplicacionTest): string[] {
    const puntaje = aplicacion.resultado?.puntaje_total || 0;
    const nombreTest = aplicacion.test?.nombre || '';
    const esITRDPasado = nombreTest.toLowerCase().includes('pasado');
    
    if (esITRDPasado) {
      const resultado = ITRDInterpretacionHelper.interpretarITRDPasado(puntaje);
      return resultado.recomendaciones;
    } else {
      const resultado = ITRDInterpretacionHelper.interpretarITRDPresente(puntaje);
      return resultado.recomendaciones;
    }
  }
}