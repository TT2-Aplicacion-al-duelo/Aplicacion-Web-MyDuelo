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
      console.log('❌ No hay foto_perfil');
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
    
    console.log('🔨 URL construida:', urlFinal);
    
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
  private generarPDFReporte(reporte: ReporteGeneral): void {
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
    doc.text('📊 Resumen Global', 14, yPosition);
    
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

    // ==================== DETALLES POR PACIENTE ====================
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 204);
    doc.text('👥 Detalles por Paciente', 14, yPosition);
    
    yPosition += 10;

    reporte.pacientes.forEach((paciente, index) => {
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
}