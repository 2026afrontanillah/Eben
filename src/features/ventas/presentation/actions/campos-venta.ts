import { readText } from '@/shared/forms/form-data';

export function leerCamposClienteYPago(formData: FormData) {
  return {
    clienteNombre: readText(formData, 'clienteNombre'),
    clienteCelular: readText(formData, 'clienteCelular'),
    clienteEmail: readText(formData, 'clienteEmail'),
    metodoPago: readText(formData, 'metodoPago'),
    referenciaPago: readText(formData, 'referenciaPago'),
  };
}
