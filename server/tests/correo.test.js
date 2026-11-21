import { jest } from '@jest/globals';
import { crearServicioCorreo } from '../src/services/correo.service.js';
import { configPrueba } from './helpers/entorno.js';

const correo = {
  para: 'ana@correo.com',
  asunto: 'Recupera tu contraseña',
  texto: 'Enlace: http://localhost/reset/abc',
};

describe('servicio de correo (Nodemailer)', () => {
  it('sin SMTP_HOST escribe el correo en el log y no envía nada', async () => {
    const logger = { info: jest.fn() };
    const servicio = crearServicioCorreo({ config: configPrueba(), logger });

    const resultado = await servicio.enviar(correo);

    expect(resultado).toEqual({ enviado: false, modo: 'log' });
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info.mock.calls[0][0]).toMatchObject({
      para: correo.para,
      asunto: correo.asunto,
      texto: correo.texto,
    });
  });

  it('con un transporte simulado envía con el remitente configurado', async () => {
    const transporte = { sendMail: jest.fn().mockResolvedValue({ messageId: 'x' }) };
    const config = configPrueba({
      SMTP_HOST: 'smtp.ejemplo.com',
      SMTP_USER: 'usuario',
      SMTP_PASS: 'clave',
      MAIL_FROM: 'Finanzas <no-responder@ejemplo.com>',
    });
    const servicio = crearServicioCorreo({ config, logger: { info: jest.fn() }, transporte });

    const resultado = await servicio.enviar({ ...correo, html: '<p>Hola</p>' });

    expect(resultado).toEqual({ enviado: true, modo: 'smtp' });
    expect(transporte.sendMail).toHaveBeenCalledWith({
      from: 'Finanzas <no-responder@ejemplo.com>',
      to: correo.para,
      subject: correo.asunto,
      text: correo.texto,
      html: '<p>Hola</p>',
    });
  });

  it('propaga el error si el proveedor rechaza el envío', async () => {
    const transporte = { sendMail: jest.fn().mockRejectedValue(new Error('SMTP caído')) };
    const servicio = crearServicioCorreo({ config: configPrueba(), logger: { info: jest.fn() }, transporte });
    await expect(servicio.enviar(correo)).rejects.toThrow('SMTP caído');
  });
});
