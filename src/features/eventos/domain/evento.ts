export interface PlanoEvento {
  columnas: string;
  filas: string;
}

export interface Evento {
  id: string;
  slug: string;
  nombre: string;
  lugar: string | null;
  fecha: Date | null;
  plano: PlanoEvento;
}
