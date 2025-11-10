// aplicacionWeb/src/app/compartidos/footer/footer.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  tipoUsuario: 'visitante' | 'psicologo' | 'paciente' | 'admin' = 'visitante';
  emailSoporte: string = 'soporte_tecnico@midueloapp.com';
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.detectarTipoUsuario();
  }

  detectarTipoUsuario(): void {
    if (!this.authService.isAuthenticated()) {
      this.tipoUsuario = 'visitante';
      return;
    }

    if (this.authService.isAdmin()) {
      this.tipoUsuario = 'admin';
    } else if (this.authService.isPsicologo()) {
      this.tipoUsuario = 'psicologo';
    } else {
      this.tipoUsuario = 'visitante';
    }
  }

  getEnlaces() {
    const enlacesComunes = [
      { ruta: '/acerca-de', texto: 'Acerca de Mi Duelo' },
      { ruta: '/ayuda', texto: 'Ayuda' },
      { ruta: '/terminos', texto: 'Términos y Condiciones' },
      { ruta: '/privacidad', texto: 'Aviso de Privacidad' }
    ];

    const enlacesPorTipo: any = {
      visitante: [
        { ruta: '/iniciar-sesion', texto: 'Iniciar Sesión' },
        { ruta: '/registro', texto: 'Registro' },
        ...enlacesComunes
      ],
      psicologo: [
        { ruta: '/psicologo/agenda', texto: 'Mi Agenda' },
        { ruta: '/psicologo/pacientes', texto: 'Mis Pacientes' },
        ...enlacesComunes
      ],
      paciente: [
        { ruta: '/paciente/dashboard', texto: 'Mi Panel' },
        { ruta: '/paciente/actividades', texto: 'Mis Actividades' },
        ...enlacesComunes
      ],
      admin: [
        { ruta: '/admin/dashboard', texto: 'Panel Admin' },
        { ruta: '/admin/psicologos', texto: 'Gestión' },
        ...enlacesComunes
      ]
    };

    return enlacesPorTipo[this.tipoUsuario] || enlacesComunes;
  }
}