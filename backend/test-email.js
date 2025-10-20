// backend/test-email.js
// Script para probar la configuración de email

require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🧪 Probando configuración de email...\n');
console.log('📋 Configuración leída del .env:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Configurada (oculta por seguridad)' : '❌ NO CONFIGURADA');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.hostinger.com');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '465');
console.log('\n');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('❌ ERROR: EMAIL_USER o EMAIL_PASSWORD no están en el .env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // SSL/TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true, // Mostrar logs detallados
  logger: true // Mostrar información de depuración
});

console.log('🔄 Verificando conexión con el servidor SMTP...\n');

transporter.verify(function(error, success) {
  if (error) {
    console.log('\n❌ ERROR DE CONEXIÓN:');
    console.log('Código:', error.code);
    console.log('Respuesta:', error.response);
    console.log('\n🔧 POSIBLES SOLUCIONES:');
    console.log('1. Verifica que EMAIL_USER y EMAIL_PASSWORD sean correctos');
    console.log('2. Asegúrate de usar la contraseña del CORREO, no de Hostinger');
    console.log('3. Verifica que no haya comillas en el .env');
    console.log('4. Intenta resetear la contraseña del correo en Hostinger');
    console.log('5. Contacta al soporte de Hostinger si persiste');
  } else {
    console.log('\n✅ ¡ÉXITO! El servidor está listo para enviar correos');
    console.log('\n🧪 Enviando correo de prueba...');
    
    // Enviar un correo de prueba
    transporter.sendMail({
      from: `"MiDuelo App Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Enviar a ti mismo
      subject: 'Prueba de Configuración de Email ✅',
      html: `
        <h2>¡Felicidades!</h2>
        <p>La configuración de email está funcionando correctamente.</p>
        <p>Este correo fue enviado desde: <strong>${process.env.EMAIL_USER}</strong></p>
        <p>Fecha: <strong>${new Date().toLocaleString()}</strong></p>
      `,
      text: '¡La configuración de email funciona correctamente!'
    }, (error, info) => {
      if (error) {
        console.log('\n❌ Error al enviar correo de prueba:', error);
      } else {
        console.log('\n✅ ¡Correo de prueba enviado exitosamente!');
        console.log('ID del mensaje:', info.messageId);
        console.log('\n📬 Revisa tu bandeja de entrada en:', process.env.EMAIL_USER);
      }
    });
  }
});