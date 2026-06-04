es posible que mi aplicacion de zumapos se comunique con el pos de mercado pago? esa máquina para cobrar ?

¡Sí, absolutamente! Es totalmente posible y, de hecho, es una de las mejores decisiones de arquitectura que puedes tomar para Zuma.

Mercado Pago ofrece una API oficial llamada API de Orders (que reemplazó a la antigua API de Intención de Pago) diseñada específicamente para integrar sistemas de punto de venta (PDV/POS) con sus máquinas físicas, como la Point Smart o Point Smart 2.  
Mercado Pago

Al integrarlos, el flujo de venta de Zuma cambiará drásticamente para mejor:

[Zuma (Tu App)] --(Envía monto vía API)--> [Servidor Mercado Pago] --(Por Internet)--> [Máquina Point Física]
                                                                                            |
[Zuma (Recibe Webhook de Éxito)] <--(Confirma Pago)-- [Servidor Mercado Pago] <--(Pasa Tarjeta)--+
¿Cómo funciona la comunicación?
No necesitas conectar la máquina a la computadora por cable ni por Bluetooth. Todo viaja por la nube a través de internet (la máquina de Mercado Pago debe estar conectada a Wi-Fi o usar su chip 4G integrado).  
Bsale

Dado que tu stack tecnológico para Zuma incluye Nuxt 3, Supabase y Node.js, tienes la estructura perfecta para construirlo de manera muy limpia:

1. Preparar la máquina Point en modo PDV
Por defecto, las máquinas Point vienen en modo Standalone (es decir, tú digitas el monto a mano en la pantalla). Para integrarla, debes cambiar su modo operativo a PDV (Punto de Venta) desde tu panel de Mercado Pago Developers o mediante su API. Al hacer esto, la pantalla se bloquea esperando las órdenes que envíe tu aplicación Zuma.

2. El flujo técnico en tu Backend (Node.js / Supabase)
Cuando el cajero haga clic en "Cobrar con Tarjeta" en Zuma, tu backend deberá hacer lo siguiente:

Crear una Orden de Pago: Haces una petición POST al endpoint /v1/orders de Mercado Pago enviando el amount (monto), una referencia externa (el ID de tu boleta en Zuma) y el terminal_id (el número de serie único de la máquina física).

La máquina reacciona sola: En un par de segundos, la Point Smart se enciende automáticamente mostrando el monto exacto que enviaste desde Zuma y le pide al cliente que acerque o inserte la tarjeta.

Escuchar la respuesta (Webhooks): Una vez que el cliente pasa la tarjeta y el pago es aprobado, Mercado Pago envía una notificación automática (Webhook) a una API de tu backend en Node.js.  
Noticias - Mercado Pago Developers

Cerrar la venta: Tu backend recibe esa confirmación, actualiza el estado del pedido en tu base de datos de Supabase a "Pagado", y Zuma limpia la pantalla o emite la boleta de manera automática.

Ventajas brutales de hacer esta integración en Zuma:
Cero errores de digitación: El cajero ya no se puede equivocar digitando un cero de menos o de más en la máquina. Si Zuma dice $14.500, la máquina cobrará exactamente $14.500.

Arqueos de caja perfectos: Al estar amarrado el ID de la transacción de Mercado Pago con el ID de la venta en tu base de datos, la conciliación al final del día es automática.

Experiencia profesional: Le da un peso gigante a Zuma como software comercial para competir con sistemas grandes como Bsale o Eleventa, que ya hacen esto.

Si te interesa añadir este módulo a las especificaciones de desarrollo de Zuma, avísame y te puedo ayudar a estructurar el flujo de los endpoints (POST /v1/orders) o el esquema que necesitas añadir en Supabase para guardar los números de serie de los dispositivos por cada cliente.