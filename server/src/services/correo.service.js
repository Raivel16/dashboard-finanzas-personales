// Correo con Nodemailer. Sin SMTP configurado (desarrollo sin cuenta) los correos se escriben en el log.
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
        // Solo desarrollo: el contenido (p. ej. el enlace de recuperación) queda en el log.
        logger.info({ para, asunto, texto }, 'correo simulado (SMTP_HOST no está definido)');
        return { enviado: false, modo: 'log' };
      }
      await canal.sendMail({ from: config.correoRemitente, to: para, subject: asunto, text: texto, html });
      return { enviado: true, modo: 'smtp' };
    },
  };
}
