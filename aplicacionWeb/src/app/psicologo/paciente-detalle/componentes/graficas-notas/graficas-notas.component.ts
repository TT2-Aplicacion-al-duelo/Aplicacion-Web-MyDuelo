import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-graficas-notas',

  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Sección de Gráficas y Notas - En desarrollo
          </div>
          <p>ID del Paciente: {{ idPaciente }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class GraficasNotasComponent implements OnInit {
  @Input() idPaciente!: number;

  constructor() {}

  ngOnInit(): void {
    console.log('Cargando gráficas para paciente:', this.idPaciente);
  }
}