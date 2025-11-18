import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModeracionAvanzadaService } from '../../../services/moderacion-avanzada.service';
import { LogModeracion } from '../../../interfaces/foro';

@Component({
  selector: 'app-logs-moderacion',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './logs-moderacion.component.html',
  styleUrls: ['./logs-moderacion.component.css']
})
export class LogsModeracionComponent implements OnInit {
  logs: LogModeracion[] = [];
  cargando = true;
  idForo!: number;
  
  // Paginación
  page = 1;
  limit = 20;
  totalPages = 0;
  total = 0;

  // Filtros
  filtros = {
    tipo_accion: '',
    fecha_desde: '',
    fecha_hasta: ''
  };

  tiposAccion = [
    { value: '', label: 'Todas las acciones' },
    { value: 'eliminar_mensaje', label: 'Eliminar mensaje' },
    { value: 'restaurar_mensaje', label: 'Restaurar mensaje' },
    { value: 'editar_mensaje', label: 'Editar mensaje' },
    { value: 'cerrar_tema', label: 'Cerrar tema' },
    { value: 'abrir_tema', label: 'Abrir tema' },
    { value: 'fijar_tema', label: 'Fijar tema' },
    { value: 'desfijar_tema', label: 'Desfijar tema' },
    { value: 'banear_usuario', label: 'Banear usuario' },
    { value: 'desbanear_usuario', label: 'Desbanear usuario' },
    { value: 'aprobar_solicitud', label: 'Aprobar solicitud' },
    { value: 'rechazar_solicitud', label: 'Rechazar solicitud' }
  ];

  constructor(
    private route: ActivatedRoute,
    public moderacionService: ModeracionAvanzadaService
  ) {}

  ngOnInit(): void {
    this.idForo = parseInt(this.route.snapshot.params['idForo']);
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.cargando = true;
    
    const filtrosAplicados: any = {};
    if (this.filtros.tipo_accion) filtrosAplicados.tipo_accion = this.filtros.tipo_accion;
    if (this.filtros.fecha_desde) filtrosAplicados.fecha_desde = this.filtros.fecha_desde;
    if (this.filtros.fecha_hasta) filtrosAplicados.fecha_hasta = this.filtros.fecha_hasta;

    this.moderacionService.obtenerLogs(this.idForo, filtrosAplicados, this.page, this.limit)
      .subscribe({
        next: (response) => {
          // ✅ VALIDACIÓN NULL-SAFE
          this.logs = response?.data || [];
          this.total = response?.meta?.total || 0;
          this.totalPages = response?.meta?.totalPages || 0;
          this.cargando = false;
          
          console.log('✅ Logs cargados:', {
            cantidad: this.logs.length,
            total: this.total,
            paginas: this.totalPages
          });
        },
        error: (err) => {
          console.error('❌ Error al cargar logs:', err);
          this.logs = [];  // ✅ ASEGURAR ARRAY VACÍO
          this.total = 0;
          this.totalPages = 0;
          this.cargando = false;
        }
      });
  }

  aplicarFiltros(): void {
    this.page = 1;
    this.cargarLogs();
  }

  limpiarFiltros(): void {
    this.filtros = {
      tipo_accion: '',
      fecha_desde: '',
      fecha_hasta: ''
    };
    this.page = 1;
    this.cargarLogs();
  }

  cambiarPagina(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.cargarLogs();
    }
  }

  exportarCSV(): void {
    const headers = ['Fecha', 'Acción', 'Tipo', 'ID Objetivo', 'Moderador'];
    const rows = this.logs.map(log => [
      new Date(log.fecha_accion).toLocaleString(),
      this.moderacionService.getTextoAccion(log.tipo_accion),
      log.tipo_objetivo,
      log.id_objetivo,
      log.moderador ? `${log.moderador.nombre} ${log.moderador.apellido}` : 'N/A'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_moderacion_foro_${this.idForo}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}