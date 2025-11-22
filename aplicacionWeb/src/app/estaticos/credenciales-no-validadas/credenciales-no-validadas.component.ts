import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-credenciales-no-validadas',
  imports: [CommonModule],
  templateUrl: './credenciales-no-validadas.component.html',
  styleUrls: ['./credenciales-no-validadas.component.css']
})
export class CredencialesNoValidadasComponent implements OnInit {
  usuario: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener datos del usuario del localStorage temporal
    const usuarioTemp = localStorage.getItem('usuario_pendiente');
    if (usuarioTemp) {
      this.usuario = JSON.parse(usuarioTemp);
    } else {
      // Si no hay datos, redirigir al login
      this.router.navigate(['/iniciar-sesion']);
    }
  }

  cerrarSesion(): void {
    // Limpiar datos temporales
    localStorage.removeItem('usuario_pendiente');
    this.authService.logout();
  }
}