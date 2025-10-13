import { Component } from '@angular/core';
import { PsicologoService } from '../../services/psicologo.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { LoadingComponent } from "../../compartidos/loading/loading.component";
import { FormsModule } from "@angular/forms";
import { Psicologo } from '../../interfaces/piscologo';
import { Token } from '@angular/compiler';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorService } from '../../services/error.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [LoadingComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  logoPath: string = '/imagenes/branding/logo.png'; 

  correo: string = '';
  contrasena: string = '';
  loading: boolean = false;

  constructor(
    private _psicologoService: PsicologoService,
    private toastr: ToastrService,
    private router: Router,
    private _errorServices: ErrorService,
    private _authService: AuthService
  ){ }

  iniciarSeccion(){
    console.log('el correo es ${this.correo}' );
    
    if (this.correo == '' || this.contrasena == ''){
      this.toastr.error("Todos los campos son obligatorios", "Error");
    }

    const psicologo: Psicologo ={
      correo: this.correo,
      contrasena: this.contrasena
    }

    this.loading = true;

    this._psicologoService.iniciarSesion(psicologo).subscribe({
      next: (response: any) =>{
        const token = response.token;
        this._authService.setToken(token);
        console.log(token);
        this.loading= false
        this.toastr.success("", "Bienvenido");
        // this.router.navigate(['/agenda']);
        if (response.usuario.rol_admin) {
          this.router.navigate(['/admin/psicologos']); // 👈 CAMBIO AQUÍ
        } else {
          this.router.navigate(['/agenda']);
        }
        
      }, error: (event: HttpErrorResponse) =>{
        this.loading = false;
        this._errorServices.mensajeError(event);
      }
      
    })

  }

}
