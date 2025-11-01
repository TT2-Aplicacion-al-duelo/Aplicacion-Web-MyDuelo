import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Baneo,
  BanearUsuarioDTO,
  EstadisticasModeracion,
  VerificarBaneoResponse,
} from '../interfaces/moderacion';
import { environment } from '../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../interfaces/foro';

@Injectable({
  providedIn: 'root',
})
export class ModeracionService {
  private AppUrl: string;
  private APIUrl: string;

  constructor(private http: HttpClient) {
    this.AppUrl = environment.apiUrl;
    this.APIUrl = '/api/foros';
  }

  /**
   * Banear o silenciar a un usuario
   */
  banearUsuario(idForo: number, data: BanearUsuarioDTO): Observable<Baneo> {
    return this.http
      .post<ApiResponse<Baneo>>(`${this.AppUrl}${this.APIUrl}/${idForo}/moderar/banear`, data)
      .pipe(map((r) => r.data!));
  }

  /**
   * Levantar un baneo
   */
  levantarBaneo(idForo: number, idBaneo: number): Observable<Baneo> {
    return this.http
      .delete<ApiResponse<Baneo>>(`${this.AppUrl}${this.APIUrl}/${idForo}/moderar/banear/${idBaneo}`)
      .pipe(map((r) => r.data!));
  }

  /**
   * Listar baneos de un foro
   */
  listarBaneos(
    idForo: number,
    soloActivos: boolean = true,
    page: number = 1,
    limit: number = 20
  ): Observable<PaginatedResponse<Baneo>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('soloActivos', soloActivos.toString());

    return this.http
      .get<ApiResponse<PaginatedResponse<Baneo>>>(
        `${this.AppUrl}${this.APIUrl}/${idForo}/moderar/baneos`,
        { params }
      )
      .pipe(
        map((r) => {
          if (r.data && 'data' in r.data) {
            return { data: r.data.data, meta: r.data.meta };
          }
          return {
            data: (r.data as any) || [],
            meta: { total: 0, page, limit, totalPages: 0 },
          };
        })
      );
  }

  /**
   * Obtener estadísticas de moderación
   */
  obtenerEstadisticas(idForo: number): Observable<EstadisticasModeracion> {
    return this.http
      .get<ApiResponse<EstadisticasModeracion>>(
        `${this.AppUrl}${this.APIUrl}/${idForo}/moderar/estadisticas`
      )
      .pipe(map((r) => r.data!));
  }

  /**
   * Obtener historial de sanciones de un usuario
   */
  obtenerHistorialUsuario(
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number
  ): Observable<Baneo[]> {
    return this.http
      .get<ApiResponse<Baneo[]>>(
        `${this.AppUrl}/api/moderar/historial/${tipoUsuario}/${idUsuario}`
      )
      .pipe(map((r) => r.data!));
  }

  /**
   * Verificar si un usuario está baneado
   */
  verificarBaneo(
    idForo: number,
    tipoUsuario: 'psicologo' | 'paciente',
    idUsuario: number
  ): Observable<VerificarBaneoResponse> {
    return this.http
      .get<ApiResponse<VerificarBaneoResponse>>(
        `${this.AppUrl}/api/moderar/verificar/${idForo}/${tipoUsuario}/${idUsuario}`
      )
      .pipe(map((r) => r.data!));
  }

  /**
   * Calcular días restantes de un baneo
   */
  calcularDiasRestantes(fechaExpiracion?: Date): number | null {
    if (!fechaExpiracion) return null; // Baneo permanente

    const ahora = new Date().getTime();
    const expiracion = new Date(fechaExpiracion).getTime();
    const diferencia = expiracion - ahora;

    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Formatear texto de duración del baneo
   */
  formatearDuracionBaneo(fechaExpiracion?: Date): string {
    if (!fechaExpiracion) return 'Permanente';

    const dias = this.calcularDiasRestantes(fechaExpiracion);
    if (dias === null) return 'Permanente';
    if (dias <= 0) return 'Expirado';
    if (dias === 1) return '1 día restante';
    return `${dias} días restantes`;
  }

  /**
   * Obtener clase CSS según tipo de baneo
   */
  getClaseTipoBaneo(tipoBaneo: 'silencio' | 'baneo'): string {
    return tipoBaneo === 'silencio' ? 'badge bg-warning' : 'badge bg-danger';
  }

  /**
   * Obtener texto legible del tipo de baneo
   */
  getTextoTipoBaneo(tipoBaneo: 'silencio' | 'baneo'): string {
    return tipoBaneo === 'silencio' ? 'Silenciado' : 'Baneado';
  }
}