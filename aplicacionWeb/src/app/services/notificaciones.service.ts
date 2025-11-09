import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notificacion {
  id_notificacion: number;
  id_psicologo: number;
  tipo: 'chat' | 'actividad' | 'cita' | 'foro' | 'recordatorio' | 'sistema';
  titulo: string;
  mensaje: string;
  leida: boolean | number;
  id_relacionado?: number;
  enlace?: string;
  fecha_creacion: string;
  fecha_leida?: string;
  icono?: string; // Se calcula en el frontend
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  
  private apiUrl = `${environment.apiUrl}/api/psicologo`;
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  private countNoLeidasSubject = new BehaviorSubject<number>(0);
  
  public notificaciones$ = this.notificacionesSubject.asObservable();
  public countNoLeidas$ = this.countNoLeidasSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar notificaciones al iniciar
    this.cargarNotificaciones();
    
    // Actualizar cada 30 segundos
    interval(30000).subscribe(() => {
      this.cargarNotificaciones();
      this.cargarCountNoLeidas();
    });
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Cargar notificaciones desde el backend
   */
  cargarNotificaciones(limite: number = 10): void {
    this.http.get<Notificacion[]>(`${this.apiUrl}/notificaciones?limite=${limite}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (notificaciones) => {
        const notificacionesConIcono = notificaciones.map(n => ({
          ...n,
          leida: !!n.leida, // Convertir a boolean
          icono: this.obtenerIcono(n.tipo)
        }));
        this.notificacionesSubject.next(notificacionesConIcono);
        this.actualizarCountNoLeidas(notificacionesConIcono);
      },
      error: (error) => console.error('Error cargando notificaciones:', error)
    });
  }

  /**
   * Cargar cantidad de notificaciones no leídas
   */
  cargarCountNoLeidas(): void {
    this.http.get<{ count: number }>(`${this.apiUrl}/notificaciones/no-leidas/count`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        this.countNoLeidasSubject.next(response.count);
      },
      error: (error) => console.error('Error cargando count:', error)
    });
  }

  /**
   * Marcar notificación como leída
   */
  marcarComoLeida(id: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/notificaciones/${id}/marcar-leida`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Marcar todas como leídas
   */
  marcarTodasLeidas(): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/notificaciones/marcar-todas-leidas`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar notificación
   */
  eliminarNotificacion(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/notificaciones/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener notificaciones actuales
   */
  getNotificaciones(): Notificacion[] {
    return this.notificacionesSubject.value.slice(0, 5); // Solo las últimas 5
  }

  /**
   * Obtener número de no leídas
   */
  getNoLeidas(): number {
    return this.countNoLeidasSubject.value;
  }

  /**
   * Actualizar count de no leídas localmente
   */
  private actualizarCountNoLeidas(notificaciones: Notificacion[]): void {
    const count = notificaciones.filter(n => !n.leida).length;
    this.countNoLeidasSubject.next(count);
  }

  /**
   * Obtener icono según tipo
   */
  private obtenerIcono(tipo: string): string {
    const iconos: Record<string, string> = {
      'chat': 'bi-chat-dots',
      'actividad': 'bi-clipboard-check',
      'cita': 'bi-calendar3',
      'foro': 'bi-people',
      'recordatorio': 'bi-bell',
      'sistema': 'bi-info-circle'
    };
    return iconos[tipo] || 'bi-bell';
  }
}