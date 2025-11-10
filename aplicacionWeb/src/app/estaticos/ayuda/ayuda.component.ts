import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
  categoria: string;
}

interface GuiaRapida {
  titulo: string;
  descripcion: string;
  pasos: string[];
  icono: string;
}

@Component({
  selector: 'app-ayuda',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ayuda.component.html',
  styleUrls: ['./ayuda.component.css']
})
export class AyudaComponent implements OnInit {
  tipoUsuario: 'visitante' | 'psicologo' | 'paciente' | 'admin' = 'visitante';
  categoriaActiva: string = 'general';
  emailSoporte: string = 'soporte_tecnico@midueloapp.com';

  // Preguntas frecuentes generales
  preguntasGenerales: PreguntaFrecuente[] = [
    {
      pregunta: '¿Qué es Mi Duelo Online?',
      respuesta: 'Mi Duelo Online es una plataforma digital que conecta a personas en proceso de duelo con psicólogos especializados, ofreciendo herramientas terapéuticas, seguimiento profesional y una comunidad de apoyo segura.',
      categoria: 'general'
    },
    {
      pregunta: '¿Es segura mi información?',
      respuesta: 'Sí, toda tu información está protegida con encriptación de nivel bancario. Cumplimos con todas las regulaciones de protección de datos personales y confidencialidad médica.',
      categoria: 'general'
    },
    {
      pregunta: '¿Cuánto cuesta usar la plataforma?',
      respuesta: 'El registro en la plataforma es gratuito. Los costos de las sesiones con psicólogos se acuerdan directamente con el profesional de tu elección.',
      categoria: 'general'
    },
    {
      pregunta: '¿Cómo recupero mi contraseña?',
      respuesta: 'En la página de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?" e ingresa tu correo electrónico. Recibirás un enlace para restablecer tu contraseña.',
      categoria: 'general'
    }
  ];

  // Guías rápidas para pacientes
  guiasPaciente: GuiaRapida[] = [
    {
      titulo: 'Cómo buscar un psicólogo',
      descripcion: 'Encuentra el profesional adecuado para ti',
      icono: 'bi-search',
      pasos: [
        'Inicia sesión en tu cuenta',
        'Ve a la sección "Buscar Psicólogos"',
        'Usa los filtros de especialidad y disponibilidad',
        'Revisa los perfiles y selecciona el que más te convenga',
        'Solicita una cita haciendo clic en "Agendar"'
      ]
    },
    {
      titulo: 'Cómo agendar una cita',
      descripcion: 'Programa tu sesión de forma sencilla',
      icono: 'bi-calendar-plus',
      pasos: [
        'Selecciona el psicólogo de tu preferencia',
        'Haz clic en "Agendar cita"',
        'Elige la fecha y hora disponible',
        'Añade notas o motivo de consulta (opcional)',
        'Confirma la cita',
        'Recibirás una confirmación por correo'
      ]
    },
    {
      titulo: 'Cómo completar actividades',
      descripcion: 'Realiza tus ejercicios terapéuticos',
      icono: 'bi-clipboard-check',
      pasos: [
        'Ve a tu panel principal',
        'Busca la sección "Mis Actividades"',
        'Selecciona la actividad asignada',
        'Lee las instrucciones cuidadosamente',
        'Completa la actividad siguiendo los pasos',
        'Guarda o envía tu respuesta',
        'Tu psicólogo revisará tu progreso'
      ]
    },
    {
      titulo: 'Cómo usar el chat',
      descripcion: 'Comunícate con tu psicólogo',
      icono: 'bi-chat-dots',
      pasos: [
        'Ve a la sección "Chat"',
        'Selecciona la conversación con tu psicólogo',
        'Escribe tu mensaje en el cuadro de texto',
        'Presiona Enter o haz clic en "Enviar"',
        'Recibirás notificaciones de nuevos mensajes'
      ]
    }
  ];

  // Guías rápidas para psicólogos
  guiasPsicologo: GuiaRapida[] = [
    {
      titulo: 'Gestión de pacientes',
      descripcion: 'Administra tu lista de pacientes',
      icono: 'bi-people',
      pasos: [
        'Accede a "Mis Pacientes"',
        'Visualiza la lista completa de tus pacientes',
        'Haz clic en un paciente para ver su perfil detallado',
        'Revisa su historial de sesiones y actividades',
        'Añade notas clínicas después de cada sesión'
      ]
    },
    {
      titulo: 'Asignar actividades',
      descripcion: 'Crea ejercicios terapéuticos personalizados',
      icono: 'bi-journal-plus',
      pasos: [
        'Selecciona el paciente',
        'Ve a la pestaña "Actividades"',
        'Haz clic en "Asignar nueva actividad"',
        'Elige el tipo de actividad',
        'Personaliza las instrucciones',
        'Establece fecha límite (opcional)',
        'Confirma y asigna'
      ]
    },
    {
      titulo: 'Aplicar tests psicológicos',
      descripcion: 'Evalúa el progreso de tus pacientes',
      icono: 'bi-clipboard-data',
      pasos: [
        'Accede al perfil del paciente',
        'Ve a la sección "Tests"',
        'Selecciona el test a aplicar',
        'Configura parámetros si es necesario',
        'Envía el test al paciente',
        'Revisa los resultados cuando se complete',
        'Analiza las gráficas de progreso'
      ]
    },
    {
      titulo: 'Crear foros de apoyo',
      descripcion: 'Modera espacios comunitarios',
      icono: 'bi-chat-square-text',
      pasos: [
        'Ve a la sección "Foros"',
        'Haz clic en "Crear nuevo foro"',
        'Define el título y descripción',
        'Establece si será público o privado',
        'Invita a otros moderadores si lo deseas',
        'Publica el foro',
        'Modera y participa activamente'
      ]
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.detectarTipoUsuario();
  }

  detectarTipoUsuario(): void {
    if (!this.authService.isAuthenticated()) {
      this.tipoUsuario = 'visitante';
      return;
    }

    if (this.authService.isAdmin()) {
      this.tipoUsuario = 'admin';
    } else if (this.authService.isPsicologo()) {
      this.tipoUsuario = 'psicologo';
    }
  }

  cambiarCategoria(categoria: string): void {
    this.categoriaActiva = categoria;
  }

  getGuiasActuales(): GuiaRapida[] {
    if (this.tipoUsuario === 'paciente') {
      return this.guiasPaciente;
    } else if (this.tipoUsuario === 'psicologo' || this.tipoUsuario === 'admin') {
      return this.guiasPsicologo;
    }
    return this.guiasPaciente; // Default para visitantes
  }
}