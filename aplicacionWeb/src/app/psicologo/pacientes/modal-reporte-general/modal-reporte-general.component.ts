import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteGeneral, ResumenPaciente } from '../../../interfaces/reporte-general';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-modal-reporte-general',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-reporte-general.component.html',
  styleUrls: ['./modal-reporte-general.component.css']
})
export class ModalReporteGeneralComponent implements OnInit {
  @Input() reporte: ReporteGeneral | null = null;
  @Input() mostrar: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  pacienteExpandido: number | null = null;

  ngOnInit(): void {
    // Lógica de inicialización si es necesaria
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  /**
   * Alternar expansión de detalles del paciente
   */
  togglePaciente(idPaciente: number): void {
    if (this.pacienteExpandido === idPaciente) {
      this.pacienteExpandido = null;
    } else {
      this.pacienteExpandido = idPaciente;
    }
  }

  /**
   * Verificar si un paciente está expandido
   */
  estaExpandido(idPaciente: number): boolean {
    return this.pacienteExpandido === idPaciente;
  }

  /**
   * Obtener clase de color para el progreso
   */
  getColorProgreso(progreso: number): string {
    if (progreso < 30) return 'danger';
    if (progreso < 70) return 'warning';
    return 'success';
  }

  /**
   * Descargar reporte en PDF
   */
  // descargarPDF(): void {
  //   if (!this.reporte) return;

  //   const doc = new jsPDF();
  //   const pageWidth = doc.internal.pageSize.getWidth();
  //   let yPosition = 20;

  //   // ==================== ENCABEZADO ====================
  //   doc.setFontSize(20);
  //   doc.setTextColor(40, 40, 40);
  //   doc.text('Reporte General de Pacientes', pageWidth / 2, yPosition, { align: 'center' });
    
  //   yPosition += 10;
  //   doc.setFontSize(11);
  //   doc.setTextColor(100, 100, 100);
  //   const fechaGeneracion = new Date(this.reporte.fecha_generacion).toLocaleDateString('es-MX', {
  //     year: 'numeric',
  //     month: 'long',
  //     day: 'numeric',
  //     hour: '2-digit',
  //     minute: '2-digit'
  //   });
  //   doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, yPosition, { align: 'center' });
    
  //   yPosition += 15;

  //   // ==================== RESUMEN GLOBAL ====================
  //   doc.setFontSize(14);
  //   doc.setTextColor(0, 102, 204);
  //   doc.text('Resumen Global', 14, yPosition);
    
  //   yPosition += 10;
    
  //   const resumenData = [
  //     ['Total de Pacientes', this.reporte.total_pacientes.toString()],
  //     ['Tests Aplicados', this.reporte.resumen_global.total_tests_aplicados.toString()],
  //     ['Actividades Asignadas', this.reporte.resumen_global.total_actividades_asignadas.toString()],
  //     ['Actividades Completadas', this.reporte.resumen_global.total_actividades_completadas.toString()],
  //     ['Actividades Pendientes', this.reporte.resumen_global.total_actividades_pendientes.toString()],
  //     ['Progreso Promedio en Módulos', `${this.reporte.resumen_global.promedio_progreso_modulos}%`]
  //   ];

  //   autoTable(doc, {
  //     startY: yPosition,
  //     head: [['Métrica', 'Valor']],
  //     body: resumenData,
  //     theme: 'grid',
  //     headStyles: { fillColor: [0, 102, 204], textColor: 255 },
  //     styles: { fontSize: 10 },
  //     margin: { left: 14, right: 14 }
  //   });

  //   yPosition = (doc as any).lastAutoTable.finalY + 15;

  //   // ==================== DETALLES POR PACIENTE ====================
  //   doc.setFontSize(14);
  //   doc.setTextColor(0, 102, 204);
  //   doc.text('Detalles por Paciente', 14, yPosition);
    
  //   yPosition += 10;

  //   this.reporte.pacientes.forEach((paciente: ResumenPaciente, index: number) => {
  //     // Verificar si necesitamos una nueva página
  //     if (yPosition > 250) {
  //       doc.addPage();
  //       yPosition = 20;
  //     }

  //     // Nombre del paciente
  //     doc.setFontSize(12);
  //     doc.setTextColor(40, 40, 40);
  //     doc.text(`${index + 1}. ${paciente.nombre_completo}`, 14, yPosition);
      
  //     yPosition += 8;

  //     // Información básica
  //     const infoPaciente = [
  //       ['Email', paciente.email],
  //       ['Tests Realizados', paciente.tests.total.toString()],
  //       ['Actividades Completadas', paciente.actividades.completadas.toString()],
  //       ['Actividades Pendientes', paciente.actividades.pendientes.toString()],
  //       ['Progreso en Módulos', `${paciente.modulos.progreso_promedio}%`]
  //     ];

  //     autoTable(doc, {
  //       startY: yPosition,
  //       body: infoPaciente,
  //       theme: 'plain',
  //       styles: { fontSize: 9, cellPadding: 2 },
  //       margin: { left: 20, right: 14 },
  //       columnStyles: {
  //         0: { fontStyle: 'bold', cellWidth: 60 },
  //         1: { cellWidth: 'auto' }
  //       }
  //     });

  //     yPosition = (doc as any).lastAutoTable.finalY + 8;
  //   });

  //   // ==================== GUARDAR PDF ====================
  //   const nombreArchivo = `Reporte_General_Pacientes_${new Date().toISOString().split('T')[0]}.pdf`;
  //   doc.save(nombreArchivo);
  // }
  descargarPDF(): void {
  if (!this.reporte) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ==================== ENCABEZADO ====================
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('Reporte General de Pacientes', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const fechaGeneracion = new Date(this.reporte.fecha_generacion).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado el: ${fechaGeneracion}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;

  // ==================== RESUMEN GLOBAL ====================
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('📊 Resumen Global', 14, yPosition);
  
  yPosition += 10;
  
  const resumenData = [
    ['Total de Pacientes', this.reporte.total_pacientes.toString()],
    ['Tests Aplicados', this.reporte.resumen_global.total_tests_aplicados.toString()],
    ['Actividades Asignadas', this.reporte.resumen_global.total_actividades_asignadas.toString()],
    ['Actividades Completadas', this.reporte.resumen_global.total_actividades_completadas.toString()],
    ['Actividades Pendientes', this.reporte.resumen_global.total_actividades_pendientes.toString()],
    ['Progreso Promedio en Módulos', `${this.reporte.resumen_global.promedio_progreso_modulos}%`]
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Métrica', 'Valor']],
    body: resumenData,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], textColor: 255 },
    styles: { fontSize: 10 },
    margin: { left: 14, right: 14 }
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ==================== GRÁFICA: AVANCE GENERAL DE PACIENTES ====================
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Avance General de Pacientes', 14, yPosition);
  yPosition += 10;

  // Calcular datos para la gráfica
  const pacientesConProgreso = this.reporte.pacientes.filter(p => p.modulos.progreso_promedio > 0).length;
  const pacientesSinProgreso = this.reporte.total_pacientes - pacientesConProgreso;

  this.dibujarGraficaBarras(doc, yPosition, [
    { label: 'Con Progreso', valor: pacientesConProgreso, color: [40, 167, 69] },
    { label: 'Sin Progreso', valor: pacientesSinProgreso, color: [220, 53, 69] }
  ], this.reporte.total_pacientes);

  yPosition += 60;

  // ==================== GRÁFICA: PROGRESO PROMEDIO POR MÓDULO ====================
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Progreso Promedio por Módulo', 14, yPosition);
  yPosition += 10;

  // Calcular progreso promedio por módulo
  const modulosProgreso = this.calcularProgresoModulos();
  
  this.dibujarGraficaBarrasHorizontal(doc, yPosition, modulosProgreso);

  yPosition += (modulosProgreso.length * 15) + 20;

  // ==================== NUEVA PÁGINA: DETALLES POR PACIENTE ====================
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Detalles por Paciente', 14, yPosition);
  
  yPosition += 10;

  this.reporte.pacientes.forEach((paciente, index) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }

    // Nombre del paciente
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. ${paciente.nombre_completo}`, 14, yPosition);
    doc.setFont('helvetica', 'normal');
    
    yPosition += 8;

    // Información básica
    const infoPaciente = [
      ['Email', paciente.email],
      ['Fecha de Registro', new Date(paciente.fecha_registro).toLocaleDateString('es-MX')],
      ['Tests Realizados', paciente.tests.total.toString()],
      ['Actividades Completadas', paciente.actividades.completadas.toString()],
      ['Actividades Pendientes', paciente.actividades.pendientes.toString()],
      ['Progreso en Módulos', `${paciente.modulos.progreso_promedio}%`]
    ];

    autoTable(doc, {
      startY: yPosition,
      body: infoPaciente,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2 },
      margin: { left: 20, right: 14 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 5;

    // ✅ TABLA DE TESTS CON PUNTUACIONES
    if (paciente.tests.total > 0 && paciente.tests.detalles && paciente.tests.detalles.length > 0) {
      // Verificar espacio
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text('Tests Aplicados:', 20, yPosition);
      yPosition += 5;

      const testsData = paciente.tests.detalles.map((test: any) => [
        test.nombre_test,
        new Date(test.fecha).toLocaleDateString('es-MX'),
        test.puntaje !== null ? test.puntaje.toString() : 'N/A',
        test.interpretacion || 'Sin interpretación'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Test', 'Fecha', 'Puntaje', 'Interpretación']],
        body: testsData,
        theme: 'striped',
        headStyles: { fillColor: [13, 110, 253], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 'auto' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 5;
    }

    // Módulos
    if (paciente.modulos.detalles && paciente.modulos.detalles.length > 0) {
      // Verificar espacio
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(0, 102, 204);
      doc.text('Módulos de Duelo:', 20, yPosition);
      yPosition += 5;

      const modulosData = paciente.modulos.detalles.map((modulo: any) => [
        modulo.nombre_modulo,
        `${modulo.actividades_completadas}/${modulo.actividades_totales}`,
        `${modulo.progreso}%`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Módulo', 'Actividades', 'Progreso']],
        body: modulosData,
        theme: 'grid',
        headStyles: { fillColor: [25, 135, 84], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 14 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 12;
    }

    yPosition += 5;
  });

  // ==================== GUARDAR PDF ====================
  const nombreArchivo = `Reporte_General_Pacientes_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(nombreArchivo);
}

// ==================== MÉTODOS AUXILIARES PARA GRÁFICAS ====================

/**
 * Dibujar gráfica de barras verticales
 */
private dibujarGraficaBarras(
  doc: jsPDF, 
  startY: number, 
  datos: Array<{label: string, valor: number, color: number[]}>,
  maxValor: number
): void {
  const barWidth = 40;
  const maxBarHeight = 40;
  const spacing = 20;
  let xPosition = 30;

  datos.forEach(dato => {
    const barHeight = (dato.valor / maxValor) * maxBarHeight;
    
    // Dibujar barra
    doc.setFillColor(dato.color[0], dato.color[1], dato.color[2]);
    doc.rect(xPosition, startY + maxBarHeight - barHeight, barWidth, barHeight, 'F');
    
    // Dibujar borde
    doc.setDrawColor(0);
    doc.rect(xPosition, startY + maxBarHeight - barHeight, barWidth, barHeight, 'S');
    
    // Valor encima de la barra
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(dato.valor.toString(), xPosition + barWidth / 2, startY + maxBarHeight - barHeight - 3, { align: 'center' });
    
    // Etiqueta debajo
    doc.setFontSize(9);
    doc.text(dato.label, xPosition + barWidth / 2, startY + maxBarHeight + 8, { align: 'center' });
    
    xPosition += barWidth + spacing;
  });
}

/**
 * Dibujar gráfica de barras horizontales
 */
private dibujarGraficaBarrasHorizontal(
  doc: jsPDF,
  startY: number,
  datos: Array<{nombre: string, progreso: number}>
): void {
  const maxBarWidth = 100;
  const barHeight = 10;
  let yPos = startY;

  datos.forEach(modulo => {
    // Nombre del módulo
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(modulo.nombre.substring(0, 30), 14, yPos + 7);
    
    // Barra de progreso
    const barWidth = (modulo.progreso / 100) * maxBarWidth;
    const xStart = 90;
    
    // Fondo de la barra (gris claro)
    doc.setFillColor(230, 230, 230);
    doc.rect(xStart, yPos, maxBarWidth, barHeight, 'F');
    
    // Barra de progreso (color según valor)
    const color = modulo.progreso < 30 ? [220, 53, 69] : 
                  modulo.progreso < 70 ? [255, 193, 7] : [40, 167, 69];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(xStart, yPos, barWidth, barHeight, 'F');
    
    // Borde
    doc.setDrawColor(150);
    doc.rect(xStart, yPos, maxBarWidth, barHeight, 'S');
    
    // Porcentaje
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(`${modulo.progreso}%`, xStart + maxBarWidth + 5, yPos + 7);
    
    yPos += 15;
  });
}

/**
 * Calcular progreso promedio por módulo
 */
private calcularProgresoModulos(): Array<{nombre: string, progreso: number}> {
  if (!this.reporte) return [];

  const modulosMap = new Map<string, number[]>();

  // Recopilar todos los progresos por módulo
  this.reporte.pacientes.forEach(paciente => {
    if (paciente.modulos.detalles) {
      paciente.modulos.detalles.forEach(modulo => {
        if (!modulosMap.has(modulo.nombre_modulo)) {
          modulosMap.set(modulo.nombre_modulo, []);
        }
        modulosMap.get(modulo.nombre_modulo)!.push(modulo.progreso);
      });
    }
  });

  // Calcular promedio
  const resultado: Array<{nombre: string, progreso: number}> = [];
  modulosMap.forEach((progresos, nombre) => {
    const promedio = Math.round(progresos.reduce((a, b) => a + b, 0) / progresos.length);
    resultado.push({ nombre, progreso: promedio });
  });

  // Ordenar por progreso descendente
  return resultado.sort((a, b) => b.progreso - a.progreso);
}

  /**
   * Manejar clic fuera del modal
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }
}