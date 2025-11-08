import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  SolicitudUnion,
  LogModeracion,
  CrearSolicitudDTO,
  EditarMensajeDTO,
  ApiResponse,
  PaginatedResponse
} from '../interfaces/foro';

@Injectable({
  providedIn: 'root'
})
export class ModeracionAvanzadaService {
  private AppUrl: string;
  private APIUrl: string = '/api/foros';

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
  }

  // ========== GESTIÓN DE MENSAJES ==========

  eliminarMensaje(idForo: number, idMensaje: number): Observable<any> {
    return this.http.delete<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/mensajes/${idMensaje}`
    );
  }

  restaurarMensaje(idForo: number, idMensaje: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/mensajes/${idMensaje}/restaurar`,
      {}
    );
  }

  editarMensaje(idForo: number, idMensaje: number, data: EditarMensajeDTO): Observable<any> {
    return this.http.put<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/mensajes/${idMensaje}`,
      data
    );
  }

  // ========== GESTIÓN DE TEMAS ==========

  cerrarTema(idForo: number, idTema: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/temas/${idTema}/cerrar`,
      {}
    );
  }

  abrirTema(idForo: number, idTema: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/temas/${idTema}/abrir`,
      {}
    );
  }

  fijarTema(idForo: number, idTema: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/temas/${idTema}/fijar`,
      {}
    );
  }

  desfijarTema(idForo: number, idTema: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/temas/${idTema}/desfijar`,
      {}
    );
  }

  // ========== SOLICITUDES DE UNIÓN ==========

  crearSolicitud(idForo: number, data: CrearSolicitudDTO): Observable<SolicitudUnion> {
    return this.http.post<ApiResponse<SolicitudUnion>>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/solicitar-union`,
      data
    ).pipe(map(r => r.data!));
  }

  listarSolicitudes(idForo: number): Observable<SolicitudUnion[]> {
    return this.http.get<ApiResponse<SolicitudUnion[]>>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/solicitudes`
    ).pipe(map(r => r.data!));
  }

  aprobarSolicitud(idForo: number, idSolicitud: number): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/solicitudes/${idSolicitud}/aprobar`,
      {}
    );
  }

  rechazarSolicitud(idForo: number, idSolicitud: number, razon?: string): Observable<any> {
    return this.http.post<ApiResponse>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/solicitudes/${idSolicitud}/rechazar`,
      { razon }
    );
  }

  // ========== LOGS DE MODERACIÓN ==========

  obtenerLogs(
    idForo: number,
    filtros?: {
      tipo_accion?: string;
      id_moderador?: number;
      fecha_desde?: string;
      fecha_hasta?: string;
    },
    page: number = 1,
    limit: number = 50
  ): Observable<PaginatedResponse<LogModeracion>> {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (filtros?.tipo_accion) params = params.set('tipo_accion', filtros.tipo_accion);
    if (filtros?.id_moderador) params = params.set('id_moderador', filtros.id_moderador);
    if (filtros?.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros?.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);

    return this.http.get<ApiResponse<PaginatedResponse<LogModeracion>>>(
      `${this.AppUrl}${this.APIUrl}/${idForo}/logs`,
      { params }
    ).pipe(map(r => r.data!));
  }

  // ========== UTILIDADES ==========

  getTextoAccion(tipo: string): string {
    const textos: { [key: string]: string } = {
      eliminar_mensaje: 'Mensaje eliminado',
      restaurar_mensaje: 'Mensaje restaurado',
      editar_mensaje: 'Mensaje editado',
      cerrar_tema: 'Tema cerrado',
      abrir_tema: 'Tema abierto',
      fijar_tema: 'Tema fijado',
      desfijar_tema: 'Tema desfijado',
      banear_usuario: 'Usuario baneado',
      desbanear_usuario: 'Usuario desbaneado',
      aprobar_solicitud: 'Solicitud aprobada',
      rechazar_solicitud: 'Solicitud rechazada',
    };
    return textos[tipo] || tipo;
  }

  getIconoAccion(tipo: string): string {
    const iconos: { [key: string]: string } = {
      eliminar_mensaje: 'bi-trash',
      restaurar_mensaje: 'bi-arrow-counterclockwise',
      editar_mensaje: 'bi-pencil',
      cerrar_tema: 'bi-lock',
      abrir_tema: 'bi-unlock',
      fijar_tema: 'bi-pin-angle-fill',
      desfijar_tema: 'bi-pin-angle',
      banear_usuario: 'bi-person-slash',
      desbanear_usuario: 'bi-person-check',
      aprobar_solicitud: 'bi-check-circle',
      rechazar_solicitud: 'bi-x-circle',
    };
    return iconos[tipo] || 'bi-info-circle';
  }

  getClaseAccion(tipo: string): string {
    const clases: { [key: string]: string } = {
      eliminar_mensaje: 'text-danger',
      restaurar_mensaje: 'text-success',
      editar_mensaje: 'text-warning',
      cerrar_tema: 'text-danger',
      abrir_tema: 'text-success',
      fijar_tema: 'text-primary',
      desfijar_tema: 'text-secondary',
      banear_usuario: 'text-danger',
      desbanear_usuario: 'text-success',
      aprobar_solicitud: 'text-success',
      rechazar_solicitud: 'text-danger',
    };
    return clases[tipo] || 'text-muted';
  }
}