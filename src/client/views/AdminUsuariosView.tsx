import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { formatearFechaHora } from '@/shared/format/fecha';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { TextField } from '@/shared/ui/TextField';
import { SelectField } from '@/shared/ui/SelectField';
import { Alert } from '@/shared/ui/Alert';

export function AdminUsuariosView() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Formulario nuevo usuario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('VENDEDOR');
  const [creando, setCreando] = useState(false);

  const cargarUsuarios = async () => {
    try {
      const data = await api.getAdminUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleToggle = async (u: any) => {
    if (u.id === currentUser?.id) {
      alert('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }

    try {
      await api.toggleUsuario(u.id);
      await cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar estado del usuario');
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      setError('Todos los campos son requeridos');
      return;
    }

    setCreando(true);
    setError(null);
    try {
      await api.createUsuario({
        nombre: nombre.trim(),
        email: email.trim(),
        password: password.trim(),
        rol,
      });
      setMensaje(`Usuario "${nombre}" creado con éxito.`);
      setModalNuevo(false);
      setNombre('');
      setEmail('');
      setPassword('');
      await cargarUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario');
    } finally {
      setCreando(false);
    }
  };

  const rolesMap: Record<string, string> = {
    ADMIN: 'Administrador',
    VENDEDOR: 'Vendedor',
    RELACIONADOR: 'Relacionador',
    CONTROL: 'Control de acceso',
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestión del Equipo"
        eyebrow="USUARIOS Y ROLES"
        description="Administra las cuentas de vendedores, relacionadores y personal de control de acceso."
        actions={
          <Button onClick={() => setModalNuevo(true)}>
            + Nuevo usuario
          </Button>
        }
      />

      {mensaje && <Alert tone="success">{mensaje}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          <table className="w-full text-left text-sm text-ink">
            <thead className="border-b border-line bg-surface-raised text-xs font-bold text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 sm:px-6">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right sm:px-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {usuarios.map((u) => {
                const esYo = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="transition hover:bg-surface-raised/60">
                    <td className="px-4 py-3.5 font-bold sm:px-6">
                      {u.nombre} {esYo && <span className="text-xs text-brand">(Tú)</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-muted">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <Badge tone="neutral">{rolesMap[u.rol] || u.rol}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-subtle">
                      {formatearFechaHora(u.creadoEn)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge tone={u.activo ? 'success' : 'danger'}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right sm:px-6">
                      {!esYo && (
                        <button
                          type="button"
                          onClick={() => handleToggle(u)}
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                            u.activo
                              ? 'border-danger/40 text-danger hover:bg-danger/10'
                              : 'border-success/40 text-success hover:bg-success/10'
                          }`}
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL CREAR USUARIO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-black text-ink">Crear nuevo usuario</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Define los datos de acceso y el nivel de permisos en el sistema.
            </p>

            <form onSubmit={handleCrearUsuario} className="mt-4 flex flex-col gap-4">
              <TextField
                label="Nombre completo"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />

              <TextField
                label="Correo electrónico"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <TextField
                label="Contraseña inicial"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <SelectField
                label="Rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
              >
                <option value="VENDEDOR">Vendedor (Vender y ver sus propias ventas)</option>
                <option value="RELACIONADOR">Relacionador (Vender y ver sus propias ventas)</option>
                <option value="CONTROL">Control de acceso (Solo validar en puerta)</option>
                <option value="ADMIN">Administrador (Acceso total)</option>
              </SelectField>

              <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalNuevo(false)}
                  disabled={creando}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={creando}>
                  Crear usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
