// aplicacionWeb/src/app/psicologo/paciente-detalle/componentes/graficas-notas/componentes/notas-psicologo/notas-psicologo.component.ts

import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//import { NotasService } from '../../../../../../services/notas.service';
//import { Nota } from '../../../../../../interfaces/nota';
import { ModalCrearNotaComponent } from '../modal-crear-nota/modal-crear-nota.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { Nota } from '../../../../../../interfaces/nota';
import { NotasService } from '../../../../../../services/notas.service';

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

  // Filtros
  filtroTipo: 'todas' | 'general' | 'test' = 'todas';
  busqueda: string = '';

  constructor(
    private notasService: NotasService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarNotas();
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
   * Abrir modal para crear nota
   */
  crearNota(): void {
    this.notaSeleccionada = null;
    this.modoEdicion = false;
    this.mostrarModal = true;
  }

  /**
   * Abrir modal para editar nota
   */
  editarNota(nota: Nota): void {
    this.notaSeleccionada = nota;
    this.modoEdicion = true;
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
    this.cargarNotas();
  }

  /**
   * Cerrar modal
   */
  cerrarModal(): void {
    this.mostrarModal = false;
    this.notaSeleccionada = null;
  }

  /**
   * Cambiar filtro de tipo
   */
  cambiarFiltroTipo(tipo: 'todas' | 'general' | 'test'): void {
    this.filtroTipo = tipo;
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