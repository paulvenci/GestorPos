import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function main() {
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, categoria, empresa_id')
    .or('categoria.is.null,categoria.eq.')

  if (error) {
    console.error('Error fetching products:', error)
    return
  }

  console.log(`Found ${data.length} uncategorized products:`)
  console.table(data)
}

main()
