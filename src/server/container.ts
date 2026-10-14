import 'server-only';

import { AuthService } from '@/features/auth/application/auth.service';
import { PrismaCredencialesRepository } from '@/features/auth/data/prisma-credenciales.repository';
import { PrismaSesionesRepository } from '@/features/auth/data/prisma-sesiones.repository';
import { ScryptPasswordHasher } from '@/features/auth/data/scrypt-password-hasher';
import { AsientosService } from '@/features/asientos/application/asientos.service';
import { PrismaAsientosRepository } from '@/features/asientos/data/prisma-asientos.repository';
import { EntradaQrSigner } from '@/features/entradas/application/entrada-qr-signer';
import { EntradasPdfRenderer } from '@/features/entradas/application/entradas-pdf.renderer';
import { ValidarEntradaUseCase } from '@/features/entradas/application/validar-entrada.use-case';
import { PrismaControlAccesoRepository } from '@/features/entradas/data/prisma-control-acceso.repository';
import { ConfigurarZonaUseCase } from '@/features/eventos/application/configurar-zona.use-case';
import { EventosService } from '@/features/eventos/application/eventos.service';
import { PrismaEventosRepository } from '@/features/eventos/data/prisma-eventos.repository';
import { PrismaZonasRepository } from '@/features/eventos/data/prisma-zonas.repository';
import { ObtenerResumenVentasUseCase } from '@/features/reportes/application/obtener-resumen-ventas.use-case';
import { PrismaReportesRepository } from '@/features/reportes/data/prisma-reportes.repository';
import { CambiarEstadoUsuarioUseCase } from '@/features/usuarios/application/cambiar-estado-usuario.use-case';
import { CrearUsuarioUseCase } from '@/features/usuarios/application/crear-usuario.use-case';
import { ListarUsuariosUseCase } from '@/features/usuarios/application/listar-usuarios.use-case';
import { PrismaUsuariosRepository } from '@/features/usuarios/data/prisma-usuarios.repository';
import { AnularVentaUseCase } from '@/features/ventas/application/anular-venta.use-case';
import { ConsultaVentasService } from '@/features/ventas/application/consulta-ventas.service';
import { GenerarPdfVentaUseCase } from '@/features/ventas/application/generar-pdf-venta.use-case';
import { VenderAsientosUseCase } from '@/features/ventas/application/vender-asientos.use-case';
import { VenderEntradasGeneralesUseCase } from '@/features/ventas/application/vender-entradas-generales.use-case';
import { PrismaAnulacionVentasRepository } from '@/features/ventas/data/prisma-anulacion-ventas.repository';
import { PrismaConsultaVentasRepository } from '@/features/ventas/data/prisma-consulta-ventas.repository';
import { PrismaRegistroVentasRepository } from '@/features/ventas/data/prisma-registro-ventas.repository';
import { generateRandomCode } from '@/shared/crypto/random-code';

import { loadBrandLogoPng } from './brand/load-brand-logo';
import { getEnv } from './config/env';
import { getPrisma } from './db/prisma';

const LONGITUD_SUFIJO_VENTA = 8;

function createContainer() {
  const prisma = getPrisma();
  const passwordHasher = new ScryptPasswordHasher();
  const qrSigner = new EntradaQrSigner(getEnv().QR_ENTRADAS_SECRET);
  const generarSufijoVenta = () => generateRandomCode(LONGITUD_SUFIJO_VENTA);

  const zonasRepository = new PrismaZonasRepository(prisma);
  const registroVentasRepository = new PrismaRegistroVentasRepository(prisma);
  const usuariosRepository = new PrismaUsuariosRepository(prisma);
  const consultaVentas = new ConsultaVentasService(new PrismaConsultaVentasRepository(prisma), qrSigner);

  return {
    authService: new AuthService(
      new PrismaCredencialesRepository(prisma),
      new PrismaSesionesRepository(prisma),
      passwordHasher,
    ),
    eventosService: new EventosService(new PrismaEventosRepository(prisma), zonasRepository),
    configurarZona: new ConfigurarZonaUseCase(zonasRepository),
    asientosService: new AsientosService(new PrismaAsientosRepository(prisma)),
    venderEntradasGenerales: new VenderEntradasGeneralesUseCase(
      zonasRepository,
      registroVentasRepository,
      generarSufijoVenta,
    ),
    venderAsientos: new VenderAsientosUseCase(zonasRepository, registroVentasRepository, generarSufijoVenta),
    anularVenta: new AnularVentaUseCase(new PrismaAnulacionVentasRepository(prisma)),
    consultaVentas,
    generarPdfVenta: new GenerarPdfVentaUseCase(consultaVentas, new EntradasPdfRenderer(loadBrandLogoPng)),
    validarEntrada: new ValidarEntradaUseCase(new PrismaControlAccesoRepository(prisma), qrSigner),
    listarUsuarios: new ListarUsuariosUseCase(usuariosRepository),
    crearUsuario: new CrearUsuarioUseCase(usuariosRepository, passwordHasher),
    cambiarEstadoUsuario: new CambiarEstadoUsuarioUseCase(usuariosRepository),
    obtenerResumenVentas: new ObtenerResumenVentasUseCase(new PrismaReportesRepository(prisma)),
  } as const;
}

export type Container = ReturnType<typeof createContainer>;

let container: Container | undefined;

/** Raíz de composición: único lugar donde se instancian repositorios y casos de uso. */
export function getContainer(): Container {
  container ??= createContainer();
  return container;
}
