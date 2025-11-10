import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './terminos.component.html',
  styleUrls: ['./terminos.component.css']
})
export class TerminosComponent {
  fechaActualizacion: string = '09 de Noviembre de 2025';
  emailContacto: string = 'soporte_tecnico@midueloapp.com';

  secciones = [
    {
      titulo: '1. Aceptación de los Términos',
      contenido: `Al acceder y utilizar Mi Duelo Online, usted acepta y se compromete a cumplir con estos Términos y Condiciones. 
      Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.`
    },
    {
      titulo: '2. Descripción del Servicio',
      contenido: `Mi Duelo Online es una plataforma digital que conecta a psicólogos certificados con personas que atraviesan 
      procesos de duelo. Proporcionamos herramientas de comunicación, gestión de citas, actividades terapéuticas y foros de apoyo.`
    },
    {
      titulo: '3. Registro y Cuentas de Usuario',
      contenido: `Para utilizar nuestros servicios, debe crear una cuenta proporcionando información veraz y actualizada. 
      Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta.`
    },
    {
      titulo: '4. Uso Apropiado de la Plataforma',
      contenido: `Los usuarios se comprometen a utilizar la plataforma de manera responsable y ética. Está prohibido:
      - Compartir información falsa o engañosa
      - Hostigar, amenazar o intimidar a otros usuarios
      - Utilizar la plataforma con fines ilegales
      - Intentar acceder a cuentas de otros usuarios
      - Publicar contenido ofensivo o inapropiado`
    },
    {
      titulo: '5. Relación Terapéutica',
      contenido: `Mi Duelo Online facilita la conexión entre psicólogos y pacientes, pero no proporciona directamente servicios 
      de salud mental. La relación terapéutica se establece directamente entre el psicólogo y el paciente. Los psicólogos son 
      profesionales independientes responsables de su práctica.`
    },
    {
      titulo: '6. Privacidad y Confidencialidad',
      contenido: `Nos comprometemos a proteger su privacidad y la confidencialidad de su información. Para más detalles, 
      consulte nuestro Aviso de Privacidad. Los psicólogos deben cumplir con todas las normas de confidencialidad profesional 
      aplicables.`
    },
    {
      titulo: '7. Propiedad Intelectual',
      contenido: `Todo el contenido de la plataforma, incluyendo diseño, código, gráficos y material educativo, es propiedad 
      de Mi Duelo Online o sus licenciantes. Los usuarios no pueden reproducir, distribuir o modificar este contenido sin 
      autorización expresa.`
    },
    {
      titulo: '8. Limitación de Responsabilidad',
      contenido: `Mi Duelo Online no se hace responsable de:
      - La calidad o efectividad de los servicios profesionales proporcionados por los psicólogos
      - Daños derivados del uso o imposibilidad de uso de la plataforma
      - Pérdida de datos o interrupciones del servicio
      - Contenido generado por usuarios en foros o chats`
    },
    {
      titulo: '9. Modificaciones del Servicio',
      contenido: `Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de la plataforma en 
      cualquier momento. También podemos actualizar estos términos, notificándole de cambios significativos.`
    },
    {
      titulo: '10. Terminación de Cuenta',
      contenido: `Podemos suspender o terminar su cuenta si viola estos términos o si determina que su uso de la plataforma 
      es perjudicial para otros usuarios o para el servicio. Los usuarios pueden cancelar su cuenta en cualquier momento desde 
      la configuración de perfil.`
    },
    {
      titulo: '11. Ley Aplicable',
      contenido: `Estos términos se rigen por las leyes de México. Cualquier disputa será resuelta en los tribunales competentes 
      de México.`
    },
    {
      titulo: '12. Contacto',
      contenido: `Para preguntas sobre estos términos, puede contactarnos en: ${this.emailContacto}`
    }
  ];
}