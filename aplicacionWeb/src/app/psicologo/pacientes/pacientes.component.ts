import { Component, OnInit } from '@angular/core';
import { Paciente } from '../../interfaces/paciente';
import { PacientesService } from '../../services/pacientes.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';  
import { ModalReporteGeneralComponent } from './modal-reporte-general/modal-reporte-general.component';
import { ReporteGeneral } from '../../interfaces/reporte-general';
import { ReportePacientesService } from '../../services/reporte-pacientes.service';
import { ToastrService } from 'ngx-toastr';
import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';

interface PacienteConError extends Paciente {
  imageError?: boolean;
}

@Component({
  selector: 'app-pacientes',
  imports: [CommonModule, FormsModule, ModalReporteGeneralComponent],
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.css'
})
export class PacientesComponent implements OnInit {
  // listPacientes: Paciente[] = [];
  // pacientesFiltrados: Paciente[] = [];
listPacientes: PacienteConError[] = [];
pacientesFiltrados: PacienteConError[] = [];
  
  // Filtros
  filtroTexto: string = '';
  filtroVerificado: string = 'todos';
  
  // Estados
  cargando: boolean = false;

  // Reporte general
  reporteGeneral: ReporteGeneral | null = null;
  mostrarModalReporte: boolean = false;
  cargandoReporte: boolean = false;

  constructor(
    private _pacienteServices: PacientesService,
    private reportePacientesService: ReportePacientesService, 
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getPacientesPorPsicologo();
  }


