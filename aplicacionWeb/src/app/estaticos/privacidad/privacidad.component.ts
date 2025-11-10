import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacidad',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './privacidad.component.html',
  styleUrls: ['./privacidad.component.css']
})
export class PrivacidadComponent {
  fechaActualizacion: string = '09 de Noviembre de 2025';
  emailContacto: string = 'soporte_tecnico@midueloapp.com';

  secciones = [
    {
      titulo: '1. Responsable del Tratamiento de Datos',
      contenido: `Mi Duelo Online, con domicilio en México, es el responsable del tratamiento de sus datos personales. 
      Para cualquier consulta relacionada con la privacidad, puede contactarnos en: ${this.emailContacto}`,
      icono: 'bi-building'
    },
    {
      titulo: '2. Datos Personales que Recopilamos',
      contenido: `Recopilamos diferentes tipos de información según el tipo de usuario:
      
      Para Pacientes:
      - Nombre completo y fecha de nacimiento
      - Correo electrónico y teléfono
      - Información de salud mental relacionada con el proceso de duelo
      - Respuestas a tests psicológicos
      - Notas de sesiones terapéuticas
      
      Para Psicólogos:
      - Nombre completo y fecha de nacimiento
      - Correo electrónico y teléfono
      - Número de cédula profesional
      - Especialidad y experiencia
      - Documentación de certificación profesional`,
      icono: 'bi-person-badge'
    },
    {
      titulo: '3. Finalidad del Tratamiento de Datos',
      contenido: `Utilizamos su información personal para:
      - Facilitar la conexión entre psicólogos y pacientes
      - Gestionar citas y sesiones terapéuticas
      - Proporcionar herramientas de comunicación segura
      - Realizar evaluaciones y tests psicológicos
      - Mantener registros clínicos (solo psicólogos)
      - Enviar notificaciones importantes sobre el servicio
      - Mejorar la calidad de nuestros servicios
      - Cumplir con obligaciones legales`,
      icono: 'bi-target'
    },
    {
      titulo: '4. Confidencialidad Médica',
      contenido: `Nos comprometemos a mantener la confidencialidad de toda información de salud mental de acuerdo con:
      - La Ley General de Salud de México
      - Las normas éticas de la psicología clínica
      - Estándares internacionales de protección de datos de salud
      
      Los psicólogos están obligados a mantener el secreto profesional según su código ético. La información de sesiones 
      terapéuticas solo es accesible para el psicólogo tratante y el paciente.`,
      icono: 'bi-shield-lock'
    },
    {
      titulo: '5. Compartición de Datos',
      contenido: `No vendemos ni compartimos su información personal con terceros, excepto:
      - Cuando es necesario para proporcionar el servicio (ej: psicólogo-paciente)
      - Con su consentimiento explícito
      - Cuando sea requerido por ley
      - Para proteger nuestros derechos legales
      - Con proveedores de servicios técnicos bajo acuerdos de confidencialidad`,
      icono: 'bi-people'
    },
    {
      titulo: '6. Medidas de Seguridad',
      contenido: `Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger sus datos:
      - Encriptación SSL/TLS en todas las comunicaciones
      - Almacenamiento seguro de contraseñas (hash + salt)
      - Acceso restringido a información sensible
      - Copias de seguridad regulares
      - Auditorías de seguridad periódicas
      - Protocolos de respuesta a incidentes`,
      icono: 'bi-lock-fill'
    },
    {
      titulo: '7. Sus Derechos (ARCO)',
      contenido: `Usted tiene derecho a:
      - Acceder a sus datos personales
      - Rectificar datos incorrectos o incompletos
      - Cancelar su cuenta y solicitar la eliminación de datos
      - Oponerse al tratamiento de ciertos datos
      - Revocar su consentimiento en cualquier momento
      - Solicitar la portabilidad de sus datos
      
      Para ejercer estos derechos, envíe un correo a: ${this.emailContacto}`,
      icono: 'bi-person-check'
    },
    {
      titulo: '8. Retención de Datos',
      contenido: `Conservamos sus datos personales durante:
      - El tiempo que mantenga su cuenta activa
      - El periodo necesario para cumplir con obligaciones legales
      - Los registros clínicos se mantienen según la normativa aplicable (mínimo 5 años después de la última sesión)
      
      Después de este periodo, los datos serán eliminados de forma segura, salvo que la ley requiera su conservación.`,
      icono: 'bi-clock-history'
    },
    {
      titulo: '9. Cookies y Tecnologías de Rastreo',
      contenido: `Utilizamos cookies y tecnologías similares para:
      - Mantener su sesión activa
      - Recordar sus preferencias
      - Analizar el uso de la plataforma
      - Mejorar la experiencia del usuario
      
      Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la plataforma.`,
      icono: 'bi-cookie'
    },
    {
      titulo: '10. Transferencias Internacionales',
      contenido: `Sus datos se almacenan en servidores ubicados en México y cumplen con los estándares de protección de datos 
      aplicables. No realizamos transferencias internacionales de datos sin garantías adecuadas de protección.`,
      icono: 'bi-globe'
    },
    {
      titulo: '11. Menores de Edad',
      contenido: `Nuestros servicios están dirigidos a personas mayores de 18 años. Si un menor requiere atención psicológica, 
      debe registrarse a través de su tutor legal, quien será responsable de la cuenta y del consentimiento para el tratamiento 
      de datos.`,
      icono: 'bi-person-x'
    },
    {
      titulo: '12. Cambios al Aviso de Privacidad',
      contenido: `Podemos actualizar este aviso de privacidad periódicamente. Le notificaremos sobre cambios significativos 
      mediante correo electrónico o un aviso prominente en la plataforma. La fecha de la última actualización siempre estará 
      visible.`,
      icono: 'bi-arrow-repeat'
    },
    {
      titulo: '13. Contacto',
      contenido: `Para preguntas, inquietudes o para ejercer sus derechos ARCO, contáctenos en:
      
      Email: ${this.emailContacto}
      Tiempo de respuesta: 48-72 horas hábiles
      
      También puede consultar nuestro Centro de Ayuda para más información.`,
      icono: 'bi-envelope-at'
    }
  ];
}