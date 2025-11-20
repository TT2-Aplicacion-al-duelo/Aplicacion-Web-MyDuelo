
// export function parsearFechaMexico(fechaString: string): Date {
//   if (!fechaString) {
//     console.warn('⚠️ parsearFechaMexico: fechaString está vacío');
//     return new Date();
//   }
  
//   console.log('🔍 parsearFechaMexico - Input:', fechaString);
  
//   try {
//     // Limpiar el string por si tiene espacios extras
//     const fechaLimpia = fechaString.trim();
    
//     // Verificar si ya tiene timezone
//     if (fechaLimpia.includes('+') || fechaLimpia.includes('Z')) {
//       console.log('✅ Fecha ya tiene timezone:', fechaLimpia);
//       return new Date(fechaLimpia);
//     }
    
//     // Reemplazar espacio con 'T' y agregar timezone de México
//     const fechaISO = fechaLimpia.replace(' ', 'T');
//     console.log('🔄 Fecha convertida:', fechaISO);
    
//     const date = new Date(fechaISO);
//     console.log('📅 Date creado:', date, 'isNaN:', isNaN(date.getTime()));
    
//     return date;
//   } catch (error) {
//     console.error('❌ Error en parsearFechaMexico:', error);
//     return new Date();
//   }
// }

// /**
//  * Formatear hora en formato HH:mm (24 horas)
//  */
// export function formatearHoraMexico(fechaString: string): string {
//   console.log('🕐 formatearHoraMexico - Input:', fechaString);
  
//   if (!fechaString) {
//     console.warn('formatearHoraMexico: fechaString está vacío');
//     return '--:--';
//   }
  
//   try {
//     const date = parsearFechaMexico(fechaString);
    
//     if (isNaN(date.getTime())) {
//       console.error('formatearHoraMexico: Fecha inválida después de parsear');
//       return '--:--';
//     }
    
//     const hora = date.toLocaleTimeString('es-MX', { 
//       hour: '2-digit', 
//       minute: '2-digit',
//       hour12: false
//     });
    
//     console.log('Hora formateada:', hora);
//     return hora;
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