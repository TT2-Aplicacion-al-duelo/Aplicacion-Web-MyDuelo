import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;  // 12 bytes para GCM (recomendado)
const AUTH_TAG_LENGTH = 16; // 16 bytes

/**
 * Obtener la clave de cifrado desde variables de entorno
 * @returns Buffer de 32 bytes
 */
function getChatAESKey(): Buffer {
  const keyHex = process.env.CHAT_AES_KEY;
  
  if (!keyHex) {
    throw new Error('CHAT_AES_KEY no está configurada en las variables de entorno');
  }

  if (keyHex.length !== 64) {
    throw new Error('CHAT_AES_KEY debe tener exactamente 64 caracteres hexadecimales (32 bytes)');
  }

  try {
    return Buffer.from(keyHex, 'hex');
  } catch (error) {
    throw new Error('CHAT_AES_KEY debe ser una cadena hexadecimal válida');
  }
}

/**
 * Cifrar un mensaje de texto plano
 * @param plainText Texto a cifrar
 * @returns Objeto con iv, ciphertext y authTag (todo en hexadecimal)
 */
export function encryptMessage(plainText: string): { 
  iv: string; 
  ciphertext: string; 
  authTag: string;
  encrypted: string; // Formato completo: iv:ciphertext:authTag
} {
  try {
    // Generar IV aleatorio de 12 bytes
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Obtener la clave de cifrado
    const key = getChatAESKey();
    
    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Cifrar el mensaje
    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    
    // Obtener el auth tag
    const authTag = cipher.getAuthTag();
    
    // Convertir a hexadecimal
    const ivHex = iv.toString('hex');
    const authTagHex = authTag.toString('hex');
    
    // Formato de almacenamiento: iv:ciphertext:authTag
    const encrypted = `${ivHex}:${ciphertext}:${authTagHex}`;
    
    return {
      iv: ivHex,
      ciphertext: ciphertext,
      authTag: authTagHex,
      encrypted: encrypted
    };
    
  } catch (error: any) {
    console.error('Error al cifrar mensaje:', error);
    throw new Error(`Error al cifrar mensaje: ${error.message}`);
  }
}

/**
 * Descifrar un mensaje cifrado
 * @param encrypted Mensaje cifrado en formato "iv:ciphertext:authTag"
 * @returns Texto descifrado en plano
 */
export function decryptMessage(encrypted: string): string {
  try {
    // Verificar que el mensaje tenga el formato correcto
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      // Si no tiene el formato de cifrado, asumir que es un mensaje antiguo sin cifrar
      console.log('Mensaje sin formato de cifrado, retornando tal cual');
      return encrypted;
    }
    
    const [ivHex, ciphertext, authTagHex] = parts;
    
    // Validar longitudes
    if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) {
      console.log('Longitudes de IV o AuthTag incorrectas, retornando tal cual');
      return encrypted;
    }
    
    // Convertir de hexadecimal a Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Obtener la clave de cifrado
    const key = getChatAESKey();
    
    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Descifrar el mensaje
    let plainText = decipher.update(ciphertext, 'hex', 'utf8');
    plainText += decipher.final('utf8');
    
    return plainText;
    
  } catch (error: any) {
    // Si falla el descifrado, probablemente es un mensaje antiguo sin cifrar
    console.error('Error al descifrar mensaje (posiblemente mensaje antiguo):', error.message);
    return encrypted; // Retornar el mensaje tal cual
  }
}

/**
 * Verificar si un mensaje está cifrado
 * @param content Contenido del mensaje
 * @returns true si está cifrado, false si no
 */
export function isEncrypted(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  const parts = content.split(':');
  
  // Verificar que tenga 3 partes y las longitudes correctas
  if (parts.length === 3) {
    const [ivHex, , authTagHex] = parts;
    return ivHex.length === IV_LENGTH * 2 && authTagHex.length === AUTH_TAG_LENGTH * 2;
  }
  
  return false;
}

/**
 * Procesar un array de mensajes para descifrarlos
 * @param mensajes Array de mensajes con propiedad 'contenido'
 * @returns Array de mensajes con contenido descifrado
 */
export function decryptMessages<T extends { contenido: string }>(mensajes: T[]): T[] {
  return mensajes.map(mensaje => ({
    ...mensaje,
    contenido: isEncrypted(mensaje.contenido) 
      ? decryptMessage(mensaje.contenido) 
      : mensaje.contenido
  }));
}