  /**
   * Manejar error de carga de imagen
   */
  onImageError(event: Event, paciente: PacienteConError): void {
    console.warn('Error cargando foto de paciente:', paciente.id_paciente);
    paciente.imageError = true;
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  getPacientesPorPsicologo() {
    this.cargando = true;
    this._pacienteServices.getPacientesPorPsicologo().subscribe({
      next: (data: Paciente[]) => {
        console.log('Pacientes cargados:', data);
        this.listPacientes = data;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.listPacientes = [];
        this.pacientesFiltrados = [];
        this.cargando = false;
        
        if (error.status === 401) {
          console.log('Token inválido o expirado. Redirigiendo al login...');
        }
      }
    });
  }

  aplicarFiltros() {
    this.pacientesFiltrados = this.listPacientes.filter(paciente => {
      const textoMatch = 
        paciente.nombre?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_paterno?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.apellido_materno?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.email.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        paciente.id_paciente?.toString().includes(this.filtroTexto);
      
      const verificadoMatch = 
        this.filtroVerificado === 'todos' ||
        (this.filtroVerificado === 'verificados' && paciente.email_verificado) ||
        (this.filtroVerificado === 'no_verificados' && !paciente.email_verificado);
      
      return textoMatch && verificadoMatch;
    });
  }

  verDetallePaciente(paciente: Paciente): void {
    if (paciente.id_paciente) {
      this.router.navigate(['/paciente', paciente.id_paciente]);
    }
  }

  getClaseFilaPaciente(paciente: Paciente): string {
    if (!paciente.email_verificado) {
      return 'table-warning'; // Amarillo para no verificados
    }
    return 'table-success'; // Verde para verificados
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'No disponible';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  /**
   * Obtener URL de foto de perfil del paciente
   */
  obtenerFotoUrl(paciente: Paciente): string {
    const fotoPerfil = paciente.foto_perfil;
    
    if (!fotoPerfil) {
     // console.log('❌ No hay foto_perfil');
      return '';
    }
    
    // Si es URL antigua de Azure, ignorarla
    if (fotoPerfil.startsWith('http://192.168') || fotoPerfil.startsWith('http://20.')) {
         return '';
    }
    
    // Si ya es URL completa válida
    if (fotoPerfil.startsWith('http')) {
      //console.log('✅ URL completa:', fotoPerfil);
      return fotoPerfil;
    }
    
    // Construir URL del servidor
    const baseUrl = environment.apiUrl || 'http://localhost:3017';
    const urlFinal = `${baseUrl}/uploads/${fotoPerfil}`;
    
    //console.log('URL construida:', urlFinal);
    
    return urlFinal;
  }


  /**
   * Obtener nombre completo del paciente
   */
  getNombreCompleto(paciente: Paciente): string {
    const nombre = paciente.nombre || '';
    const paterno = paciente.apellido_paterno || '';
    const materno = paciente.apellido_materno || '';
    return `${nombre} ${paterno} ${materno}`.trim();
  }

  /**
   * Obtener iniciales del paciente
   */
  getIniciales(paciente: Paciente): string {
    const nombre = paciente.nombre?.charAt(0).toUpperCase() || '';
    const apellido = paciente.apellido_paterno?.charAt(0).toUpperCase() || '';
    return `${nombre}${apellido}`;
  }

  /**
   * Mostrar modal de reporte general
   */
  mostrarReporteGeneral(): void {
    this.cargandoReporte = true;
    
    this.reportePacientesService.getReporteGeneral().subscribe({
      next: (reporte) => {
        this.reporteGeneral = reporte;
        this.mostrarModalReporte = true;
        this.cargandoReporte = false;
        this.toastr.success('Reporte generado exitosamente');
      },
      error: (error) => {
        console.error('Error al cargar reporte:', error);
        this.toastr.error('Error al generar el reporte general');
        this.cargandoReporte = false;
      }
    });
  }

  /**
   * Cerrar modal de reporte
   */
  cerrarModalReporte(): void {
    this.mostrarModalReporte = false;
  }

  /**
   * Descargar reporte general directamente en PDF
   */
  descargarReporteGeneralDirecto(): void {
    this.cargandoReporte = true;
    
    this.reportePacientesService.getReporteGeneral().subscribe({
      next: (reporte) => {
        this.generarPDFReporte(reporte);
        this.cargandoReporte = false;
        this.toastr.success('Reporte descargado exitosamente');
      },
      error: (error) => {
        console.error('Error al descargar reporte:', error);
        this.toastr.error('Error al descargar el reporte');
        this.cargandoReporte = false;
      }
    });
  }

  /**
   * Generar PDF del reporte
   */
  // private generarPDFReporte(reporte: ReporteGeneral): void {
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
  //   const fechaGeneracion = new Date(reporte.fecha_generacion).toLocaleDateString('es-MX', {
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
  //   doc.text('📊 Resumen Global', 14, yPosition);
    
  //   yPosition += 10;
    
  //   const resumenData = [
  //     ['Total de Pacientes', reporte.total_pacientes.toString()],
  //     ['Tests Aplicados', reporte.resumen_global.total_tests_aplicados.toString()],
  //     ['Actividades Asignadas', reporte.resumen_global.total_actividades_asignadas.toString()],
  //     ['Actividades Completadas', reporte.resumen_global.total_actividades_completadas.toString()],
  //     ['Actividades Pendientes', reporte.resumen_global.total_actividades_pendientes.toString()],
  //     ['Progreso Promedio en Módulos', `${reporte.resumen_global.promedio_progreso_modulos}%`]
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
  //   doc.text('👥 Detalles por Paciente', 14, yPosition);
    
  //   yPosition += 10;

  //   reporte.pacientes.forEach((paciente, index) => {
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
  private generarPDFReporte(reporte: ReporteGeneral): void {
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
  const fechaGeneracion = new Date(reporte.fecha_generacion).toLocaleDateString('es-MX', {
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
  doc.text('Resumen Global', 14, yPosition);
  
  yPosition += 10;
  
  const resumenData = [
    ['Total de Pacientes', reporte.total_pacientes.toString()],
    ['Tests Aplicados', reporte.resumen_global.total_tests_aplicados.toString()],
    ['Actividades Asignadas', reporte.resumen_global.total_actividades_asignadas.toString()],
    ['Actividades Completadas', reporte.resumen_global.total_actividades_completadas.toString()],
    ['Actividades Pendientes', reporte.resumen_global.total_actividades_pendientes.toString()],
    ['Progreso Promedio en Módulos', `${reporte.resumen_global.promedio_progreso_modulos}%`]
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
  const pacientesConProgreso = reporte.pacientes.filter(p => p.modulos.progreso_promedio > 0).length;
  const pacientesSinProgreso = reporte.total_pacientes - pacientesConProgreso;

  this.dibujarGraficaBarras(doc, yPosition, [
    { label: 'Con Progreso', valor: pacientesConProgreso, color: [40, 167, 69] },
    { label: 'Sin Progreso', valor: pacientesSinProgreso, color: [220, 53, 69] }
  ], reporte.total_pacientes);

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
  const modulosProgreso = this.calcularProgresoModulos(reporte);
  
  this.dibujarGraficaBarrasHorizontal(doc, yPosition, modulosProgreso);

  yPosition += (modulosProgreso.length * 15) + 20;

  // ==================== NUEVA PÁGINA: DETALLES POR PACIENTE ====================
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('Detalles por Paciente', 14, yPosition);
  
  yPosition += 10;

  reporte.pacientes.forEach((paciente, index) => {
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
private calcularProgresoModulos(reporte: ReporteGeneral): Array<{nombre: string, progreso: number}> {
  const modulosMap = new Map<string, number[]>();

  // Recopilar todos los progresos por módulo
  reporte.pacientes.forEach(paciente => {
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
}