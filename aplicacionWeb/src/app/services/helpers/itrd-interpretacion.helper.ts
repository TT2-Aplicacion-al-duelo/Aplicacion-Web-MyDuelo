/**
 * Helper para la interpretación del ITRD (Inventario Texas del Duelo Revisado)
 * Contiene la lógica de puntuación e interpretación para ITRD Pasado e ITRD Presente
 */

export interface ResultadoITRD {
  puntaje: number;
  puntajeMaximo: number;
  porcentaje: number;
  categoria: string;
  interpretacion: string;
  
}

export interface InterpretacionCombinada {
  tipoDuelo: string;
  descripcion: string;
  severidad: 'leve' | 'moderada' | 'severa';
 
}

export class ITRDInterpretacionHelper {
  
  /**
   * Escala de interpretación para las respuestas
   */
  static readonly ESCALA_RESPUESTAS = {
    1: 'Completamente falso',
    2: 'Falsa en su mayor parte',
    3: 'Ni verdadera ni falsa',
    4: 'Verdadera en su mayor parte',
    5: 'Completamente verdadero'
  };

  /**
   * Información del ITRD Pasado (Parte I)
   */
  static readonly ITRD_PASADO = {
    nombre: 'ITRD Pasado - Inventario Texas del Duelo (Parte I)',
    descripcion: 'Evalúa el comportamiento y sentir del doliente en momentos cercanos a la pérdida.',
    numeroPreguntas: 8,
    puntajeMinimo: 8,
    puntajeMaximo: 40,
    instrucciones: 'Por favor, sitúese mentalmente en la época en que el fallecido murió y responda a las siguientes cuestiones sobre sus sentimientos y su forma de actuar durante ese tiempo.',
    caracteristicas: [
      'Evalúa el duelo agudo (momentos cercanos a la pérdida)',
      'Se aplica una única vez',
      'Establece la línea base del proceso de duelo',
      'Puntuación máxima: 40 puntos'
    ]
  };

  /**
   * Información del ITRD Presente (Parte II)
   */
  static readonly ITRD_PRESENTE = {
    nombre: 'ITRD Presente - Inventario Texas del Duelo (Parte II)',
    descripcion: 'Evalúa los sentimientos actuales del paciente ante su proceso de duelo.',
    numeroPreguntas: 13,
    puntajeMinimo: 13,
    puntajeMaximo: 65,
    instrucciones: 'Responda las siguientes preguntas según cómo se siente actualmente respecto a la pérdida.',
    caracteristicas: [
      'Evalúa el duelo actual (sentimientos presentes)',
      'Se puede aplicar múltiples veces',
      'Permite medir el progreso del paciente',
      'Puntuación máxima: 65 puntos'
    ]
  };

  /**
   * Calcula la interpretación para ITRD Pasado
   */
  static interpretarITRDPasado(puntaje: number): ResultadoITRD {
    const puntajeMaximo = this.ITRD_PASADO.puntajeMaximo;
    const porcentaje = (puntaje / puntajeMaximo) * 100;

    let categoria = '';
    let interpretacion = '';
    

    if (puntaje <= 16) { // 0-40%
      categoria = 'Duelo Agudo Leve';
      interpretacion = 'El paciente experimentó un nivel bajo de intensidad emocional en el momento de la pérdida. Esto podría indicar un duelo ausente o una respuesta emocional limitada al evento traumático inicial.';
      
    } else if (puntaje <= 24) { // 41-60%
      categoria = 'Duelo Agudo Moderado';
      interpretacion = 'El paciente experimentó una respuesta emocional moderada ante la pérdida. Presenta algunos síntomas de duelo agudo, pero mantiene cierta funcionalidad.';
      
    } else if (puntaje <= 32) { // 61-80%
      categoria = 'Duelo Agudo Intenso';
      interpretacion = 'El paciente experimentó una respuesta emocional intensa ante la pérdida, con impacto significativo en diferentes áreas de su vida (relaciones, trabajo, sueño).';
      
    } else { // 81-100%
      categoria = 'Duelo Agudo Muy Intenso';
      interpretacion = 'El paciente experimentó una respuesta emocional extremadamente intensa ante la pérdida, con afectación severa en múltiples áreas de funcionamiento.';
      
    }

    return {
      puntaje,
      puntajeMaximo,
      porcentaje: Math.round(porcentaje),
      categoria,
      interpretacion      
    };
  }

