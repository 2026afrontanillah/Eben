import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useRouter } from '../router';
import { api } from '../api';
import { MarcaLogo } from '@/shared/brand/MarcaLogo';
import { MARCA } from '@/shared/brand/marca';
import { TextField } from '@/shared/ui/TextField';
import { Button } from '@/shared/ui/Button';
import { Alert } from '@/shared/ui/Alert';

declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export function LoginView() {
  const { login, loginWithGoogle } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth Client ID desde el backend
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [googleSdkListo, setGoogleSdkListo] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const tokenClientRef = useRef<any>(null);

  // 1. Obtener Google Client ID y cargar SDK oficial de Google
  useEffect(() => {
    let unmounted = false;

    api.getGoogleConfig()
      .then((cfg) => {
        if (unmounted) return;
        const cid = cfg?.clientId?.trim() || '';
        setGoogleClientId(cid);

        // Cargar script oficial de Google Identity Services
        if (!document.getElementById('google-gsi-client')) {
          const script = document.createElement('script');
          script.id = 'google-gsi-client';
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => {
            if (!unmounted) {
              setGoogleSdkListo(true);
            }
          };
          document.body.appendChild(script);
        } else if (window.google?.accounts) {
          setGoogleSdkListo(true);
        }
      })
      .catch((e) => console.warn('Error al consultar configuración de Google:', e));

    return () => {
      unmounted = true;
    };
  }, []);



  // 3. Inicializar Google Identity Services cuando el SDK y el Client ID estén listos
  useEffect(() => {
    if (!googleSdkListo || !googleClientId || !window.google?.accounts) return;

    try {
      // Flujo 1: Google ID Token (Credential)
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setGoogleLoading(true);
            setError(null);
            try {
              await loginWithGoogle({ credential: response.credential });
              navigate('/');
            } catch (err: any) {
              setError(err.message || 'Error al autenticar con Google');
            } finally {
              setGoogleLoading(false);
            }
          }
        },
        auto_select: false,
      });

      // Renderizar el botón oficial nativo de Google (iframe directo de Google)
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 320,
        });
      }

      // Flujo 2: Token Client con prompt 'select_account' para forzar el pop-up de selección de cuentas
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'email profile openid',
        prompt: 'select_account', // Fuerza a Google a mostrar el popup con todas tus cuentas
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            setGoogleLoading(true);
            setError(null);
            try {
              await loginWithGoogle({ accessToken: tokenResponse.access_token });
              navigate('/');
            } catch (err: any) {
              setError(err.message || 'Error al iniciar sesión con Google');
            } finally {
              setGoogleLoading(false);
            }
          }
        },
      });
    } catch (err) {
      console.warn('Error al inicializar Google GIS:', err);
    }
  }, [googleSdkListo, googleClientId]);

  // Clic en el botón personalizado "Continuar con Google"
  const handleCustomGoogleClick = () => {
    setError(null);

    if (!googleClientId) {
      setError(
        'Falta configurar el GOOGLE_CLIENT_ID en el archivo .env para que Google pueda abrir su pop-up oficial.'
      );
      return;
    }

    if (tokenClientRef.current) {
      // Abre el POPUP OFICIAL DE GOOGLE donde muestra todas tus cuentas
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa tu email y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl panel p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <MarcaLogo className="mb-3 size-16" />
          <h1 className="text-2xl font-black text-ink">{MARCA.nombre}</h1>
          <p className="mt-1 text-sm text-ink-muted">Sistema interno de venta de entradas</p>
        </div>

        {error && <Alert tone="error" className="mb-4">{error}</Alert>}

        {/* SECCIÓN GOOGLE */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCustomGoogleClick}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-raised px-4 py-3 text-sm font-bold text-ink shadow-sm transition hover:border-line-strong hover:bg-surface-strong focus:outline-none focus:ring-2 focus:ring-brand/40 active:scale-[0.98] disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-5 shrink-0">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Conectando con Google…' : 'Continuar con Google'}</span>
          </button>

          {/* Separador */}
          <div className="my-1 flex items-center gap-3">
            <hr className="flex-1 border-line" />
            <span className="text-[11px] font-bold tracking-wider text-ink-subtle uppercase">
              O con contraseña
            </span>
            <hr className="flex-1 border-line" />
          </div>
        </div>

        {/* FORMULARIO TRADICIONAL EMAIL / PASSWORD */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-1 text-center text-xs text-ink-subtle">
          <p>Acceso exclusivo para el personal autorizado · !eben Producciones</p>
          <span className="text-[10px] font-semibold tracking-wider text-ink-muted/70 uppercase">
            ver. 1.0
          </span>
        </div>
      </div>
    </div>
  );
}
