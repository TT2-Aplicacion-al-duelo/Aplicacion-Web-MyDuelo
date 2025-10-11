import { AppComponent } from './app.component';
import { InicioComponent } from './estaticos/inicio/inicio.component';
import { LoginComponent } from './estaticos/login/login.component';
import { DueloPerdidaComponent } from './estaticos/duelo-perdida/duelo-perdida.component';
import { ContactosApoyoComponent } from './estaticos/contactos-apoyo/contactos-apoyo.component';
import { RegistroComponent } from './estaticos/registro/registro.component';
import { AgendaCitasDashboardComponent } from './psicologo/agenda-citas-dashboard/agenda-citas-dashboard.component';
import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PacientesComponent } from './psicologo/pacientes/pacientes.component';
import { ChatComponent } from './psicologo/chat/chat.component';
import { PsicologosAdminComponent } from './admin/psicologos-admin/psicologos-admin.component';
import { PacientesAdminComponent } from './admin/pacientes-admin/pacientes-admin.component';
import { ChatAdminComponent } from './admin/chat-admin/chat-admin.component';
import { PacienteDetalleComponent } from './psicologo/paciente-detalle/paciente-detalle.component';

const canActivate: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/iniciar-sesion']);
  }
  return true;
};


export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'duelo-y-perdida', component: DueloPerdidaComponent },
  { path: 'contactos-de-apoyo', component: ContactosApoyoComponent },
  { path: 'iniciar-sesion', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'agenda', component: AgendaCitasDashboardComponent, canActivate: [canActivate] },
  { path: 'lista-pacientes-del-psicologo', component: PacientesComponent, canActivate: [canActivate] },
  { path: 'chat-pacientes-del-psicologo', component: ChatComponent, canActivate: [canActivate] },
  { path: 'admin/psicologos', component: PsicologosAdminComponent, canActivate: [canActivate] },
  { path: 'admin/pacientes', component: PacientesAdminComponent, canActivate: [canActivate] },
  { path: 'admin/chat', component: ChatAdminComponent, canActivate: [canActivate] },
  { path: 'paciente/:id', component: PacienteDetalleComponent, canActivate: [canActivate] 
  },
];


