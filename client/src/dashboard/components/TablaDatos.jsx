/** Los mismos datos de un gráfico en una tabla, para quien no puede o no quiere usar el gráfico. */
export function TablaDatos({ resumen, columnas, filas }) {
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-sello">{resumen}</summary>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            {columnas.map((columna, indice) => (
              <th
                key={columna}
                scope="col"
                className={`border-b border-filete py-1.5 font-medium text-tinta-suave ${indice === 0 ? 'text-left' : 'text-right'}`}
              >
                {columna}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila[0]}>
              {fila.map((celda, indice) => (
                <td
                  key={columnas[indice]}
                  className={`border-b border-filete py-1.5 ${indice === 0 ? 'text-left' : 'text-right font-mono tabular-nums'}`}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
