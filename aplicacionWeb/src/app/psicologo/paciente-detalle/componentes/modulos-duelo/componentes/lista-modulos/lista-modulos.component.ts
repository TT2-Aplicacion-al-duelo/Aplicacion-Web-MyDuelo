// sub-componentes/lista-modulos/lista-modulos.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarjetaModuloComponent } from '../tarjeta-modulo/tarjeta-modulo.component';
import { ModuloDuelo } from '../../../../../../interfaces/moduloDuelo';


@Component({
  selector: 'app-lista-modulos',
  standalone: true,
  imports: [CommonModule, TarjetaModuloComponent],
  templateUrl: './lista-modulos.component.html',
  styleUrls: ['./lista-modulos.component.css']
})
export class ListaModulosComponent {
  @Input() modulos: ModuloDuelo[] = [];
  @Input() idPaciente!: number;
  @Output() moduloActualizado = new EventEmitter<void>();

  // Mapeo de colores por etapa
  coloresEtapas: Record<string, string> = {
    'Negación': 'primary',
    'Ira': 'danger',
    'Negociación': 'warning',
    'Depresión': 'info',
    'Aceptación': 'success'
  };

  // Mapeo de iconos por etapa
  iconosEtapas: Record<string, string> = {
    'Negación': 'bi-shield-x',
    'Ira': 'bi-fire',
    'Negociación': 'bi-arrow-left-right',
    'Depresión': 'bi-cloud-rain',
    'Aceptación': 'bi-check-circle'
  };

  obtenerColorEtapa(etapa: string): string {
    return this.coloresEtapas[etapa] || 'secondary';
  }

  obtenerIconoEtapa(etapa: string): string {
    return this.iconosEtapas[etapa] || 'bi-circle';
  }

  onModuloActualizado(): void {
    this.moduloActualizado.emit();
  }

  calcularActividadesCompletadas(): number {
    return this.modulos.reduce((total, modulo) => 
      total + modulo.actividades_completadas, 0
    );
  }

  calcularActividadesEnProceso(): number {
    return this.modulos.reduce((total, modulo) => 
      total + modulo.actividades.filter(act => act.estado === 'en_proceso').length, 0
    );
  }

  calcularModulosCompletados(): number {
    return this.modulos.filter(modulo => modulo.progreso === 100).length;
  }
}