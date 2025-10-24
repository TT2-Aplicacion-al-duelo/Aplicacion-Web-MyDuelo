import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addDays, startOfWeek, format } from 'date-fns';
import { PacientesService } from '../../services/pacientes.service';
import { AgendaService } from '../../services/agenda.service';
import { es } from 'date-fns/locale';
import { Evento } from '../../interfaces/evento';
import { AuthService } from '../../services/auth.service';
import {DisponibilidadItem} from '../../interfaces/disponibilidadItem';

/// por mejorar 
  /* 
    HAY UN DETALLE AL CREAR UNA CITA PARA LA SIGUIENTE SEMANA 
     ES QUE NO LO GENERA YA QUE LA AGENDA SEMANAL NO ESTA CREADA PERO 
     AL MODIFICARLA Y CAMBIARLA SI LA GENERA
     2. AL CREAR LA CITA GENERA  UN DIA ANTES
  */ 
@Component({
  selector: 'app-agenda-citas-dashboard',
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './agenda-citas-dashboard.component.html',
  styleUrl: './agenda-citas-dashboard.component.css'
})
export class AgendaCitasDashboardComponent implements OnInit {
  verFecha = new Date();
  diasSemana: Date[] = [];
  horas: string[] = [];
  eventos: Evento[] = [];
  selecionarEvent: Evento | null = null;
  rangoSemana = '';
  locale = 'es';
  pacientes: any[] = [];

  //  AGREGAR PROPIEDADES FALTANTES
  idPsicologo: number = 0; // Cambiado de valor por defecto
  idAgenda: number = 0; // Cambiado de valor por defecto

  // Variables para disponibilidad
disponibilidades: DisponibilidadItem[] = [];
diasSemanaEnum = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];


