import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';
import { Foro, Tema, Participante } from '../../../interfaces/foro';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-detalle-foro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-foro.component.html',
  styleUrls: ['./detalle-foro.component.css']
})
export class DetalleForoComponent implements OnInit {
  foro: Foro | null = null;
  temas: Tema[] = [];
  participantes: Participante[] = [];
  
  cargando = true;
  tabActiva: 'temas' | 'participantes' = 'temas';
  
  usuarioActual: any;
  esAdmin = false;
  esModerador = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private foroService: ForoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserInfo();
    const idForo = parseInt(this.route.snapshot.params['idForo']);
    this.cargarForo(idForo);
    this.cargarTemas(idForo);
    this.cargarParticipantes(idForo);
  }

  cargarForo(idForo: number): void {
    this.foroService.obtenerForo(idForo).subscribe({
      next: (foro) => {
        this.foro = foro;
        this.esAdmin = foro.rol_usuario === 'admin';
        this.esModerador = foro.rol_usuario === 'moderador' || this.esAdmin;
        this.cargando = false;
      },
      error: () => { this.router.navigate(['/foros']); }
    });
  }

  cargarTemas(idForo: number): void {
    this.foroService.listarTemas(idForo).subscribe({
      next: (r) => this.temas = r.data,
      error: (e) => console.error(e)
    });
  }

  cargarParticipantes(idForo: number): void {
    this.foroService.obtenerParticipantes(idForo).subscribe({
      next: (p) => this.participantes = p,
      error: (e) => console.error(e)
    });
  }

  verTema(tema: Tema): void {
    this.router.navigate(['/foros', this.foro!.id_foro, 'temas', tema.id_tema]);
  }

  crearTema(): void {
    const titulo = prompt('Título del tema:');
    if (!titulo) return;

    this.foroService.crearTema(this.foro!.id_foro, { titulo }).subscribe({
      next: () => { alert('Tema creado'); this.cargarTemas(this.foro!.id_foro); },
      error: () => alert('Error al crear tema')
    });
  }

  eliminarForo(): void {
    if (!confirm('¿Eliminar foro?')) return;
    this.foroService.eliminarForo(this.foro!.id_foro).subscribe({
      next: () => { alert('Foro eliminado'); this.router.navigate(['/foros']); },
      error: () => alert('Error')
    });
  }

  getBadgeRol(rol: string): string {
    return this.foroService.getBadgeRol(rol as any);
  }

  getTextoRol(rol: string): string {
    return this.foroService.getTextoRol(rol as any);
  }
}