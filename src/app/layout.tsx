import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { MARCA } from '@/shared/brand/marca';
import { MarcaBackground } from '@/shared/brand/MarcaBackground';

import './globals.css';

export const metadata: Metadata = {
  title: { default: `${MARCA.nombreCorto} · Entradas`, template: `%s · ${MARCA.nombreCorto}` },
  description: `Venta interna de entradas para relacionadores y vendedores de ${MARCA.nombre}.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#050506',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="relative isolate min-h-dvh">
        <MarcaBackground />
        {children}
      </body>
    </html>
  );
}