  /**
   * Calcula la interpretación para ITRD Presente
   */
  static interpretarITRDPresente(puntaje: number): ResultadoITRD {
    const puntajeMaximo = this.ITRD_PRESENTE.puntajeMaximo;
    const porcentaje = (puntaje / puntajeMaximo) * 100;

    let categoria = '';
    let interpretacion = '';
    

    if (puntaje <= 26) { // 0-40%
      categoria = 'Proceso de Duelo Resuelto';
      interpretacion = 'El paciente muestra signos de haber procesado adecuadamente el duelo. Los sentimientos de dolor han disminuido significativamente y ha logrado adaptarse a la pérdida.';
      
    } else if (puntaje <= 39) { // 41-60%
      categoria = 'Proceso de Duelo en Curso';
      interpretacion = 'El paciente está en un proceso activo de duelo con síntomas presentes pero manejables. Muestra avances pero aún experimenta dolor significativo.';
      
    } else if (puntaje <= 52) { // 61-80%
      categoria = 'Duelo Complicado';
      interpretacion = 'El paciente presenta síntomas intensos de duelo que interfieren con su funcionamiento diario. El proceso de adaptación está siendo más difícil de lo esperado.';
      
    } else { // 81-100%
      categoria = 'Duelo Prolongado/Patológico';
      interpretacion = 'El paciente muestra signos de duelo prolongado o patológico. Los síntomas son intensos y persistentes, afectando severamente su calidad de vida.';
      
    }

    return {
      puntaje,
      puntajeMaximo,
      porcentaje: Math.round(porcentaje),
      categoria,
      interpretacion,
    };
  }

  /**
   * Interpreta los resultados combinados de ITRD Pasado y Presente
   * Esta función es útil cuando se tienen ambos puntajes disponibles
   */
  static interpretarCombinado(
    puntajePasado: number,
    puntajePresente: number
  ): InterpretacionCombinada {
    const porcentajePasado = (puntajePasado / this.ITRD_PASADO.puntajeMaximo) * 100;
    const porcentajePresente = (puntajePresente / this.ITRD_PRESENTE.puntajeMaximo) * 100;

    let tipoDuelo = '';
    let descripcion = '';
    let severidad: 'leve' | 'moderada' | 'severa' = 'leve';
   

    // Duelo Prolongado: Ambos puntajes altos (>50%)
    if (porcentajePasado > 50 && porcentajePresente > 50) {
      tipoDuelo = 'Duelo Prolongado';
      severidad = 'severa';
      descripcion = 'El paciente sintió un dolor intenso desde el inicio de la pérdida y, a pesar del tiempo transcurrido, sigue experimentando la misma intensidad de sentimientos. Esto indica que el proceso de duelo se ha estancado y requiere atención especializada.';
     
    }
    // Duelo Resuelto: Pasado alto (>50%), Presente bajo (<50%)
    else if (porcentajePasado > 50 && porcentajePresente <= 50) {
      tipoDuelo = 'Duelo Resuelto';
      severidad = 'leve';
      descripcion = 'El paciente experimentó una respuesta emocional intensa al momento de la pérdida, pero ha ido procesando y asimilando el duelo de manera adecuada. Muestra signos claros de adaptación y recuperación.';
      
    }
    // Duelo Ausente: Ambos puntajes bajos (<50%)
    else if (porcentajePasado <= 50 && porcentajePresente <= 50) {
      tipoDuelo = 'Duelo Ausente o Inhibido';
      severidad = 'moderada';
      descripcion = 'El paciente no mostró una reacción emocional significativa ni en el momento de la pérdida ni en la actualidad. Esto puede indicar negación, evitación emocional o un estilo de afrontamiento represivo que podría manifestarse más adelante.';
      
    }
    // Duelo Retardado: Pasado bajo (<50%), Presente alto (>50%)
    else {
      tipoDuelo = 'Duelo Retardado';
      severidad = 'moderada';
      descripcion = 'El paciente no reaccionó emocionalmente de forma significativa al momento de la pérdida, pero el dolor ha aparecido con el tiempo. Esto sugiere que las emociones fueron reprimidas inicialmente y ahora están emergiendo.';
      
    }

    return {
      tipoDuelo,
      descripcion,
      severidad,
      
    };
  }

  /**
   * Obtiene la etiqueta de color para visualización según el porcentaje
   */
  static getColorCategoria(porcentaje: number): string {
    if (porcentaje <= 40) return 'success';
    if (porcentaje <= 60) return 'info';
    if (porcentaje <= 80) return 'warning';
    return 'danger';
  }

  /**
   * Genera texto descriptivo de la escala de respuestas
   */
  static getDescripcionEscala(): string {
    return 'Escala de respuesta de 1 a 5 puntos:\n' +
           '• 1 = Completamente falso\n' +
           '• 2 = Falsa en su mayor parte\n' +
           '• 3 = Ni verdadera ni falsa\n' +
           '• 4 = Verdadera en su mayor parte\n' +
           '• 5 = Completamente verdadero';
  }

  /**
   * Determina si un test es ITRD basado en su nombre
   */
  static esTestITRD(nombreTest: string): boolean {
    return nombreTest.includes('ITRD') || nombreTest.includes('Inventario Texas');
  }

  /**
   * Determina si es ITRD Pasado
   */
  static esITRDPasado(nombreTest: string): boolean {
    return nombreTest.includes('Pasado') || nombreTest.includes('Parte I');
  }

  /**
   * Determina si es ITRD Presente
   */
  static esITRDPresente(nombreTest: string): boolean {
    return nombreTest.includes('Presente') || nombreTest.includes('Parte II');
  }
}