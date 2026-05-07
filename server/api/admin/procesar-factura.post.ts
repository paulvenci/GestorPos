import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // 1. Obtener la API Key de OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'La variable de entorno OPENROUTER_API_KEY no está configurada',
      })
    }

    // 2. Leer el cuerpo de la petición
    const body = await readBody(event)
    const { imageBase64, mimeType } = body

    if (!imageBase64 || !mimeType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Se requiere la imagen para procesar.',
      })
    }

    // Limpiar el base64 si trae el prefijo
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    // 3. Llamar a OpenRouter
    // Usamos openai/gpt-4o-mini vía OpenRouter que es el más estable de todos
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "GestorPOS",
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o-mini",
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": `Eres un asistente experto en lectura de facturas chilenas para un sistema POS.
                
Analiza la imagen y extrae la información del EMISOR (Proveedor) y el listado de PRODUCTOS.

=== REGLAS DEL PROVEEDOR ===
1. Busca el RUT del Emisor (ej: 76.123.456-K). Es VITAL.
2. Busca el Nombre o Razón Social del Emisor.

=== REGLA #1: DECODIFICAR NOMBRES DE PRODUCTO ===
Genera un NOMBRE LIMPIO para venta minorista. 
Ej: "AGUA TONICA VRE350X24" -> "Agua Tónica 350cc". SIN códigos internos.

=== REGLA #2: UNIDAD DE MEDIDA (UM) Y CANTIDAD ===
Si UM es CJ o CAJ, multiplica la cantidad por las unidades de la caja (ej: X24 -> cant * 24).
Calcula el costo por UNIDAD individual (costo_linea / cantidad_total_unidades).

=== FORMATO DE RESPUESTA ===
Retorna un JSON con esta estructura exacta:
{ 
  "proveedor": { "rut": "...", "nombre": "..." },
  "productos": [{ "nombre": "...", "cantidad": 0, "costo": 0, "sku": "...", "um_original": "...", "unidades_por_caja": 0, "nombre_original": "..." }] 
}

Analiza la imagen adjunta y extrae TODO. No inventes datos.`
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": `data:${mimeType};base64,${cleanBase64}`
                }
              }
            ]
          }
        ],
        "response_format": { "type": "json_object" }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de OpenRouter:', data)
      throw new Error(data.error?.message || 'Error en OpenRouter')
    }

    // 4. Extraer el JSON de la respuesta
    const content = data.choices[0].message.content;
    let productos = [];
    let proveedor = { rut: '', nombre: '' };
    
    try {
      const parsed = JSON.parse(content);
      productos = parsed.productos || [];
      proveedor = parsed.proveedor || { rut: '', nombre: '' };
    } catch (e) {
      console.error("Error parseando JSON de OpenRouter", content)
      throw new Error('La IA no devolvió un formato válido')
    }

    return { success: true, productos, proveedor }

  } catch (error: any) {
    console.error('Error en procesar-factura:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Error interno del servidor',
    })
  }
})
