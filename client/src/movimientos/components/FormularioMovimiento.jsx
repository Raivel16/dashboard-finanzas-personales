import { TIPOS_MOVIMIENTO } from '@finanzas/shared';
import { Aviso } from '../../shared/components/Aviso.jsx';
import { Boton } from '../../shared/components/Boton.jsx';
import { Campo } from '../../shared/components/Campo.jsx';
import { Selector } from '../../shared/components/Selector.jsx';

const ETIQUETAS_TIPO = { [TIPOS_MOVIMIENTO.GASTO]: 'Gasto', [TIPOS_MOVIMIENTO.INGRESO]: 'Ingreso' };

/** Registrar o editar un movimiento: el monto va primero (en el celular abre el teclado numérico). */
export function FormularioMovimiento({
  formulario,
  errorGeneral,
  editando,
  hoy,
  cambiarTipo,
  categoriasDelTipo,
  cuentas,
  alCancelar,
}) {
  const { enviar, enviando, formularioRef, propsCampo } = formulario;
  const textoEnviar = editando ? 'Guardar cambios' : 'Registrar movimiento';
  return (
    <form ref={formularioRef} onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}
      <Selector
        etiqueta="Tipo"
        props={propsCampo('tipo')}
        onChange={cambiarTipo}
        opciones={Object.entries(ETIQUETAS_TIPO)}
      />
      <Campo
        {...propsCampo('monto')}
        etiqueta="Monto"
        inputMode="decimal"
        autoComplete="off"
        autoFocus
        placeholder="0.00"
      />
      <Selector
        etiqueta="Categoría"
        props={propsCampo('categoriaId')}
        vacio="Selecciona una categoría"
        opciones={categoriasDelTipo.map((c) => [c.id, c.nombre])}
      />
      <Selector
        etiqueta="Cuenta"
        props={propsCampo('cuentaId')}
        vacio="Selecciona una cuenta"
        opciones={cuentas.map((c) => [c.id, `${c.nombre} (${c.moneda})`])}
      />
      <Campo {...propsCampo('fecha')} etiqueta="Fecha" tipo="date" max={hoy} />
      <Campo {...propsCampo('descripcion')} etiqueta="Descripción (opcional)" maxLength={255} autoComplete="off" />
      <div className="flex gap-2">
        <Boton type="submit" variante="primario" disabled={enviando}>
          {enviando ? 'Guardando…' : textoEnviar}
        </Boton>
        <Boton onClick={alCancelar}>Cancelar</Boton>
      </div>
    </form>
  );
}
