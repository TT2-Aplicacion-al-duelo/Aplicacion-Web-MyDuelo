// aplicacionWeb/src/app/app.routes.ts
import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

// Componentes Estáticos
import { InicioComponent } from './estaticos/inicio/inicio.component';
import { LoginComponent } from './estaticos/login/login.component';
import { RegistroComponent } from './estaticos/registro/registro.component';
import { ActivarCuentaComponent } from './estaticos/activar-cuenta/activar-cuenta.component';
import { RestablecerContrasenaComponent } from './estaticos/restablecer-contrasena/restablecer-contrasena.component';
import { DueloPerdidaComponent } from './estaticos/duelo-perdida/duelo-perdida.component';
import { ContactosApoyoComponent } from './estaticos/contactos-apoyo/contactos-apoyo.component';

// Componentes de Psicólogo
import { AgendaCitasDashboardComponent } from './psicologo/agenda-citas-dashboard/agenda-citas-dashboard.component';
import { PacientesComponent } from './psicologo/pacientes/pacientes.component';
import { ChatComponent } from './psicologo/chat/chat.component';
import { PacienteDetalleComponent } from './psicologo/paciente-detalle/paciente-detalle.component';
import { ActividadesGlobalesComponent } from './psicologo/paciente-detalle/componentes/actividades-globales/actividades-globales.component';
import { ConfiguracionPerfilComponent } from './compartidos/configuracion-perfil/configuracion-perfil.component';

// Componentes de Admin
import { PsicologosAdminComponent } from './admin/psicologos-admin/psicologos-admin.component';
import { PacientesAdminComponent } from './admin/pacientes-admin/pacientes-admin.component';
import { ChatAdminComponent } from './admin/chat-admin/chat-admin.component';

// Importar componentes de foros
import { foroAuthGuard, psicologoGuard } from './utils/foro.guard';
import { ListaForosComponent } from './psicologo/foros/lista-foro/lista-foro.component';
import { CrearForoComponent } from './psicologo/foros/crear-foro/crear-foro.component';
import { InvitacionesComponent } from './psicologo/foros/invitaciones/invitaciones.component';
import { DetalleForoComponent } from './psicologo/foros/detalle-foro/detalle-foro.component';
import { TemaForoComponent } from './psicologo/foros/tema-foro/tema-foro.component';
import { SolicitudesForoComponent } from './psicologo/foros/solicitudes-foro/solicitudes-foro.component';
import { LogsModeracionComponent } from './psicologo/foros/logs-moderacion/logs-moderacion.component';
import { PerfilComponent } from './compartidos/perfil/perfil.component';

// Guard de Autenticación
const canActivate: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/iniciar-sesion']);
  }
  return true;
};

// Guard de Administrador
const canActivateAdmin: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/iniciar-sesion']);
  }

  if (!auth.isAdmin()) {
    return router.createUrlTree(['/agenda']);
  }

  return true;
};

export const routes: Routes = [
  // Rutas Públicas
  { path: '', component: InicioComponent },
  { path: 'duelo-y-perdida', component: DueloPerdidaComponent },
  { path: 'contactos-de-apoyo', component: ContactosApoyoComponent },
  { path: 'iniciar-sesion', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'activar-cuenta/:token', component: ActivarCuentaComponent },
  { path: 'restablecer-contrasena/:token', component: RestablecerContrasenaComponent },

  // Rutas de Psicólogo (Protegidas)
  { 
    path: 'agenda', 
    component: AgendaCitasDashboardComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'lista-pacientes-del-psicologo', 
    component: PacientesComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'chat-pacientes-del-psicologo', 
    component: ChatComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'paciente/:id', 
    component: PacienteDetalleComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'actividades-globales', 
    component: ActividadesGlobalesComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'configuracion-perfil', 
    component: ConfiguracionPerfilComponent, 
    canActivate: [canActivate] 
  },
  { 
    path: 'perfil', 
    component: PerfilComponent, 
    canActivate: [canActivate] 
  },

  // ⚠️ IMPORTANTE: Rutas de Foros ANTES del wildcard
  {
    path: 'foros',
    children: [
      { 
        path: '', 
        component: ListaForosComponent,
       
      },
      { 
        path: 'crear', 
        component: CrearForoComponent, 
        canActivate: [psicologoGuard] 
      },
      { 
        path: 'invitaciones', 
        component: InvitacionesComponent, 
        canActivate: [psicologoGuard] 
      },
      { 
        path: ':idForo', 
        component: DetalleForoComponent, 
        canActivate: [foroAuthGuard] 
      },
      { 
        path: ':idForo/temas/:idTema', 
        component: TemaForoComponent, 
        canActivate: [foroAuthGuard] 
      },
      { 
        path: ':idForo/solicitudes',  // ✅ CORRECTO
        component: SolicitudesForoComponent, 
        canActivate: [psicologoGuard] 
      },
      { 
        path: ':idForo/logs',  // ✅ CORRECTO
        component: LogsModeracionComponent, 
        canActivate: [psicologoGuard] 
      },
    ]
  },

  // Rutas de Admin (Protegidas y requieren rol admin)
  { 
    path: 'admin/psicologos', 
    component: PsicologosAdminComponent, 
    canActivate: [canActivateAdmin] 
  },
  { 
    path: 'admin/pacientes', 
    component: PacientesAdminComponent, 
    canActivate: [canActivateAdmin] 
  },
  { 
    path: 'admin/chat', 
    component: ChatAdminComponent, 
    canActivate: [canActivateAdmin] 
  },
  { 
    path: 'admin/configuracion', 
    component: ConfiguracionPerfilComponent, 
    canActivate: [canActivate] 
  },{ 
    path: 'admin/perfil', 
    component: PerfilComponent, 
    canActivate: [canActivate] 
  },

  // ⚠️ Ruta 404 - DEBE SER LA ÚLTIMA
  { path: '**', redirectTo: '' }
];