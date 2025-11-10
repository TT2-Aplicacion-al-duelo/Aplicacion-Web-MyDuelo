import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-acerca-de',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './acerca-de.component.html',
  styleUrls: ['./acerca-de.component.css']
})
export class AcercaDeComponent {
  
  // Funcionalidades principales de la plataforma
  funcionalidades = [
    {
      icono: 'bi-people-fill',
      titulo: 'Conexión con Profesionales',
      descripcion: 'Encuentra y conéctate con psicólogos especializados en procesos de duelo y pérdida.',
      color: 'primary'
    },
    {
      icono: 'bi-calendar-check-fill',
      titulo: 'Agenda de Citas',
      descripcion: 'Sistema integral para gestionar citas entre psicólogos y pacientes de forma eficiente.',
      color: 'success'
    },
    {
      icono: 'bi-chat-dots-fill',
      titulo: 'Chat Privado',
      descripcion: 'Comunicación segura y confidencial entre psicólogos y pacientes en tiempo real.',
      color: 'info'
    },
    {
      icono: 'bi-clipboard-check-fill',
      titulo: 'Actividades Terapéuticas',
      descripcion: 'Los psicólogos pueden asignar actividades personalizadas para el proceso de sanación.',
      color: 'warning'
    },
    {
      icono: 'bi-graph-up-arrow',
      titulo: 'Tests y Evaluaciones',
      descripcion: 'Herramientas de evaluación psicológica para medir el progreso del paciente.',
      color: 'danger'
    },
    {
      icono: 'bi-journal-text',
      titulo: 'Notas Clínicas',
      descripcion: 'Sistema de registro para que los psicólogos documenten el seguimiento de sus pacientes.',
      color: 'secondary'
    },
    {
      icono: 'bi-people',
      titulo: 'Foros de Apoyo',
      descripcion: 'Espacios comunitarios moderados por profesionales para compartir experiencias.',
      color: 'primary'
    },
    {
      icono: 'bi-shield-check',
      titulo: 'Privacidad y Seguridad',
      descripcion: 'Protección de datos personales y confidencialidad garantizada en todas las interacciones.',
      color: 'success'
    }
  ];

  // Beneficios por tipo de usuario
  beneficiosPacientes = [
    'Acceso 24/7 a recursos de apoyo',
    'Seguimiento personalizado de tu proceso',
    'Conexión con profesionales certificados',
    'Actividades terapéuticas guiadas',
    'Comunidad de apoyo segura',
    'Privacidad y confidencialidad garantizada'
  ];

  beneficiosPsicologos = [
    'Plataforma integral para gestión de pacientes',
    'Herramientas profesionales de evaluación',
    'Sistema de citas automatizado',
    'Chat seguro con pacientes',
    'Creación de foros moderados',
    'Registro y seguimiento clínico digital'
  ];

  // Estadísticas (puedes actualizarlas dinámicamente)
  estadisticas = [
    { numero: '500+', texto: 'Pacientes Activos' },
    { numero: '50+', texto: 'Psicólogos Certificados' },
    { numero: '1000+', texto: 'Sesiones Realizadas' },
    { numero: '95%', texto: 'Satisfacción' }
  ];
}