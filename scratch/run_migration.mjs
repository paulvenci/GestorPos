import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql_query: "ALTER TABLE public.detalle_pedidos ADD COLUMN IF NOT EXISTS unidad TEXT DEFAULT 'Unidades';"
  })
  if (error) {
    console.error('RPC Error:', error)
  } else {
    console.log('Success:', data)
  }
}
run()
