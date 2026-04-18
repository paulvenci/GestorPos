import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

function getCategoryFromNombre(nombre) {
  const n = nombre.toLowerCase()
  if (n.includes('pan ') || n.includes('kuchen') || n.includes('berlines') || n.includes('queque') || n.includes('dona') || n.includes('alfajor') || n.includes('empanada') || n.includes('rapiditas')) return 'Abarrotes' // Or Panadería if they don't have it. I'll put Abarrotes as a safe fallback, wait, "Panadería" might be better but Abarrotes is safer if the category doesn't exist. I'll check what they have: Salsas, lácteos, Abarrotes, snacks, bebidas, limpieza, Embutidos, Cecinas, congelados, Aseo personal, Medicamentos
  
  if (n.includes('queso') || n.includes('leche') || n.includes('lacteo') || n.includes('yogurt') || n.includes('mantequilla')) return 'Lácteos'
  if (n.includes('jamon') || n.includes('cecina') || n.includes('salchichon') || n.includes('abuelo') || n.includes('salchicha')) return 'Cecinas'
  if (n.includes('kem') || n.includes('sprite') || n.includes('jugo') || n.includes('bebida') || n.includes('coca') || n.includes('fanta') || n.includes('agua') || n.includes('nectar') || n.includes('disfruta')) return 'Bebidas'
  if (n.includes('dorito') || n.includes('serranita') || n.includes('papas') || n.includes('lays') || n.includes('nuez') || n.includes('almendra')) return 'Snacks'
  if (n.includes('galleta') || n.includes('oreo') || n.includes('delicias')) return 'Galletas'
  if (n.includes('basura') || n.includes('cloro') || n.includes('detergente') || n.includes('limpia')) return 'Limpieza'
  if (n.includes('shampoo') || n.includes('jabon') || n.includes('pasta') || n.includes('cepillo') || n.includes('papel')) return 'Aseo personal'
  if (n.includes('trutro') || n.includes('pollo') || n.includes('hamburguesa') || n.includes('helado')) return 'Congelados'
  if (n.includes('medicamento') || n.includes('paracetamol')) return 'Medicamentos'
  if (n.includes('cafe') || n.includes('te') || n.includes('supremo') || n.includes('vainilla') || n.includes('moka') || n.includes('chocolate') || n.includes('manjar') || n.includes('candela')) return 'Abarrotes'
  
  return 'Abarrotes' // Fallback
}

async function main() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('id, nombre, categoria')
    .or('categoria.is.null,categoria.eq.')

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(`Encontrados ${productos.length} productos sin categorizar.`);

  for (const p of productos) {
    let nuevaCat = getCategoryFromNombre(p.nombre);
    
    // Si la categoría sugerida es Abarrotes pero el producto suena a Confitería
    if (nuevaCat === 'Abarrotes' && (p.nombre.toLowerCase().includes('chocolate') || p.nombre.toLowerCase().includes('manjar'))) {
        nuevaCat = 'Confitería';
    }

    const { error: updateError } = await supabase
      .from('productos')
      .update({ categoria: nuevaCat })
      .eq('id', p.id);

    if (updateError) {
      console.error(`Error updating   
 ${p.nombre}:`, updateError)
    } else {
      console.log(`Actualizado: ${p.nombre} -> ${nuevaCat}`);
    }
  }

  console.log('Proceso de categorización finalizado.');
}

main()