private cargandoAgenda = false;  // Flag para evitar llamadas múltiples

  // Variables para crear disponibilidad
  nuevaDisponibilidad: DisponibilidadItem = {
    dia_semana: 'Lunes',
    hora_inicio: '09:00',
    hora_fin: '18:30'
  };

  // Reagendar
  fechaReagendar = '';
  horaReagendar = '';

  // Duplicar
  diasDuplicar: Date[] = [];

  // Crear cita
  crearFecha = '';
  crearHora = '';
  crearDuracionMin = 60;
  crearPacienteId: number | null = null;
  crearModalidad = 'Presencial';
  crearEstado: 'Pendiente' | 'Confirmada' | 'Cancelada' = 'Pendiente';
  crearNotas = '';

  constructor(
    private agendaService: AgendaService, 
    private pacienteService: PacientesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.obtenerIdPsicologo();
    this.generarSemana();
    this.generarHoras();
    this.cargarPacientes();
    this.cargarAgenda();
    this.verificarDisponibilidadInicial();
  }

  //  MÉTODO para obtener ID del psicólogo
  private obtenerIdPsicologo() {
    const token = this.authService.getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.idPsicologo = payload.id_psicologo;
        console.log('ID Psicólogo obtenido:', this.idPsicologo);
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }

  private async cargarAgenda() {
    // ✅ Evitar llamadas múltiples simultáneas
    if (this.cargandoAgenda) {
      console.log('⏳ Ya hay una carga de agenda en proceso, esperando...');
      return;
    }

    this.cargandoAgenda = true;

    try {
      const inicioSemana = this.diasSemana[0];
      const inicioSemanaStr = format(inicioSemana, 'yyyy-MM-dd');

      console.log(`🔍 Buscando agenda para semana: ${inicioSemanaStr}`);

      // ✅ Intentar obtener agenda existente para esta semana específica
      const response: any = await this.agendaService.getAgendaPorSemana(
        this.idPsicologo, 
        inicioSemanaStr
      ).toPromise();
      
      this.idAgenda = response?.agenda?.id_agenda;
      console.log('✅ Agenda encontrada:', this.idAgenda);
      
      // Cargar citas
      if (this.idAgenda) {
        this.cargarCitas();
      }
    } catch (error) {
      console.log('⚠️ No existe agenda para esta semana, creando nueva...');
      
      // ✅ Crear agenda para la semana seleccionada
      const inicioSemana = this.diasSemana[0];
      const finSemana = this.diasSemana[6];
      
      const nuevaAgenda = {
        id_psicologo: this.idPsicologo,
        semana_inicio: format(inicioSemana, 'yyyy-MM-dd'),
        semana_fin: format(finSemana, 'yyyy-MM-dd')
      };
      
      try {
        const response: any = await this.agendaService.crearAgenda(nuevaAgenda).toPromise();
        this.idAgenda = response?.agenda?.id_agenda;
        console.log('✅ Agenda creada:', this.idAgenda);
        
        // Inicializar eventos vacíos
        this.eventos = [];
      } catch (createError) {
        console.error('❌ Error al crear agenda:', createError);
        alert('Error al crear la agenda para esta semana');
      }
    } finally {
      this.cargandoAgenda = false;  // ✅ Siempre liberar el flag
    }
  }

  //  VERIFICAR Y CREAR DISPONIBILIDAD INICIAL
  private verificarDisponibilidadInicial() {
    setTimeout(() => {
      this.agendaService.getDisponibilidad(this.idPsicologo).subscribe({
        next: (disponibilidades: any[]) => {
          if (disponibilidades.length === 0) {
            console.log('No hay disponibilidad configurada, creando horario por defecto...');
            this.crearDisponibilidadPorDefecto();
          } else {
            this.disponibilidades = disponibilidades;
            console.log('Disponibilidad cargada:', disponibilidades);
          }
        },
        error: (error) => {
          console.error('Error al cargar disponibilidad:', error);
          this.crearDisponibilidadPorDefecto();
        }
      });
    }, 1000); // Esperar a que se obtenga el idPsicologo
  }



  //  CREAR DISPONIBILIDAD POR DEFECTO (Lunes a Viernes 9:00-18:30)
  private crearDisponibilidadPorDefecto() {
    const horarioDefecto = [
      { dia_semana: 'Lunes', hora_inicio: '09:00', hora_fin: '18:30' },
      { dia_semana: 'Martes', hora_inicio: '09:00', hora_fin: '18:30' },
      { dia_semana: 'Miércoles', hora_inicio: '09:00', hora_fin: '18:30' },
      { dia_semana: 'Jueves', hora_inicio: '09:00', hora_fin: '18:30' },
      { dia_semana: 'Viernes', hora_inicio: '09:00', hora_fin: '18:30' }
    ];

    horarioDefecto.forEach(disponibilidad => {
      this.agendaService.crearDisponibilidad({
        id_psicologo: this.idPsicologo,
        ...disponibilidad
      }).subscribe({
        next: (response) => {
          console.log(`Disponibilidad creada para ${disponibilidad.dia_semana}`);
        },
        error: (error) => {
          console.error(`Error al crear disponibilidad para ${disponibilidad.dia_semana}:`, error);
        }
      });
    });

    this.disponibilidades = horarioDefecto;
  }

  //  CARGAR DISPONIBILIDAD ACTUAL
  cargarDisponibilidad() {
    this.agendaService.getDisponibilidad(this.idPsicologo).subscribe({
      next: (disponibilidades: any[]) => {
        this.disponibilidades = disponibilidades;
        console.log('Disponibilidad actualizada:', disponibilidades);
      },
      error: (error) => {
        console.error('Error al cargar disponibilidad:', error);
      }
    });
  }

  //  AGREGAR NUEVA DISPONIBILIDAD
  agregarDisponibilidad() {
    if (!this.nuevaDisponibilidad.hora_inicio || !this.nuevaDisponibilidad.hora_fin) {
      alert('Por favor complete todos los campos');
      return;
    }

    if (this.nuevaDisponibilidad.hora_fin <= this.nuevaDisponibilidad.hora_inicio) {
      alert('La hora de fin debe ser mayor que la hora de inicio');
      return;
    }

    this.agendaService.crearDisponibilidad({
      id_psicologo: this.idPsicologo,
      ...this.nuevaDisponibilidad
    }).subscribe({
      next: (response) => {
        console.log('Disponibilidad agregada:', response);
        this.cargarDisponibilidad();
        this.nuevaDisponibilidad = {
          dia_semana: 'Lunes',
          hora_inicio: '09:00',
          hora_fin: '18:30'
        };
      },
      error: (error) => {
        console.error('Error al agregar disponibilidad:', error);
        alert('Error al agregar disponibilidad: ' + (error.error?.msg || 'Error desconocido'));
      }
    });
  }

  //  ELIMINAR DISPONIBILIDAD
  eliminarDisponibilidad(index: number) {
    const disponibilidad = this.disponibilidades[index];
    if (confirm(`¿Eliminar disponibilidad de ${disponibilidad.dia_semana} ${disponibilidad.hora_inicio}-${disponibilidad.hora_fin}?`)) {
      this.agendaService.eliminarDisponibilidad(this.idPsicologo, disponibilidad.dia_semana, disponibilidad.hora_inicio).subscribe({
        next: () => {
          console.log('Disponibilidad eliminada');
          this.cargarDisponibilidad();
        },
        error: (error) => {
          console.error('Error al eliminar disponibilidad:', error);
          alert('Error al eliminar disponibilidad');
        }
      });
    }
  }

  cargarCitas() {
    this.agendaService.getCitas(this.idAgenda).subscribe({
      next: (response: any) => {
        const citas = response.citas || response;
        if (Array.isArray(citas)) {
          this.eventos = citas.map((c: any) => {
            // ✅ FIX: Crear fecha correctamente sin conversión UTC
            const [year, month, day] = c.fecha.split('-').map(Number);
            const fechaLocal = new Date(year, month - 1, day);
            
            // Obtener el nombre completo del paciente
            const nombreCompleto = c.paciente ? 
              `${c.paciente.nombre} ${c.paciente.apellido_paterno} ${c.paciente.apellido_materno || ''}`.trim() 
              : 'Paciente';
            
            return {
              title: `Cita con ${nombreCompleto}`,
              dia: fechaLocal,
              hora: c.hora_inicio,
              meta: {
                paciente: nombreCompleto,
                estado: c.estado,
                modalidad: c.modalidad,
                notas: c.notas,
                duracionMin: c.duracion || 60,
                id: c.id_cita
              }
            };
          });
          
          // ✅ Forzar detección de cambios para que Angular renderice correctamente
          this.eventos = [...this.eventos];
          console.log('✅ Citas cargadas:', this.eventos.length, this.eventos);
        } else {
          console.log('No hay citas disponibles');
          this.eventos = [];
        }
      },
      error: (error) => {
        console.error('Error al cargar citas:', error);
        this.eventos = [];
      }
    });
  }

  cargarPacientes() {
    this.pacienteService.getPacientesPorPsicologo().subscribe({
      next: (data: any[]) => {
        this.pacientes = data;
      },
      error: (error) => {
        console.error('Error al cargar pacientes:', error);
        this.pacientes = [];
      }
    });
  }
    // Asegurar que existe agenda antes de crear cita
  private async asegurarAgenda(): Promise<void> {
    try {
      // Calcular semana de la fecha seleccionada para la cita
      const [year, month, day] = this.crearFecha.split('-').map(Number);
      const fechaSeleccionada = new Date(year, month - 1, day);
      
      // Obtener inicio de semana (lunes)
      const diaSemana = fechaSeleccionada.getDay();
      const diff = diaSemana === 0 ? -6 : 1 - diaSemana; // Si es domingo, retroceder 6 días
      const inicioSemana = new Date(fechaSeleccionada);
      inicioSemana.setDate(fechaSeleccionada.getDate() + diff);
      
      const inicioSemanaStr = format(inicioSemana, 'yyyy-MM-dd');
      
      console.log(`🔍 Asegurando agenda para semana: ${inicioSemanaStr}`);

      // Intentar obtener agenda existente
      try {
        const response: any = await this.agendaService.getAgendaPorSemana(
          this.idPsicologo,
          inicioSemanaStr
        ).toPromise();

        if (response?.agenda?.id_agenda) {
          this.idAgenda = response.agenda.id_agenda;
          console.log(`✅ Agenda encontrada: ${this.idAgenda}`);
          return;
        }
      } catch (error) {
        // No existe, continuar para crearla
        console.log('⚠️ Agenda no existe, procediendo a crear...');
      }

      // Si no existe, crear nueva
      const finSemana = new Date(inicioSemana);
      finSemana.setDate(inicioSemana.getDate() + 6);
      
      const nuevaAgenda = {
        id_psicologo: this.idPsicologo,
        semana_inicio: inicioSemanaStr,
        semana_fin: format(finSemana, 'yyyy-MM-dd')
      };

      const createResponse: any = await this.agendaService.crearAgenda(nuevaAgenda).toPromise();
      this.idAgenda = createResponse?.agenda?.id_agenda;
      console.log(`✅ Agenda creada: ${this.idAgenda}`);

    } catch (error) {
      console.error('❌ Error al asegurar agenda:', error);
      throw error;
    }
  }
  async confirmarCrearCita() {
    if (!this.crearFecha || !this.crearHora || !this.crearPacienteId) {
      alert('Faltan datos obligatorios.');
      return;
    }

    // ✅ SOLUCIÓN: SIEMPRE asegurar que la agenda corresponde a la fecha de la cita
    // No importa si this.idAgenda tiene valor, porque podría ser de otra semana
    try {
      console.log('🔍 Calculando agenda correcta para la fecha de la cita...');
      await this.asegurarAgenda();
      
      if (!this.idAgenda || this.idAgenda === 0) {
        alert('Error: No se pudo obtener o crear la agenda. Por favor, intenta nuevamente.');
        return;
      }
      
      console.log(`✅ Usando agenda: ${this.idAgenda} para la fecha: ${this.crearFecha}`);
    } catch (error) {
      console.error('❌ Error al asegurar agenda:', error);
      alert('Error al verificar la agenda. Por favor, intenta nuevamente.');
      return;
    }

    // ✅ VALIDACIÓN: No permitir crear citas en fechas pasadas
    const [year, month, day] = this.crearFecha.split('-').map(Number);
    const fechaSeleccionada = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      alert('No puedes crear citas en fechas pasadas.');
      return;
    }

    // ✅ VALIDACIÓN: Si es hoy, verificar que la hora no haya pasado
    if (fechaSeleccionada.toDateString() === hoy.toDateString()) {
      const [horaSeleccionada, minutosSeleccionados] = this.crearHora.split(':').map(Number);
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutosActuales = ahora.getMinutes();
      
      if (horaSeleccionada < horaActual || 
          (horaSeleccionada === horaActual && minutosSeleccionados <= minutosActuales)) {
        alert('No puedes crear citas en horas que ya pasaron.');
        return;
      }
    }

    // ✅ Convertir fecha correctamente sin problemas de zona horaria
    const fechaLocal = new Date(year, month - 1, day);
    const fechaISO = fechaLocal.toISOString().split('T')[0];

    const horaInicio = this.crearHora;
    const duracion = this.crearDuracionMin || 60;
    const horaFin = this.calcularHoraFin(horaInicio, duracion);

    const citaData = {
      id_agenda: this.idAgenda,
      id_paciente: this.crearPacienteId,
      fecha: fechaISO,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      modalidad: this.crearModalidad,
      estado: this.crearEstado.toLowerCase(),
      notas: this.crearNotas
    };

    console.log('📤 Enviando cita:', citaData);

    this.agendaService.crearCita(citaData).subscribe({
      next: (response) => {
        console.log('✅ Cita creada exitosamente:', response);
        alert('Cita creada exitosamente');
        
        // ✅ IMPORTANTE: Recargar la vista para mostrar la cita en la semana correcta
        this.cargarAgenda();
        this.cerrarModal('crearModal');
        
        // Limpiar formulario
        this.crearFecha = '';
        this.crearHora = '';
        this.crearPacienteId = null;
        this.crearNotas = '';
      },
      error: (error) => {
        console.error('❌ Error al crear cita:', error);
        
        if (error.error?.error?.includes('disponibilidad')) {
          alert('El horario seleccionado no está disponible.\n\n1. Verifique su horario de disponibilidad\n2. Use el botón "Personalizar Horario"\n3. Seleccione un horario dentro de su disponibilidad');
        } else {
          alert('Error al crear la cita: ' + (error.error?.msg || 'Error desconocido'));
        }
      }
    });
  }

  private calcularHoraFin(horaInicio: string, duracionMinutos: number): string {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const minutosTotal = horas * 60 + minutos + duracionMinutos;
    const horasFin = Math.floor(minutosTotal / 60);
    const minutosFin = minutosTotal % 60;
    
    return `${horasFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
  }
  // ✅ NUEVO: Cambiar estado de la cita
  cambiarEstadoCita(nuevoEstado: 'Pendiente' | 'Confirmada' | 'Cancelada') {
    if (!this.selecionarEvent) return;
    
    const idCita = this.selecionarEvent.meta?.id;
    if (!idCita) {
      console.error('No hay id de cita para actualizar');
      return;
    }

    const datos = {
      estado: nuevoEstado.toLowerCase()
    };

    this.agendaService.actualizarCita(idCita, datos).subscribe({
      next: () => {
        // Actualizar el evento localmente
        if (this.selecionarEvent && this.selecionarEvent.meta) {
          this.selecionarEvent.meta.estado = nuevoEstado;
        }
        
        // Recargar todas las citas para reflejar el cambio
        this.cargarCitas();
        
        alert(`Estado cambiado a: ${nuevoEstado}`);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        alert('Error al cambiar el estado de la cita');
      }
    });
  }
  eliminarCita() {
    if (!this.selecionarEvent) return;
    const idCita = this.selecionarEvent.meta?.id;
    if (!idCita) return;

    this.agendaService.eliminarCita(idCita).subscribe(() => {
      this.eventos = this.eventos.filter(e => e.meta?.id !== idCita);
      this.cerrarModal('eventModal');
    });
  }

  reagendar() {
    if (!this.selecionarEvent || !this.fechaReagendar || !this.horaReagendar) return;

    // ✅ VALIDACIÓN: No permitir reagendar a fechas pasadas
    const [year, month, day] = this.fechaReagendar.split('-').map(Number);
    const fechaSeleccionada = new Date(year, month - 1, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      alert('No puedes reagendar citas a fechas pasadas.');
      return;
    }

    // ✅ VALIDACIÓN: Si es hoy, verificar hora
    if (fechaSeleccionada.toDateString() === hoy.toDateString()) {
      const [horaSeleccionada, minutosSeleccionados] = this.horaReagendar.split(':').map(Number);
      const ahora = new Date();
      
      if (horaSeleccionada < ahora.getHours() || 
          (horaSeleccionada === ahora.getHours() && minutosSeleccionados <= ahora.getMinutes())) {
        alert('No puedes reagendar a una hora que ya pasó.');
        return;
      }
    }

    const idCita = this.selecionarEvent.meta?.id;
    const fechaISO = fechaSeleccionada.toISOString().split('T')[0];
    
    const datos = {
      fecha: fechaISO,
      hora_inicio: this.horaReagendar
    };
    
    if (!idCita) {
      console.error('No hay id de cita para actualizar');
      return;
    }
    
    this.agendaService.actualizarCita(idCita, datos).subscribe(() => {
      this.cargarCitas();
      this.cerrarModal('reagendarModal');
      this.cerrarModal('eventModal');
    });
  }

  duplicar() {
    if (!this.selecionarEvent || this.diasDuplicar.length === 0) return;

    for (const d of this.diasDuplicar) {
      const citaData = {
        id_agenda: this.idAgenda,
        id_paciente: this.pacientes.find(p => p.nombre === this.selecionarEvent?.meta?.paciente)?.id_paciente,
        fecha: format(d, 'yyyy-MM-dd'),
        hora_inicio: this.selecionarEvent.hora,
        duracion: this.selecionarEvent.meta?.duracionMin || 60,
        modalidad: this.selecionarEvent.meta?.modalidad,
        estado: this.selecionarEvent.meta?.estado,
        notas: this.selecionarEvent.meta?.notas
      };

      this.agendaService.crearCita(citaData).subscribe(() => {
        this.cargarCitas();
      });
    }

    this.cerrarModal('duplicarModal');
    this.cerrarModal('eventModal');
  }

  // Utilidades
  private toMin(hhmm: string): number {
    const [h, m] = hhmm.split(':');
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  }

  private fromMin(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  private normalizeHora(hhmm: string): string {
    const [h, m] = hhmm.split(':');
    return `${parseInt(h, 10)}:${m.padStart(2, '0')}`;
  }

  finEvento(e: Evento): string {
    const dur = e.meta?.duracionMin ?? 60;
    return this.fromMin(this.toMin(e.hora) + dur);
  }

  generarSemana() {
    const inicio = startOfWeek(this.verFecha, { weekStartsOn: 1 });
    this.diasSemana = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
    const inicioTexto = format(this.diasSemana[0], 'd MMM', { locale: es });
    const finTexto = format(this.diasSemana[6], 'd MMM', { locale: es });
    this.rangoSemana = `${inicioTexto} - ${finTexto}`;
  }

  generarHoras() {
    this.horas = [];
    for (let h = 8; h <= 20; h++) this.horas.push(`${h}:00`);
  }

  obtenerEventos(dia: Date, hora: string): Evento[] {
    return this.eventos.filter(e =>
      e.dia.toDateString() === dia.toDateString() &&
      this.normalizeHora(e.hora) === this.normalizeHora(hora)
    );
  }

  isBloqueado(dia: Date, hora: string): boolean {
    const slot = this.toMin(this.normalizeHora(hora));
    return this.eventos.some(e => {
      if (e.dia.toDateString() !== dia.toDateString()) return false;
      const ini = this.toMin(this.normalizeHora(e.hora));
      const fin = this.toMin(this.finEvento(e));
      return slot > ini && slot < fin;
    });
  }

  manejarEvento(evento: Evento, ev?: Event) {
    this.selecionarEvent = evento;
    if (ev) ev.stopPropagation();
    this.abrirModal('eventModal');
  }

  anteriorSemana() {
  this.verFecha = addDays(this.verFecha, -7);
  this.generarSemana();
  this.cargarAgenda(); 
}

  siguienteSemana() {
  this.verFecha = addDays(this.verFecha, 7);
  this.generarSemana();
  this.cargarAgenda(); // ✅ Agregar esta línea
}

hoy() {
  this.verFecha = new Date();
  this.generarSemana();
  this.cargarAgenda(); // ✅ Agregar esta línea
}
  getColorEvento(estado?: string): string {
    switch (estado) {
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Confirmada': return 'bg-success text-white';
      case 'Cancelada': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  abrirModal(id: string) {
    const modal = new (window as any).bootstrap.Modal(document.getElementById(id));
    modal.show();
  }

  cerrarModal(id: string) {
    const modalEl = document.getElementById(id);
    const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  abrirModalCrear() {
    this.crearFecha = format(new Date(), 'yyyy-MM-dd');
    this.crearHora = '08:00';
    this.crearDuracionMin = 60;
    this.crearModalidad = 'Presencial';
    this.crearEstado = 'Pendiente';
    this.crearNotas = '';
    this.abrirModal('crearModal');
  }

  abrirModalDuplicar() {
    this.diasDuplicar = [];
    this.abrirModal('duplicarModal');
  }

  eliminarDuplicadas() {
    if (!this.selecionarEvent) return;
    const paciente = this.selecionarEvent.meta?.paciente;
    this.eventos = this.eventos.filter(e => e.meta?.paciente !== paciente || e === this.selecionarEvent);
    this.cerrarModal('eventModal');
  }

  abrirModalReagendar() {
    this.fechaReagendar = '';
    this.horaReagendar = '';
    this.abrirModal('reagendarModal');
  }
  // ✅ ABRIR MODAL DE DISPONIBILIDAD
  abrirModalDisponibilidad() {
    this.cargarDisponibilidad();
    this.abrirModal('disponibilidadModal');
  }
}