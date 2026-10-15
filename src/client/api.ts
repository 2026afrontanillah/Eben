// API Client for the Express REST backend

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMessage = `Error HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // no es json
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async loginWithGoogle(payload: { credential?: string; testEmail?: string; testName?: string }) {
    return request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getGoogleConfig() {
    return request('/api/auth/google/config');
  },

  async logout() {
    return request('/api/auth/logout', { method: 'POST' });
  },

  async getMe() {
    return request('/api/auth/me');
  },

  // Eventos y Zonas
  async getEventoActivo() {
    return request('/api/eventos/activo');
  },

  async getZona(zonaId: string) {
    return request(`/api/zonas/${zonaId}`);
  },

  async getZonaAsientos(zonaId: string) {
    return request(`/api/zonas/${zonaId}/asientos`);
  },

  // Ventas
  async venderGeneral(data: {
    eventoId: string;
    zonaId: string;
    cantidad: number;
    cliente: { nombre: string; celular: string; email?: string };
    pago: { metodo: string; referencia?: string };
  }) {
    return request('/api/ventas/general', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async venderAsientos(data: {
    eventoId: string;
    zonaId: string;
    mesa: number;
    sillas: number[];
    cliente: { nombre: string; celular: string; email?: string };
    pago: { metodo: string; referencia?: string };
  }) {
    return request('/api/ventas/asientos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getVentas(params: { q?: string; desde?: string; hasta?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.desde) qs.set('desde', params.desde);
    if (params.hasta) qs.set('hasta', params.hasta);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return request(`/api/ventas${query}`);
  },

  async getVenta(id: string) {
    return request(`/api/ventas/${id}`);
  },

  async anularVenta(id: string, motivo: string) {
    return request(`/api/ventas/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    });
  },

  // Control de Acceso
  async validarEntrada(lectura: string) {
    return request('/api/control/validar', {
      method: 'POST',
      body: JSON.stringify({ lectura }),
    });
  },

  async getControlStats() {
    return request('/api/control/stats');
  },

  async reiniciarAccesos() {
    return request('/api/control/reiniciar', { method: 'POST' });
  },

  // Admin
  async getAdminResumen(eventoId?: string) {
    const qs = eventoId ? `?eventoId=${eventoId}` : '';
    return request(`/api/admin/resumen${qs}`);
  },

  async updateZona(id: string, data: { precioCentavos?: number | null; habilitada?: boolean }) {
    return request(`/api/admin/zonas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async getAdminUsuarios() {
    return request('/api/admin/usuarios');
  },

  async createUsuario(data: { nombre: string; email: string; password: string; rol: string }) {
    return request('/api/admin/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async toggleUsuario(id: string) {
    return request(`/api/admin/usuarios/${id}/toggle`, { method: 'POST' });
  },
};
