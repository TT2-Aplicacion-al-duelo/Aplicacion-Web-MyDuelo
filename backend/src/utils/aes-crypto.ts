import * as crypto from 'crypto';

// ========== CONSTANTES APP MÓVIL ==========
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_MOBILE = 16;  // App móvil usa 16 bytes
const SALT_LENGTH = 64;        // App móvil usa salt de 64 bytes
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH_MOBILE;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// ========== CONSTANTES WEB (opcional) ==========
const IV_LENGTH_WEB = 12;     // GCM recomienda 12 bytes

/**
 * Obtener la clave de cifrado desde variables de entorno
 */
function getChatAESSecret(): string {
  const secret = process.env.CHAT_AES_KEY;
  
  if (!secret) {
    throw new Error('❌ CHAT_AES_KEY no está configurada en las variables de entorno');
  }

  // La app móvil usa esta clave como string directamente (no como hex)
  // Así que la usamos tal cual para PBKDF2
  return secret;
}

/**
 * Derivar clave usando PBKDF2 (igual que la app móvil)
 */
function deriveKey(salt: Buffer): Buffer {
  const secret = getChatAESSecret();
  return crypto.pbkdf2Sync(secret, salt, 100000, 32, 'sha512');
}

/**
 * ============================================
 * CIFRAR MENSAJE (FORMATO APP MÓVIL)
 * ============================================
 * 
 * Usa el mismo formato que la app móvil para compatibilidad total
 */
export function encryptMessage(plainText: string): { 
  encrypted: string;
  iv: string;
  ciphertext: string;
  authTag: string;
} {
  try {
    // Generar IV y salt aleatorios (igual que app móvil)
    const iv = crypto.randomBytes(IV_LENGTH_MOBILE);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derivar clave con PBKDF2 (igual que app móvil)
    const key = deriveKey(salt);

    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Cifrar el mensaje
    const encrypted = Buffer.concat([
      cipher.update(String(plainText), 'utf8'),
      cipher.final(),
    ]);

    // Obtener auth tag
    const tag = cipher.getAuthTag();

    // Formato app móvil: salt + iv + tag + encrypted (todo en Base64)
    const fullEncrypted = Buffer.concat([salt, iv, tag, encrypted]).toString('base64');

    console.log('🔐 Mensaje cifrado (formato app móvil)');

    return {
      encrypted: fullEncrypted,
      iv: iv.toString('hex'),
      ciphertext: encrypted.toString('hex'),
      authTag: tag.toString('hex')
    };

  } catch (error: any) {
    console.error('❌ Error al cifrar mensaje:', error);
    throw new Error(`Error al cifrar mensaje: ${error.message}`);
  }
}

/**
 * ============================================
 * DESCIFRAR MENSAJE (DETECTA FORMATO AUTOMÁTICAMENTE)
 * ============================================
 * 
 * Detecta y descifra:
 * 1. Formato app móvil (Base64 sin separadores)
 * 2. Formato web anterior (hex con :)
 * 3. Mensajes sin cifrar (texto plano)
 */
export function decryptMessage(encrypted: string): string {
  if (!encrypted || typeof encrypted !== 'string') {
    return encrypted;
  }

  try {
    // ========== DETECTAR FORMATO ==========
    
    // Formato 1: Web anterior (tiene ":")
    if (encrypted.includes(':')) {
      return decryptWebFormat(encrypted);
    }
    
    // Formato 2: App móvil (Base64 puro, sin ":")
    // Verificar que parece Base64 y tiene longitud adecuada
    if (isLikelyBase64(encrypted) && encrypted.length > 100) {
      return decryptMobileFormat(encrypted);
    }
    
    // Formato 3: Sin cifrar (mensaje antiguo)
    console.log('⚠️ Mensaje sin formato de cifrado reconocido, retornando tal cual');
    return encrypted;

  } catch (error: any) {
    console.error('⚠️ Error al descifrar mensaje, retornando original:', error.message);
    return encrypted; // Fallback: devolver el mensaje original
  }
}

/**
 * Descifrar formato app móvil (Base64 con PBKDF2 + salt)
 */
function decryptMobileFormat(cipherText: string): string {
  try {
    // Decodificar de Base64
    const buffer = Buffer.from(cipherText, 'base64');

    // Verificar longitud mínima
    if (buffer.length < ENCRYPTED_POSITION) {
      throw new Error('Longitud de buffer insuficiente para formato móvil');
    }

    // Extraer componentes (igual que app móvil)
    const salt = buffer.slice(0, SALT_LENGTH);
    const iv = buffer.slice(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = buffer.slice(ENCRYPTED_POSITION);

    // Derivar clave con PBKDF2 (igual que app móvil)
    const key = deriveKey(salt);

    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Descifrar
    const decrypted = decipher.update(encrypted) + decipher.final('utf8');

    console.log('✅ Mensaje descifrado (formato app móvil)');
    return decrypted;

  } catch (error: any) {
    console.error('❌ Error al descifrar formato móvil:', error.message);
    throw error;
  }
}

/**
 * Descifrar formato web anterior (hex con separadores :)
 * Mantener por si hay mensajes antiguos del formato anterior
 */
function decryptWebFormat(encrypted: string): string {
  try {
    const parts = encrypted.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Formato web incorrecto (debe tener 3 partes separadas por :)');
    }
    
    const [ivHex, ciphertext, authTagHex] = parts;
    
    // Validar longitudes aproximadas
    if (ivHex.length < 20 || authTagHex.length < 30) {
      throw new Error('Longitudes de IV o AuthTag incorrectas en formato web');
    }
    
    // Convertir de hex a Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Obtener clave directamente (formato web no usa PBKDF2)
    const keyHex = process.env.CHAT_AES_KEY;
    if (!keyHex || keyHex.length !== 64) {
      throw new Error('CHAT_AES_KEY inválida para formato web');
    }
    const key = Buffer.from(keyHex, 'hex');
    
    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Descifrar
    let plainText = decipher.update(ciphertext, 'hex', 'utf8');
    plainText += decipher.final('utf8');
    
    console.log('✅ Mensaje descifrado (formato web)');
    return plainText;
    
  } catch (error: any) {
    console.error('❌ Error al descifrar formato web:', error.message);
    throw error;
  }
}

/**
 * Verificar si un string parece ser Base64
 */
function isLikelyBase64(str: string): boolean {
  // Base64 solo contiene: A-Z, a-z, 0-9, +, /, =
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(str);
}

/**
 * Verificar si un mensaje está cifrado
 */
export function isEncrypted(content: string): boolean {
  if (!content || typeof content !== 'string') {
    return false;
  }
  
  // Es formato web (con :)
  if (content.includes(':')) {
    const parts = content.split(':');
    return parts.length === 3;
  }
  
  // Es formato móvil (Base64 largo)
  if (isLikelyBase64(content) && content.length > 100) {
    return true;
  }
  
  return false;
}

/**
 * Descifrar múltiples mensajes
 */
export function decryptMessages<T extends { contenido: string }>(mensajes: T[]): T[] {
  return mensajes.map(mensaje => {
    try {
      return {
        ...mensaje,
        contenido: isEncrypted(mensaje.contenido) 
          ? decryptMessage(mensaje.contenido) 
          : mensaje.contenido
      };
    } catch (error) {
      console.error('⚠️ Error al descifrar mensaje individual, dejando original:', error);
      return mensaje; // Si falla, dejar el mensaje sin cambios
    }
  });
}