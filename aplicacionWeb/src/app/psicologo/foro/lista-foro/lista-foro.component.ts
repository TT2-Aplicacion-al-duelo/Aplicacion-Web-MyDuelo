import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Foro, PaginationMeta } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-lista-foros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-foro.component.html',
  styleUrls: ['./lista-foro.component.css']
})
export class ListaForosComponent implements OnInit {
  foros: Foro[] = [];
  forosCargando = false;
  errorCarga = '';

  paginacion: PaginationMeta = { total: 0, page: 1, limit: 12, totalPages: 0 };
  filtros = { buscar: '', publico: true, ordenar: 'recientes' as 'recientes' | 'antiguos' };

  usuarioActual: any;
  esPsicologo = false;

  constructor(
    private foroService: ForoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserInfo();
    this.esPsicologo = !!this.usuarioActual?.id_psicologo;
    this.cargarForos();
  }

  cargarForos(): void {
    this.forosCargando = true;
    this.errorCarga = '';

    this.foroService.listarForos({
      ...this.filtros,
      page: this.paginacion.page,
      limit: this.paginacion.limit,
    }).subscribe({
      next: (response) => {
        this.foros = response.data;
        this.paginacion = response.meta;
        this.forosCargando = false;
      },
      error: () => {
        this.errorCarga = 'No se pudieron cargar los foros';
        this.forosCargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    this.paginacion.page = 1;
    this.cargarForos();
  }

  cambiarPagina(nueva: number): void {
    if (nueva >= 1 && nueva <= this.paginacion.totalPages) {
      this.paginacion.page = nueva;
      this.cargarForos();
    }
  }

  verDetalles(foro: Foro): void {
    this.router.navigate(['/foros', foro.id_foro]);
  }

  irACrearForo(): void {
    this.router.navigate(['/foros/crear']);
  }

  unirseAForo(foro: Foro, event: Event): void {
    event.stopPropagation();
    if (this.esPsicologo) {
      alert('Los psicólogos no pueden unirse a foros');
      return;
    }

    if (confirm(`¿Deseas unirte al foro "${foro.titulo}"?`)) {
      this.foroService.unirseAForo(foro.id_foro).subscribe({
        next: () => { alert('Te has unido al foro'); this.cargarForos(); },
        error: (e) => alert(e.error?.error || 'Error al unirse'),
      });
    }
  }

  getBadgeRol(rol: string): string {
    return this.foroService.getBadgeRol(rol as any);
  }

  getTextoRol(rol: string): string {
    return this.foroService.getTextoRol(rol as any);
  }
}