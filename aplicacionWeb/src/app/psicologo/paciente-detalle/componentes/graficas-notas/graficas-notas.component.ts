
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestsDisponiblesComponent } from './componentes/tests-disponibles/tests-disponibles.component';
import { HistorialTestsComponent } from './componentes/historial-tests/historial-tests.component';
import { NotasPsicologoComponent } from './componentes/notas-psicologo/notas-psicologo.component';
import { Paciente } from '../../../../interfaces/paciente';

@Component({
  selector: 'app-graficas-notas',
  imports: [
    CommonModule,
    TestsDisponiblesComponent,
    HistorialTestsComponent,
    NotasPsicologoComponent
  ],
  templateUrl: './graficas-notas.component.html',
  styleUrls: ['./graficas-notas.component.css']
})
export class GraficasNotasComponent implements OnInit {
  @Input() idPaciente!: number;
  @Input() paciente!: Paciente; // ✅ NUEVO: Recibir datos completos del paciente

  // Control de las sub-secciones visibles
  seccionActiva: 'historial' | 'disponibles' | 'notas' = 'historial';

  constructor() {}

  ngOnInit(): void {
    console.log('Cargando gráficas y notas para paciente:', this.idPaciente);
  }

  /**
   * Cambiar la sección activa
   */
  cambiarSeccion(seccion: 'historial' | 'disponibles' | 'notas'): void {
    this.seccionActiva = seccion;
  }

  /**
   * Actualizar el historial cuando se aplica un nuevo test
   */
  onTestAplicado(): void {
    this.seccionActiva = 'historial';
  }
}