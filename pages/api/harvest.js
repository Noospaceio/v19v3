import { supabase } from '../../lib/supabaseClient'

const HARVEST_DAYS = 9 // Tage bis Harvest möglich

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { wallet } = req.body
  if (!wallet) return res.status(400).json({ error: 'Missing wallet' })

  try {
    // Wallet Startzeit holen
    const { data: w } = await supabase
      .from('wallets')
      .select('start_ts')
      .eq('wallet', wallet)
      .single()

    if (!w?.start_ts) {
      return res.status(400).json({ ok: false, error: 'No wallet start timestamp found' })
    }

    const now = Date.now()
    const diffDays = (now - w.start_ts) / (1000 * 60 * 60 * 24)

    if (diffDays < HARVEST_DAYS) {
      return res.status(400).json({ ok: false, error: `Harvest not ready. ${Math.ceil(HARVEST_DAYS - diffDays)} days left` })
    }

    // unclaimed holen
    const { data: uc } = await supabase
      .from('unclaimed')
      .select('amount')
      .eq('wallet', wallet)
      .single()

    const harvested = uc?.amount || 0
    if (harvested <= 0) {
      return res.status(200).json({ ok: true, harvested: 0 })
    }

    // Balance erhöhen
    const { data: bal } = await supabase
      .from('balances')
      .select('balance')
      .eq('wallet', wallet)
      .single()

    if (bal) {
      await supabase.from('balances').update({ balance: (bal.balance || 0) + harvested }).eq('wallet', wallet)
    } else {
      await supabase.from('balances').insert({ wallet, balance: harvested })
    }

    // Unclaimed zurücksetzen
    await supabase.from('unclaimed').update({ amount: 0 }).eq('wallet', wallet)

    // Wallet-Zyklus neu starten
    await supabase.from('wallets').update({ start_ts: now }).eq('wallet', wallet)

    return res.status(200).json({ ok: true, harvested })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: 'server error' })
  }
}


