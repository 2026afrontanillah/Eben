export const ROLES = ['ADMIN', 'VENDEDOR', 'RELACIONADOR', 'CONTROL'] as const;

export type Rol = (typeof ROLES)[number];

export const ETIQUETAS_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  RELACIONADOR: 'Relacionador',
  CONTROL: 'Control de acceso',
};
