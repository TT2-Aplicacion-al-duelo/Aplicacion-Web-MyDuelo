import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;       // 12 bytes para GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes

/**
 * Obtener la clave AES desde variable de entorno
 */
function getChatAESKey(): Buffer {
  const keyHex = process.env.CHAT_AES_KEY;
  
  if (!keyHex) {
    throw new Error('❌ CHAT_AES_KEY no está configurada en las variables de entorno');
  }

  if (keyHex.length !== 64) {
    throw new Error(`❌ CHAT_AES_KEY debe tener exactamente 64 caracteres hex (tiene ${keyHex.length})`);
  }

  try {
    return Buffer.from(keyHex, 'hex');
  } catch (error) {
    throw new Error('❌ CHAT_AES_KEY debe ser una cadena hexadecimal válida');
  }
}

/**
 * ============================================
 * CIFRAR MENSAJE - RÉPLICA EXACTA DE APP MÓVIL
 * ============================================
 * 
 * Implementación idéntica a cryptoUtils.encryptMessage()
 */
export function encryptMessage(text: string): { 
  encrypted: string;
  iv: string;
  tag: string;
  ciphertext: string;
} {
  try {
    const AES_KEY = getChatAESKey();
    
    // 1. Generar IV aleatorio de 12 bytes
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 2. Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, iv);
    
    // 3. Cifrar el texto
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    // 4. Obtener auth tag
    const tag = cipher.getAuthTag();
    
    // 5. Formato app móvil: iv:tag:encrypted (todo en hex)
    const result = `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    
    console.log('🔐 Mensaje cifrado (formato app móvil)');

    return {
      encrypted: result,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      ciphertext: encrypted.toString('hex')
    };

  } catch (error: any) {
    console.error('❌ Error al cifrar mensaje:', error);
    throw new Error(`Error al cifrar mensaje: ${error.message}`);
  }
}

/**
 * ============================================
 * DESCIFRAR MENSAJE - RÉPLICA EXACTA DE APP MÓVIL
 * ============================================
 * 
 * Implementación idéntica a cryptoUtils.decryptMessage()
 */
export function decryptMessage(data: string): string {
  try {
    // Verificar que el mensaje tenga contenido
    if (!data || typeof data !== 'string') {
      console.log('⚠️ Mensaje vacío o inválido');
      return data;
    }

    // Verificar que tenga el formato correcto (iv:tag:encrypted)
    const parts = (data || '').split(':');
    
    if (parts.length !== 3) {
      // Si no tiene el formato de cifrado, es un mensaje sin cifrar
      console.log('⚠️ Mensaje sin formato de cifrado (no tiene 3 partes), retornando tal cual');
      return data;
    }

    const [ivHex, tagHex, encHex] = parts;

    // Validar longitudes esperadas
    if (ivHex.length !== IV_LENGTH * 2) {
      console.log(`⚠️ IV con longitud incorrecta: ${ivHex.length} (esperado: ${IV_LENGTH * 2})`);
      return data;
    }

    if (tagHex.length !== AUTH_TAG_LENGTH * 2) {
      console.log(`⚠️ Tag con longitud incorrecta: ${tagHex.length} (esperado: ${AUTH_TAG_LENGTH * 2})`);
      return data;
    }

    // Convertir de hex a Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encryptedText = Buffer.from(encHex, 'hex');

    // Obtener clave
    const AES_KEY = getChatAESKey();

    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, AES_KEY, iv);
    decipher.setAuthTag(tag);

    // Descifrar
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final()
    ]);

    const result = decrypted.toString('utf8');
    
    console.log(`✅ Mensaje descifrado exitosamente (${result.length} caracteres)`);
    return result;

  } catch (error: any) {
    console.error('❌ Error al descifrar mensaje:', error.message);
    console.error('⚠️ Retornando mensaje original: [Mensaje ilegible]');
    return '[Mensaje ilegible]';
  }
}

/**
 * Verificar si un mensaje está cifrado
 */
export function isEncrypted(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  const parts = content.split(':');
  
  // Debe tener exactamente 3 partes
  if (parts.length !== 3) {
    return false;
  }

  const [ivHex, tagHex, encHex] = parts;
  
  // Verificar longitudes esperadas
  if (ivHex.length !== IV_LENGTH * 2 || tagHex.length !== AUTH_TAG_LENGTH * 2) {
    return false;
  }

  // Verificar que sean strings hexadecimales válidos
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(ivHex) && hexRegex.test(tagHex) && hexRegex.test(encHex);
}

/**
 * Descifrar múltiples mensajes
 */
export function decryptMessages<T extends { contenido: string }>(mensajes: T[]): T[] {
  return mensajes.map(mensaje => {
    try {
      const contenidoOriginal = mensaje.contenido;
      
      if (isEncrypted(contenidoOriginal)) {
        const descifrado = decryptMessage(contenidoOriginal);
        
        // Solo logear si no es "[Mensaje ilegible]"
        if (descifrado !== '[Mensaje ilegible]') {
          const preview = descifrado.length > 50 ? descifrado.substring(0, 50) + '...' : descifrado;
          console.log(`📝 Mensaje descifrado: "${preview}"`);
        }
        
        return {
          ...mensaje,
          contenido: descifrado
        };
      } else {
        console.log(`📝 Mensaje sin cifrar (${contenidoOriginal.length} caracteres)`);
        return mensaje;
      }
    } catch (error: any) {
      console.error('⚠️ Error al descifrar mensaje individual:', error.message);
      return {
        ...mensaje,
        contenido: '[Mensaje ilegible]'
      };
    }
  });
}