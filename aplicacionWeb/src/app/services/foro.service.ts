// aplicacionWeb/src/app/services/foro.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
  Foro, Tema, Mensaje, Participante, Invitacion,
  CreateForoDTO, CreateTemaDTO, CreateMensajeDTO,
  InvitarModeradorDTO, ResponderInvitacionDTO,
  PaginatedResponse, ApiResponse,
} from '../interfaces/foro';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ForoService {
  private AppUrl: string;
  private APIUrl: string;
  
  private invitacionesPendientesSubject = new BehaviorSubject<number>(0);
  public invitacionesPendientes$ = this.invitacionesPendientesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = '/api/foros';
    
    const usuario = this.getUsuarioActual();
    if (usuario?.tipo === 'psicologo') {
      this.cargarContadorInvitaciones();
    }
  }
  
  private getUsuarioActual(): any {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id_psicologo || payload.id_paciente || payload.sub,
        tipo: payload.id_psicologo ? 'psicologo' : 'paciente',
        nombre: payload.nombre,
      };
    } catch { 
      return null; 
    }
  }

  // FOROS
  listarForos(params?: any): Observable<PaginatedResponse<Foro>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<ApiResponse<PaginatedResponse<Foro>>>(`${this.AppUrl}${this.APIUrl}`, { params: httpParams })
      .pipe(
        map(r => {
          // Si la respuesta tiene data con estructura paginada
          if (r.data && 'data' in r.data) {
            return { data: r.data.data, meta: r.data.meta };
          }
          // Si la respuesta es directamente un array (no paginado)
          return { 
            data: r.data as any || [], 
            meta: { total: 0, page: 1, limit: 10, totalPages: 0 } 
          };
        })
      );
  }

  obtenerForo(idForo: number): Observable<Foro> {
    // Validar que idForo es un número válido
    if (!idForo || isNaN(idForo)) {
      throw new Error('ID de foro inválido');
    }
    return this.http.get<ApiResponse<Foro>>(`${this.AppUrl}${this.APIUrl}/${idForo}`)
      .pipe(map(r => r.data!));
  }

  crearForo(data: CreateForoDTO): Observable<Foro> {
    return this.http.post<ApiResponse<Foro>>(`${this.AppUrl}${this.APIUrl}`, data)
      .pipe(map(r => r.data!));
  }

  actualizarForo(idForo: number, data: Partial<CreateForoDTO>): Observable<Foro> {
    return this.http.put<ApiResponse<Foro>>(`${this.AppUrl}${this.APIUrl}/${idForo}`, data)
      .pipe(map(r => r.data!));
  }

  eliminarForo(idForo: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.AppUrl}${this.APIUrl}/${idForo}`)
      .pipe(map(() => undefined));
  }

  obtenerParticipantes(idForo: number): Observable<Participante[]> {
    return this.http.get<ApiResponse<Participante[]>>(`${this.AppUrl}${this.APIUrl}/${idForo}/participantes`)
      .pipe(map(r => r.data!));
  }

  unirseAForo(idForo: number): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.AppUrl}${this.APIUrl}/${idForo}/unirse`, {})
      .pipe(map(r => r.data));
  }

  // INVITACIONES - CORREGIDO LA URL
  invitarModerador(idForo: number, data: InvitarModeradorDTO): Observable<Invitacion> {
    return this.http.post<ApiResponse<Invitacion>>(`${this.AppUrl}${this.APIUrl}/${idForo}/invitar`, data)
      .pipe(map(r => r.data!));
  }

  listarInvitaciones(estado?: string): Observable<Invitacion[]> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    // ✅ URL CORREGIDA: Agregamos /api/foros antes de /invitaciones
    return this.http.get<ApiResponse<Invitacion[]>>(`${this.AppUrl}${this.APIUrl}/invitaciones/mis-invitaciones`, { params })
      .pipe(
        map(r => r.data || []),
        tap(invs => {
          if (!estado || estado === 'pendiente') {
            const p = invs.filter(i => i.estado === 'pendiente').length;
            this.invitacionesPendientesSubject.next(p);
          }
        })
      );
  }

  responderInvitacion(idInvitacion: number, data: ResponderInvitacionDTO): Observable<void> {
    // ✅ URL CORREGIDA
    return this.http.post<ApiResponse<void>>(`${this.AppUrl}${this.APIUrl}/invitaciones/${idInvitacion}/responder`, data)
      .pipe(
        map(() => undefined), 
        tap(() => this.cargarContadorInvitaciones())
      );
  }

  private cargarContadorInvitaciones(): void {
    this.listarInvitaciones('pendiente').subscribe({
      next: invs => this.invitacionesPendientesSubject.next(invs.length),
      error: () => this.invitacionesPendientesSubject.next(0),
    });
  }

  // TEMAS
  listarTemas(idForo: number, page = 1, limit = 20): Observable<PaginatedResponse<Tema>> {
    // Validar que idForo es válido
    if (!idForo || isNaN(idForo)) {
      throw new Error('ID de foro inválido');
    }
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedResponse<Tema>>>(`${this.AppUrl}${this.APIUrl}/${idForo}/temas`, { params })
      .pipe(
        map(r => {
          if (r.data && 'data' in r.data) {
            return { data: r.data.data, meta: r.data.meta };
          }
          return { 
            data: r.data as any || [], 
            meta: { total: 0, page, limit, totalPages: 0 } 
          };
        })
      );
  }

  crearTema(idForo: number, data: CreateTemaDTO): Observable<Tema> {
    return this.http.post<ApiResponse<Tema>>(`${this.AppUrl}${this.APIUrl}/${idForo}/temas`, data)
      .pipe(map(r => r.data!));
  }

  // MENSAJES
  listarMensajes(idTema: number, page = 1, limit = 50): Observable<PaginatedResponse<Mensaje>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    // ✅ URL CORREGIDA: /api/foros/temas en lugar de solo /temas
    return this.http.get<ApiResponse<PaginatedResponse<Mensaje>>>(`${this.AppUrl}${this.APIUrl}/temas/${idTema}/mensajes`, { params })
      .pipe(
        map(r => {
          if (r.data && 'data' in r.data) {
            return { data: r.data.data, meta: r.data.meta };
          }
          return { 
            data: r.data as any || [], 
            meta: { total: 0, page, limit, totalPages: 0 } 
          };
        })
      );
  }

  crearMensaje(idTema: number, data: CreateMensajeDTO): Observable<Mensaje> {
    return this.http.post<ApiResponse<Mensaje>>(`${this.AppUrl}${this.APIUrl}/temas/${idTema}/mensajes`, data)
      .pipe(map(r => r.data!));
  }

  // UTILS
  tienePermiso(foro: Foro, permiso: 'admin' | 'moderador' | 'miembro'): boolean {
    if (!foro.rol_usuario) return false;
    const j = { admin: 3, moderador: 2, miembro: 1 };
    return j[foro.rol_usuario] >= j[permiso];
  }

  getBadgeRol(rol: 'admin' | 'moderador' | 'miembro'): string {
    return { 
      admin: 'badge bg-danger', 
      moderador: 'badge bg-warning text-dark', 
      miembro: 'badge bg-info text-dark' 
    }[rol] || 'badge bg-secondary';
  }

  getTextoRol(rol: 'admin' | 'moderador' | 'miembro'): string {
    return { 
      admin: 'Administrador', 
      moderador: 'Moderador', 
      miembro: 'Miembro' 
    }[rol] || 'Usuario';
  }
}