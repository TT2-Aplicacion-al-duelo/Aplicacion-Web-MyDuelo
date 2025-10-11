import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modulos-duelo',
  imports: [CommonModule],
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            Módulos de Duelo - En desarrollo
          </div>
          <p>ID del Paciente: {{ idPaciente }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ModulosDueloComponent implements OnInit {
  @Input() idPaciente!: number;

  constructor() {}

  ngOnInit(): void {
    console.log('Cargando módulos para paciente:', this.idPaciente);
  }
}