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
  const { login, loginWithGoogle, loginWithFacebook } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth Client ID desde el backend
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [googleSdkListo, setGoogleSdkListo] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const tokenClientRef = useRef<any>(null);

  // Facebook App ID desde el backend
  const [facebookAppId, setFacebookAppId] = useState<string>('');
  const [facebookSdkListo, setFacebookSdkListo] = useState(false);

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

  // 2. Obtener Facebook App ID
  useEffect(() => {
    let unmounted = false;

    api.getFacebookConfig()
      .then((cfg) => {
        if (unmounted) return;
        const appId = cfg?.appId?.trim() || '';
        setFacebookAppId(appId);
      })
      .catch((e) => console.warn('Error al consultar configuración de Facebook:', e));

    return () => {
      unmounted = true;
    };
  }, []);

  // Escuchar mensaje del pop-up de Facebook
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'FB_AUTH_RESULT') {
        const { accessToken, code, error: fbError } = event.data;
        if (fbError) {
          setError(`Facebook: ${fbError}`);
          setFacebookLoading(false);
          return;
        }

        if (accessToken) {
          setFacebookLoading(true);
          setError(null);
          try {
            await loginWithFacebook({ accessToken });
            navigate('/');
          } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión con Facebook');
          } finally {
            setFacebookLoading(false);
          }
        } else if (code) {
          setFacebookLoading(true);
          setError(null);
          try {
            await loginWithFacebook({
              code,
              redirectUri: `${window.location.origin}/auth/facebook/callback`,
            });
            navigate('/');
          } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión con Facebook');
          } finally {
            setFacebookLoading(false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loginWithFacebook, navigate]);

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

  // Clic en el botón "Continuar con Facebook" (Abre el POPUP OFICIAL DIRECTO DE FACEBOOK OAUTH)
  const handleFacebookClick = () => {
    setError(null);

    if (!facebookAppId) {
      setError(
        'Falta configurar el FACEBOOK_APP_ID en el archivo .env para que Facebook pueda abrir su pop-up oficial.'
      );
      return;
    }

    setFacebookLoading(true);

    const redirectUri = `${window.location.origin}/auth/facebook/callback`;
    const fbOAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      facebookAppId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=public_profile`;

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      fbOAuthUrl,
      'facebook_login_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    if (!popup || popup.closed) {
      setFacebookLoading(false);
      setError('El navegador bloqueó la ventana emergente de Facebook. Por favor permite los pop-ups en la barra de tu navegador.');
      return;
    }

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setFacebookLoading(false);
      }
    }, 1000);
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

        {/* SECCIÓN REDES SOCIALES (GOOGLE Y FACEBOOK LADO A LADO) */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Botón de Google */}
            <button
              type="button"
              onClick={handleCustomGoogleClick}
              disabled={googleLoading || facebookLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-raised px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:border-line-strong hover:bg-surface-strong focus:outline-none focus:ring-2 focus:ring-brand/40 active:scale-[0.98] disabled:opacity-50"
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
              <span>{googleLoading ? 'Google…' : 'Google'}</span>
            </button>

            {/* Botón de Facebook */}
            <button
              type="button"
              onClick={handleFacebookClick}
              disabled={facebookLoading || googleLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface-raised px-3 py-2.5 text-sm font-bold text-ink shadow-sm transition hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/40 active:scale-[0.98] disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-[#1877F2]" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{facebookLoading ? 'Facebook…' : 'Facebook'}</span>
            </button>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 my-1">
            <hr className="flex-1 border-line" />
            <span className="text-[11px] font-bold text-ink-subtle uppercase tracking-wider">
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

        <p className="mt-6 text-center text-xs text-ink-subtle">
          Acceso exclusivo para el personal autorizado · !eben Producciones
        </p>
      </div>
    </div>
  );
}
