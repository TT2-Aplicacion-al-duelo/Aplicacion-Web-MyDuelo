/**
 * Parsear fecha de MySQL como hora local de México
 * MySQL devuelve: "2025-11-20 15:30:00"
 * Esta función lo convierte correctamente a Date en hora México
 */
// export function parsearFechaMexico(fechaString: string): Date {
//   if (!fechaString) return new Date();
  
//   // Reemplazar espacio con 'T' para formato ISO compatible
//   // Y agregar la zona horaria de México (-06:00)
//   const fechaISO = fechaString.replace(' ', 'T') + '-06:00';
  
//   return new Date(fechaISO);
// }

// /**
//  * Formatear hora en formato HH:mm
//  */
// export function formatearHoraMexico(fechaString: string): string {
//   if (!fechaString) return '--:--';
  
//   try {
//     const date = parsearFechaMexico(fechaString);
    
//     if (isNaN(date.getTime())) {
//       return '--:--';
//     }
    
//     return date.toLocaleTimeString('es-MX', { 
//       hour: '2-digit', 
//       minute: '2-digit',
//       hour12: false
//     });
//   } catch (error) {
//     console.error('Error al formatear hora:', error);
//     return '--:--';
//   }
// }

// /**
//  * Formatear fecha relativa (ej: "5m", "2h", "3d")
//  */
// export function formatearFechaRelativa(fechaString: string): string {
//   if (!fechaString) return '';
  
//   try {
//     const date = parsearFechaMexico(fechaString);
    
//     if (isNaN(date.getTime())) {
//       return '';
//     }
    
//     const ahora = new Date();
//     const diferencia = ahora.getTime() - date.getTime();
//     const minutos = Math.floor(diferencia / (1000 * 60));
//     const horas = Math.floor(diferencia / (1000 * 60 * 60));
//     const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

//     if (minutos < 1) return 'Ahora';
//     if (minutos < 60) return `${minutos}m`;
//     if (horas < 24) return `${horas}h`;
//     if (dias < 7) return `${dias}d`;
    
//     return date.toLocaleDateString('es-MX', { 
//       day: '2-digit', 
//       month: '2-digit' 
//     });
//   } catch (error) {
//     console.error('Error al formatear fecha:', error);
//     return '';
//   }
// }

/**
 * Utilidades para manejo de fechas de MySQL en hora de México
 * VERSIÓN CON DEBUG PARA IDENTIFICAR PROBLEMAS
 */

/**
 * Parsear fecha de MySQL como hora local de México
 */
export function parsearFechaMexico(fechaString: string): Date {
  if (!fechaString) {
    console.warn('⚠️ parsearFechaMexico: fechaString está vacío');
    return new Date();
  }
  
  console.log('🔍 parsearFechaMexico - Input:', fechaString);
  
  try {
    // Limpiar el string por si tiene espacios extras
    const fechaLimpia = fechaString.trim();
    
    // Verificar si ya tiene timezone
    if (fechaLimpia.includes('+') || fechaLimpia.includes('Z')) {
      console.log('✅ Fecha ya tiene timezone:', fechaLimpia);
      return new Date(fechaLimpia);
    }
    
    // Reemplazar espacio con 'T' y agregar timezone de México
    const fechaISO = fechaLimpia.replace(' ', 'T');
    console.log('🔄 Fecha convertida:', fechaISO);
    
    const date = new Date(fechaISO);
    console.log('📅 Date creado:', date, 'isNaN:', isNaN(date.getTime()));
    
    return date;
  } catch (error) {
    console.error('❌ Error en parsearFechaMexico:', error);
    return new Date();
  }
}

/**
 * Formatear hora en formato HH:mm (24 horas)
 */
export function formatearHoraMexico(fechaString: string): string {
  console.log('🕐 formatearHoraMexico - Input:', fechaString);
  
  if (!fechaString) {
    console.warn('formatearHoraMexico: fechaString está vacío');
    return '--:--';
  }
  
  try {
    const date = parsearFechaMexico(fechaString);
    
    if (isNaN(date.getTime())) {
      console.error('formatearHoraMexico: Fecha inválida después de parsear');
      return '--:--';
    }
    
    const hora = date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    
    console.log('Hora formateada:', hora);
    return hora;
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return '--:--';
  }
}

/**
 * Formatear fecha relativa (ej: "5m", "2h", "3d")
 */
export function formatearFechaRelativa(fechaString: string): string {
  if (!fechaString) return '';
  
  try {
    const date = parsearFechaMexico(fechaString);
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const ahora = new Date();
    const diferencia = ahora.getTime() - date.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `${minutos}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    
    return date.toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}