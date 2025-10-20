// aplicacionWeb/src/app/estaticos/activar-cuenta/activar-cuenta.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PsicologoService } from '../../services/psicologo.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-activar-cuenta',
  imports: [CommonModule, RouterModule],
  templateUrl: './activar-cuenta.component.html',
  styleUrls: ['./activar-cuenta.component.css']
})
export class ActivarCuentaComponent implements OnInit {
  loading: boolean = true;
  activacionExitosa: boolean = false;
  mensajeError: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private psicologoService: PsicologoService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    
    if (!token) {
      this.loading = false;
      this.mensajeError = 'Token de activación no válido';
      return;
    }

    this.activarCuenta(token);
  }

  activarCuenta(token: string): void {
    this.psicologoService.activarCuenta(token).subscribe({
      next: (response) => {
        this.loading = false;
        this.activacionExitosa = true;
        this.toastr.success('Cuenta activada exitosamente', 'Éxito');
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate(['/iniciar-sesion']);
        }, 3000);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.activacionExitosa = false;
        this.mensajeError = error.error?.msg || 'Error al activar la cuenta';
        this.toastr.error(this.mensajeError, 'Error');
      }
    });
  }
}