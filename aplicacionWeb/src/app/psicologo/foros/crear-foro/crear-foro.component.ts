import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ForoService } from '../../../services/foro.service';

@Component({
  selector: 'app-crear-foro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './crear-foro.component.html',
  styleUrls: ['./crear-foro.component.css']
})
export class CrearForoComponent {
  foroForm: FormGroup;
  guardando = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private foroService: ForoService,
    private router: Router
  ) {
    this.foroForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      descripcion: ['', [Validators.maxLength(1000)]],
      publico: [true, Validators.required],
    });
  }

  crearForo(): void {
    if (this.foroForm.invalid) {
      this.foroForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.error = '';

    this.foroService.crearForo(this.foroForm.value).subscribe({
      next: (foro) => {
        alert('Foro creado exitosamente');
        this.router.navigate(['/foros', foro.id_foro]);
      },
      error: (e) => {
        this.error = e.error?.error || 'Error al crear el foro';
        this.guardando = false;
      },
    });
  }

  get titulo() { return this.foroForm.get('titulo'); }
  get descripcion() { return this.foroForm.get('descripcion'); }
}