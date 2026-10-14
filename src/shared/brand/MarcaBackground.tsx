import { MARCA } from './marca';

/**
 * La foto queda muy atenuada y cubierta por un degradado para que los formularios y tablas
 * mantengan el contraste necesario al operar el sistema.
 */
export function MarcaBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <img
        src={MARCA.fondo}
        alt=""
        className="h-full w-full object-cover object-[80%_center] opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-canvas/30 via-canvas/75 to-canvas" />
    </div>
  );
}
