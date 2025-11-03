// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/graficas-notas/componentes/notas-psicologo/notas-psicologo.component.ts
// ✅ CORREGIDO: Cambiado tipo de null a undefined para compatibilidad

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalCrearNotaComponent } from '../modal-crear-nota/modal-crear-nota.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Nota } from '../../../../../../interfaces/nota';
import { NotasService } from '../../../../../../services/notas.service';
import { TestsService } from '../../../../../../services/tests.service';
import { AplicacionTest } from '../../../../../../interfaces/test';

@Component({
  selector: 'app-notas-psicologo',
  imports: [CommonModule, FormsModule, ModalCrearNotaComponent],
  templateUrl: './notas-psicologo.component.html',
  styleUrls: ['./notas-psicologo.component.css']
})
export class NotasPsicologoComponent implements OnInit {
  @Input() idPaciente!: number;

  notas: Nota[] = [];
  notaSeleccionada: Nota | null = null;
  
  cargando: boolean = false;
  mostrarModal: boolean = false;
  modoEdicion: boolean = false;

  // ✅ CORREGIDO: Cambiar de null a undefined
  testsAplicados: AplicacionTest[] = [];
  idAplicacionParaNota?: number; // Usar undefined en lugar de null

  // Filtros
  filtroTipo: 'todas' | 'general' | 'test' = 'todas';
  busqueda: string = '';

  constructor(
    private notasService: NotasService,
    private testsService: TestsService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarNotas();
    this.cargarTestsAplicados();
  }

  /**
   * Cargar notas del paciente
   */
  cargarNotas(): void {
    this.cargando = true;
    this.notasService.getNotasPaciente(this.idPaciente).subscribe({
      next: (notas) => {
        this.notas = notas.sort((a, b) => 
          new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
        );
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar notas:', error);
        this.toastr.error('Error al cargar las notas');
        this.cargando = false;
      }
    });
  }

  /**
   * Cargar tests aplicados al paciente
   */
  cargarTestsAplicados(): void {
    this.testsService.getHistorialTests(this.idPaciente).subscribe({
      next: (tests) => {
        // Solo tests completados
        this.testsAplicados = tests.filter(t => t.estado === 'completado');
      },
      error: (error) => {
        console.error('Error al cargar tests:', error);
      }
    });
  }

  /**
   * Abrir modal para crear nota
   */
  crearNota(): void {
    this.notaSeleccionada = null;
    this.modoEdicion = false;
    this.idAplicacionParaNota = undefined; // ✅ CORREGIDO: Usar undefined
    this.mostrarModal = true;
  }

  /**
   * Crear nota vinculada a un test específico
   */
  crearNotaConTest(idAplicacion: number): void {
    this.notaSeleccionada = null;
    this.modoEdicion = false;
    this.idAplicacionParaNota = idAplicacion;
    this.mostrarModal = true;
  }

  /**
   * Abrir modal para editar nota
   */
  editarNota(nota: Nota): void {
    this.notaSeleccionada = nota;
    this.modoEdicion = true;
    this.idAplicacionParaNota = nota.id_aplicacion; // Ya es number | undefined
    this.mostrarModal = true;
  }

  /**
   * Eliminar nota
   */
  eliminarNota(nota: Nota): void {
    Swal.fire({
      title: '¿Eliminar nota?',
      text: `¿Estás seguro de eliminar la nota "${nota.titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmarEliminarNota(nota);
      }
    });
  }

  /**
   * Confirmar eliminación de nota
   */
  private confirmarEliminarNota(nota: Nota): void {
    this.notasService.eliminarNota(nota.id_nota).subscribe({
      next: () => {
        this.toastr.success('Nota eliminada exitosamente');
        this.cargarNotas();
      },
      error: (error) => {
        console.error('Error al eliminar nota:', error);
        this.toastr.error('Error al eliminar la nota');
      }
    });
  }

  /**
   * Evento cuando se guarda/actualiza una nota
   */
  onNotaGuardada(): void {
    this.mostrarModal = false;
    this.notaSeleccionada = null;
    this.idAplicacionParaNota = undefined; // ✅ CORREGIDO: Usar undefined
    this.cargarNotas();
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.mostrarModal = false;
    this.notaSeleccionada = null;
    this.idAplicacionParaNota = undefined; // ✅ CORREGIDO: Usar undefined
  }

  /**
   * Cambiar filtro de tipo
   */
  cambiarFiltroTipo(tipo: 'todas' | 'general' | 'test'): void {
    this.filtroTipo = tipo;
  }

  /**
   * Obtener información del test asociado a una nota
   */
  getTestAsociado(nota: Nota): AplicacionTest | undefined {
    if (!nota.id_aplicacion) return undefined;
    return this.testsAplicados.find(t => t.id_aplicacion === nota.id_aplicacion);
  }

  /**
   * Obtener notas filtradas
   */
  get notasFiltradas(): Nota[] {
    let notasFiltradas = [...this.notas];

    // Filtro por tipo
    if (this.filtroTipo !== 'todas') {
      notasFiltradas = notasFiltradas.filter(nota => nota.tipo === this.filtroTipo);
    }

    // Filtro por búsqueda
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      notasFiltradas = notasFiltradas.filter(nota =>
        nota.titulo.toLowerCase().includes(busquedaLower) ||
        nota.contenido.toLowerCase().includes(busquedaLower)
      );
    }

    return notasFiltradas;
  }

  /**
   * Obtener icono según tipo de nota
   */
  getIconoTipo(tipo: string): string {
    return tipo === 'test' ? 'bi-clipboard-data' : 'bi-journal-text';
  }

  /**
   * Obtener color según tipo de nota
   */
  getColorTipo(tipo: string): string {
    return tipo === 'test' ? 'primary' : 'success';
  }
}