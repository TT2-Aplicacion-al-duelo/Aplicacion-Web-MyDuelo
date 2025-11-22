
/**
 * Utilidades para manejo de fechas
 * El backend ya envía las fechas en formato string correcto
 */

export function parsearFechaMexico(fechaString: string): Date {
  if (!fechaString) return new Date();
  
  try {
    // Reemplazar espacio con T si es necesario
    const fechaISO = fechaString.replace(' ', 'T');
    
    // Crear fecha sin timezone (hora local)
    return new Date(fechaISO);
  } catch (error) {
    console.error('Error al parsear fecha:', error);
    return new Date();
  }
}

export function formatearHoraMexico(fechaString: string): string {
  if (!fechaString) return '--:--';
  
  try {
    const date = parsearFechaMexico(fechaString);
    
    if (isNaN(date.getTime())) return '--:--';
    
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    
    return `${horas}:${minutos}`;
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return '--:--';
  }
}

export function formatearFechaRelativa(fechaString: string): string {
  if (!fechaString) return '';
  
  try {
    const date = parsearFechaMexico(fechaString);
    
    if (isNaN(date.getTime())) return '';
    
    const ahora = new Date();
    const diferencia = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return `${dia}/${mes}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}

/**
 * Obtener etiqueta de fecha estilo WhatsApp
 * Retorna: "Hoy", "Ayer", o "DD/MM/YYYY"
 */
export function obtenerEtiquetaFecha(fechaString: string): string {
  if (!fechaString) return '';
  
  try {
    const fecha = parsearFechaMexico(fechaString);
    
    if (isNaN(fecha.getTime())) return '';
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    const fechaMensaje = new Date(fecha);
    fechaMensaje.setHours(0, 0, 0, 0);
    
    if (fechaMensaje.getTime() === hoy.getTime()) {
      return 'Hoy';
    }
    
    if (fechaMensaje.getTime() === ayer.getTime()) {
      return 'Ayer';
    }
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
  } catch (error) {
    console.error('Error al obtener etiqueta de fecha:', error);
    return '';
  }
}

/**
 * Verificar si dos fechas son del mismo día
 */
export function esMismoDia(fecha1: string, fecha2: string): boolean {
  if (!fecha1 || !fecha2) return false;
  
  try {
    const date1 = parsearFechaMexico(fecha1);
    const date2 = parsearFechaMexico(fecha2);
    
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  } catch (error) {
    return false;
  }
}