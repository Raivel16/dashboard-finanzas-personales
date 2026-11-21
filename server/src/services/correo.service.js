// Correo con Nodemailer. Sin SMTP configurado (solo desarrollo y pruebas) los correos se escriben en el log.
// En producción SMTP_HOST es obligatorio (ver config/entorno.js): nunca se registra el contenido de un correo.
import nodemailer from 'nodemailer';

/**
 * @param {object} opciones
 * @param {object} opciones.config  configuración validada (smtp, correoRemitente)
 * @param {object} opciones.logger  logger pino
 * @param {object} [opciones.transporte]  transporte ya creado (se inyecta uno simulado en pruebas)
 */
export function crearServicioCorreo({ config, logger, transporte }) {
  const usaSmtp = Boolean(transporte || config.smtp);
  const canal =
    transporte ??
    (config.smtp
      ? nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.puerto,
          secure: config.smtp.puerto === 465,
          auth: { user: config.smtp.usuario, pass: config.smtp.clave },
        })
      : null);

  return {
    /** @returns {Promise<{ enviado: boolean, modo: 'smtp' | 'log' }>} */
    async enviar({ para, asunto, texto, html }) {
      if (!usaSmtp) {
        if (config.esProduccion) throw new Error('No se puede enviar correo: SMTP no está configurado');
        // El texto (p. ej. el enlace de recuperación) solo se escribe en desarrollo, para probar sin cuenta SMTP.
        const registro = config.entorno === 'development' ? { para, asunto, texto } : { para, asunto };
        logger.info(registro, 'correo simulado (SMTP_HOST no está definido)');
        return { enviado: false, modo: 'log' };
      }
      await canal.sendMail({ from: config.correoRemitente, to: para, subject: asunto, text: texto, html });
      return { enviado: true, modo: 'smtp' };
    },
  };
}
