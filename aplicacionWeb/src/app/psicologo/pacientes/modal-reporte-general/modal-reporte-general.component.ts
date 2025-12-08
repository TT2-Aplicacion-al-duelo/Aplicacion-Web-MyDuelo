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
  descargarPDF(): void {
    if (!this.reporte) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
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

    // ==================== DETALLES POR PACIENTE ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('👥 Detalles por Paciente', 14, yPosition);
    
    yPosition += 10;

    this.reporte.pacientes.forEach((paciente: ResumenPaciente, index: number) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Nombre del paciente
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text(`${index + 1}. ${paciente.nombre_completo}`, 14, yPosition);
      
      yPosition += 8;

      // Información básica
      const infoPaciente = [
        ['Email', paciente.email],
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

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    });

    // ==================== GUARDAR PDF ====================
    const nombreArchivo = `Reporte_General_Pacientes_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nombreArchivo);
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