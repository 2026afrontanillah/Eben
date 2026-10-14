import { NextResponse, type NextRequest } from 'next/server';

import { getUsuarioActual } from '@/features/auth/server/current-user';
import { EntradaDeVentaNoEncontradaError, VentaNoEncontradaError } from '@/features/ventas/domain/ventas.errors';
import { getContainer } from '@/server/container';
import { DomainError } from '@/shared/errors/domain-error';
import { logger } from '@/shared/logging/logger';

interface PdfRouteContext {
  params: Promise<{ ventaId: string }>;
}

function errorResponse(mensaje: string, status: number): NextResponse {
  return NextResponse.json({ error: mensaje }, { status });
}

export async function GET(request: NextRequest, { params }: PdfRouteContext): Promise<NextResponse> {
  const usuario = await getUsuarioActual();
  if (!usuario) {
    return errorResponse('Tu sesión expiró. Vuelve a iniciar sesión.', 401);
  }

  const { ventaId } = await params;
  const entradaId = request.nextUrl.searchParams.get('entradaId');

  try {
    const pdf = await getContainer().generarPdfVenta.ejecutar(usuario, ventaId, entradaId);
    return new NextResponse(Buffer.from(pdf.contenido), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdf.nombreArchivo}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof VentaNoEncontradaError || error instanceof EntradaDeVentaNoEncontradaError) {
      return errorResponse(error.message, 404);
    }
    if (error instanceof DomainError) {
      return errorResponse(error.message, 409);
    }
    logger.error('GET /api/ventas/[ventaId]/pdf', error);
    return errorResponse('No se pudo generar el PDF.', 500);
  }
}
