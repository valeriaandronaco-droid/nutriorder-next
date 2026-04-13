'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const C = {
  primary: '#50162C',
  primaryLight: '#7A2444',
  primaryDark: '#33091A',
  accent: '#D55189',
  accentLight: '#E8A0BF',
  cream: '#FDF8FA',
  warm: '#F5E8EE',
  white: '#FFFFFF',
  border: '#E8D0DA',
  charcoal: '#2C2C2C',
  muted: '#8A7A7E',
}

const mealIcons = { colazione: '☀️', pranzo: '🌸', cena: '🌙' }
const mealColors = {
  colazione: { bg: '#FFF8E7', border: '#F5D78E', text: '#A0750A' },
  pranzo: { bg: '#FDF0F6', border: '#E8A0BF', text: '#80154A' },
  cena: { bg: '#F5F0F8', border: '#C8A8D8', text: '#5A2A7A' },
}

function Loader() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🌸</div>
      <p style={{ fontSize: 13 }}>Caricamento...</p>
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ background: '#FFF0F0', border: '1px solid #FFCCCC', borderRadius: 10, padding: '12px 16px', margin: '12px 0', color: '#C0392B', fontSize: 13 }}>
      ⚠️ {msg}
    </div>
  )
}

// ─── VISTA NUTRIZIONISTA ───────────────────────────────────────────────────────
function NutritionistView({ supabase }) {
  const [tab, setTab] = useState('pazienti')
  const [pazienti, setPazienti] = useState([])
  const [ristoranti, setRistoranti] = useState([])
  const [selectedPaziente, setSelectedPaziente] = useState(null)
  const [dieta, setDieta] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAccount, setNewAccount] = useState({ nome: '', telefono: '', password: '', ruolo: 'cliente', paziente_id: '', ristorante_id: '' })
  const [accountMsg, setAccountMsg] = useState(null)
  const [newDish, setNewDish] = useState({ pasto: 'pranzo', nome: '', ristorante: '', ristorante_id: null, ingredienti: [{ nome: '', quantita: 100, unita: 'g' }] })
const [newPaziente, setNewPaziente] = useState({ nome: '', eta: '', obiettivo: '', msg: null })

const handleAddPaziente = async () => {
  if (!newPaziente.nome) return
  const { data, error } = await supabase.from('pazienti').insert({
    nome: newPaziente.nome,
    eta: newPaziente.eta ? parseInt(newPaziente.eta) : null,
    obiettivo: newPaziente.obiettivo || null,
  }).select().single()

  if (error) return setNewPaziente({ ...newPaziente, msg: { type: 'error', text: 'Errore durante il salvataggio.' } })
  
  setPazienti(prev => [...prev, data])
  setNewPaziente({ nome: '', eta: '', obiettivo: '', msg: { type: 'success', text: `✅ Paziente ${data.nome} aggiunto!` } })
}

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from('pazienti').select('*'),
        supabase.from('ristoranti').select('*'),
      ])
      setPazienti(p || [])
      setRistoranti(r || [])
      setLoading(false)
    }
    load()
  }, [])

  const loadDieta = async (paziente) => {
    setSelectedPaziente(paziente)
    setLoading(true)
    const { data: piatti } = await supabase.from('piatti').select('*, ingredienti(*)').eq('paziente_id', paziente.id)
    setDieta(piatti || [])
    setLoading(false)
  }

  const handleAddDish = async () => {
    if (!newDish.nome) return
    setSaving(true)
    const { data: piatto } = await supabase.from('piatti').insert({
      paziente_id: selectedPaziente.id,
      nome: newDish.nome,
      pasto: newDish.pasto,
      ristorante: newDish.ristorante,
      ristorante_id: newDish.ristorante_id,
    }).select().single()

    if (piatto) {
      const ingToInsert = newDish.ingredienti.filter(i => i.nome).map(i => ({ ...i, piatto_id: piatto.id }))
      if (ingToInsert.length > 0) await supabase.from('ingredienti').insert(ingToInsert)
      await loadDieta(selectedPaziente)
    }
    setAdding(false)
    setNewDish({ pasto: 'pranzo', nome: '', ristorante: '', ristorante_id: null, ingredienti: [{ nome: '', quantita: 100, unita: 'g' }] })
    setSaving(false)
  }

  const handleDeleteDish = async (id) => {
    await supabase.from('piatti').delete().eq('id', id)
    setDieta(prev => prev.filter(d => d.id !== id))
  }

  const handleRegistra = async () => {
    setAccountMsg(null)
    const email = `${newAccount.telefono.replace(/\s/g, '')}@nutriorder.app`
    const res = await fetch('/api/crea-utente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAccount, email }),
    })
    const data = await res.json()
    if (!res.ok) return setAccountMsg({ type: 'error', text: data.error })
    setAccountMsg({ type: 'success', text: `✅ Account creato per ${newAccount.nome}!` })
    setNewAccount({ nome: '', telefono: '', password: '', ruolo: 'cliente', paziente_id: '', ristorante_id: '' })
  }

  const inputStyle = { width: '100%', padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, color: C.charcoal, background: C.cream, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }

  if (loading) return <Loader />

  if (selectedPaziente) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => setSelectedPaziente(null)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>← Tutti i pazienti</button>
        <div style={{ background: `linear-gradient(135deg, ${C.primary}15, ${C.accent}15)`, border: `1px solid ${C.accentLight}`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: C.primary }}>{selectedPaziente.nome}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{selectedPaziente.eta} anni · {selectedPaziente.obiettivo}</p>
          </div>
          <span style={{ fontSize: 24 }}>🌸</span>
        </div>
        {error && <ErrorMsg msg={error} />}
        {dieta.map(dish => {
          const mc = mealColors[dish.pasto] || mealColors.pranzo
          return (
            <div key={dish.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.primary }}>{mealIcons[dish.pasto]} {dish.nome}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: mc.bg, color: mc.text, fontSize: 11, padding: '2px 8px', borderRadius: 20, border: `1px solid ${mc.border}` }}>{dish.pasto}</span>
                  <button onClick={() => handleDeleteDish(dish.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 16, padding: 0 }}>🗑️</button>
                </div>
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 12, color: C.muted }}>📍 {dish.ristorante}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(dish.ingredienti || []).map((ing, j) => (
                  <span key={j} style={{ fontSize: 11, background: C.warm, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.border}`, color: C.charcoal }}>
                    {ing.nome} <strong>{ing.quantita}{ing.unita}</strong>
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {adding ? (
          <div style={{ background: C.white, border: `2px dashed ${C.accentLight}`, borderRadius: 12, padding: 18, marginTop: 16 }}>
            <h4 style={{ margin: '0 0 14px', color: C.primary, fontSize: 15 }}>Nuovo piatto</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <select value={newDish.pasto} onChange={e => setNewDish({ ...newDish, pasto: e.target.value })} style={{ ...inputStyle, marginBottom: 0 }}>
                <option value="colazione">☀️ Colazione</option>
                <option value="pranzo">🌸 Pranzo</option>
                <option value="cena">🌙 Cena</option>
              </select>
              <select value={newDish.ristorante_id || ''} onChange={e => {
                const r = ristoranti.find(r => r.id === parseInt(e.target.value))
                setNewDish({ ...newDish, ristorante_id: r?.id || null, ristorante: r?.nome || '' })
              }} style={{ ...inputStyle, marginBottom: 0 }}>
                <option value="">Seleziona ristorante</option>
                {ristoranti.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
            </div>
            <input value={newDish.nome} onChange={e => setNewDish({ ...newDish, nome: e.target.value })} placeholder="Nome piatto" style={inputStyle} />
            {newDish.ingredienti.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={ing.nome} onChange={e => { const a = [...newDish.ingredienti]; a[i].nome = e.target.value; setNewDish({ ...newDish, ingredienti: a }) }} placeholder="Ingrediente" style={{ ...inputStyle, flex: 2, marginBottom: 0 }} />
                <input type="number" value={ing.quantita} onChange={e => { const a = [...newDish.ingredienti]; a[i].quantita = Number(e.target.value); setNewDish({ ...newDish, ingredienti: a }) }} style={{ ...inputStyle, width: 60, marginBottom: 0 }} />
                <select value={ing.unita} onChange={e => { const a = [...newDish.ingredienti]; a[i].unita = e.target.value; setNewDish({ ...newDish, ingredienti: a }) }} style={{ ...inputStyle, width: 55, marginBottom: 0 }}>
                  <option>g</option><option>ml</option><option>pz</option>
                </select>
              </div>
            ))}
            <button onClick={() => setNewDish({ ...newDish, ingredienti: [...newDish.ingredienti, { nome: '', quantita: 100, unita: 'g' }] })} style={{ background: 'none', border: `1px dashed ${C.accentLight}`, color: C.accent, borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', marginBottom: 14 }}>
              + Aggiungi ingrediente
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddDish} disabled={saving} style={{ background: C.primary, color: C.white, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flex: 1 }}>
                {saving ? '⏳...' : '✓ Salva'}
              </button>
              <button onClick={() => setAdding(false)} style={{ background: C.warm, color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 16px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annulla</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ width: '100%', marginTop: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: C.white, border: 'none', borderRadius: 10, padding: 12, fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            + Aggiungi piatto
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: C.primary, fontSize: 20, margin: '0 0 20px' }}>Pannello Nutrizionista</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['pazienti', '👥 Pazienti'], ['nuovo-paziente', '➕ Nuovo paziente'], ['account', '🔐 Account']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: 8, border: 'none', background: tab === id ? C.primary : C.warm, color: tab === id ? C.white : C.muted, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'pazienti' && pazienti.map(p => (
        <div key={p.id} onClick={() => loadDieta(p)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: C.primary }}>{p.nome}</p>
            <p style={{ margin: 0, fontSize: 12, color: C.muted }}>{p.eta} anni · {p.obiettivo}</p>
          </div>
          <span style={{ background: C.warm, color: C.accent, padding: '4px 12px', borderRadius: 20, fontSize: 12, border: `1px solid ${C.border}` }}>Dieta →</span>
        </div>
      ))}
      {tab === 'nuovo-paziente' && (
  <div>
    <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Aggiungi un nuovo paziente</p>
    {newPaziente.msg && (
      <div style={{ background: newPaziente.msg.type === 'success' ? '#F8E8F0' : '#FFF0F0', border: `1px solid ${newPaziente.msg.type === 'success' ? C.accentLight : '#FFCCCC'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: newPaziente.msg.type === 'success' ? C.primary : '#C0392B', fontSize: 13 }}>
        {newPaziente.msg.text}
      </div>
    )}
    <input value={newPaziente.nome} onChange={e => setNewPaziente({ ...newPaziente, nome: e.target.value })} placeholder="Nome completo" style={inputStyle} />
    <input type="number" value={newPaziente.eta} onChange={e => setNewPaziente({ ...newPaziente, eta: e.target.value })} placeholder="Età" style={inputStyle} />
    <input value={newPaziente.obiettivo} onChange={e => setNewPaziente({ ...newPaziente, obiettivo: e.target.value })} placeholder="Obiettivo (es. Dimagrimento)" style={inputStyle} />
    <button onClick={handleAddPaziente} style={{ width: '100%', padding: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: C.white, border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
      ✓ Aggiungi paziente
    </button>
  </div>
)}
      {tab === 'account' && (
        <div>
          <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Crea un account per un cliente o ristoratore</p>
          {accountMsg && (
            <div style={{ background: accountMsg.type === 'success' ? '#F8E8F0' : '#FFF0F0', border: `1px solid ${accountMsg.type === 'success' ? C.accentLight : '#FFCCCC'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: accountMsg.type === 'success' ? C.primary : '#C0392B', fontSize: 13 }}>
              {accountMsg.text}
            </div>
          )}
          <input value={newAccount.nome} onChange={e => setNewAccount({ ...newAccount, nome: e.target.value })} placeholder="Nome completo" style={inputStyle} />
          <input value={newAccount.telefono} onChange={e => setNewAccount({ ...newAccount, telefono: e.target.value })} placeholder="Numero di telefono" style={inputStyle} />
          <input type="password" value={newAccount.password} onChange={e => setNewAccount({ ...newAccount, password: e.target.value })} placeholder="Password" style={inputStyle} />
          <select value={newAccount.ruolo} onChange={e => setNewAccount({ ...newAccount, ruolo: e.target.value })} style={inputStyle}>
            <option value="cliente">👤 Cliente</option>
            <option value="ristoratore">🍽️ Ristoratore</option>
          </select>
          {newAccount.ruolo === 'cliente' && (
            <select value={newAccount.paziente_id} onChange={e => setNewAccount({ ...newAccount, paziente_id: e.target.value })} style={inputStyle}>
              <option value="">Collega a paziente...</option>
              {pazienti.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          )}
          {newAccount.ruolo === 'ristoratore' && (
            <select value={newAccount.ristorante_id} onChange={e => setNewAccount({ ...newAccount, ristorante_id: e.target.value })} style={inputStyle}>
              <option value="">Collega a ristorante...</option>
              {ristoranti.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          )}
          <button onClick={handleRegistra} style={{ width: '100%', padding: 12, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: C.white, border: 'none', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
            ✓ Crea account
          </button>
        </div>
      )}
    </div>
  )
}

// ─── VISTA CLIENTE ─────────────────────────────────────────────────────────────
function ClientView({ supabase, profilo }) {
  const [dieta, setDieta] = useState([])
  const [ordini, setOrdini] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [customIngredients, setCustomIngredients] = useState([])
  const [notes, setNotes] = useState('')
  const [ordered, setOrdered] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('dieta')

  useEffect(() => {
    if (!profilo?.paziente_id) { setLoading(false); return }
    supabase.from('piatti').select('*, ingredienti(*)').eq('paziente_id', profilo.paziente_id)
      .then(({ data }) => { setDieta(data || []); setLoading(false) })
  }, [profilo])

  useEffect(() => {
    if (!profilo?.paziente_id) return
    const fetchOrdini = async () => {
      const { data } = await supabase
        .from('ordini')
        .select('*, ordine_ingredienti(*)')
        .eq('paziente_id', profilo.paziente_id)
        .order('creato_il', { ascending: false })
        .limit(10)
      setOrdini(data || [])
    }
    fetchOrdini()
    const interval = setInterval(fetchOrdini, 5000)
    return () => clearInterval(interval)
  }, [profilo])

  const openDish = (dish) => {
    setSelected(dish)
    setCustomIngredients((dish.ingredienti || []).map(i => ({ ...i })))
    setNotes(''); setOrdered(null)
  }

  const handleOrder = async () => {
    setSending(true)
    const { data: ordine } = await supabase.from('ordini').insert({
      paziente_id: profilo.paziente_id,
      piatto_nome: selected.nome,
      pasto: selected.pasto,
      ristorante: selected.ristorante,
      ristorante_id: selected.ristorante_id,
      note: notes,
      stato: 'in_attesa',
    }).select().single()

    if (ordine) {
      const ingToInsert = customIngredients.map(i => ({ ordine_id: ordine.id, nome: i.nome, quantita: i.quantita, unita: i.unita }))
      await supabase.from('ordine_ingredienti').insert(ingToInsert)
      setOrdered(selected.nome)
      setSelected(null)
      setTab('ordini')
    }
    setSending(false)
  }

  if (loading) return <Loader />

  if (selected) {
    const mc = mealColors[selected.pasto] || mealColors.pranzo
    return (
      <div style={{ padding: 24 }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 14, marginBottom: 16, padding: 0 }}>← Torna alla dieta</button>
        <div style={{ background: mc.bg, borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: `1px solid ${mc.border}` }}>
          <div style={{ fontSize: 22 }}>{mealIcons[selected.pasto]}</div>
          <h3 style={{ margin: '4px 0 2px', color: C.primary }}>{selected.nome}</h3>
          <p style={{ margin: 0, color: mc.text, fontSize: 13 }}>📍 {selected.ristorante}</p>
        </div>
        <h4 style={{ color: C.primary, fontSize: 14, marginBottom: 12 }}>Modifica le grammature:</h4>
        {customIngredients.map((ing, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, color: C.charcoal }}>{ing.nome}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { const c = [...customIngredients]; c[i].quantita = Math.max(0, c[i].quantita - (ing.unita === 'pz' ? 1 : 5)); setCustomIngredients(c) }}
                style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, color: C.accent }}>−</button>
              <span style={{ minWidth: 55, textAlign: 'center', fontSize: 14, fontWeight: 700, color: C.charcoal }}>{ing.quantita} {ing.unita}</span>
              <button onClick={() => { const c = [...customIngredients]; c[i].quantita += ing.unita === 'pz' ? 1 : 5; setCustomIngredients(c) }}
                style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 16, color: C.accent }}>+</button>
            </div>
          </div>
        ))}
        <textarea placeholder="Note per il ristorante..." value={notes} onChange={e => setNotes(e.target.value)}
          style={{ width: '100%', marginTop: 16, padding: '10px 14px', border: `1px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box', background: C.cream, outline: 'none' }} />
        {error && <ErrorMsg msg={error} />}
        <button onClick={handleOrder} disabled={sending} style={{ width: '100%', marginTop: 16, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`, color: C.white, border: 'none', borderRadius: 10, padding: 14, fontSize: 15, cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: 700 }}>
          {sending ? '⏳ Invio...' : '🛒 Ordina ora'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ color: C.primary, fontSize: 20, margin: 0 }}>Ciao, {profilo.nome}! 🌸</h2>
      </div>

      {/* Tab dieta / ordini */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['dieta', '🥗 La mia dieta'], ['ordini', '📋 I miei ordini']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: 8, border: 'none', background: tab === id ? C.primary : C.warm, color: tab === id ? C.white : C.muted, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
            {id === 'ordini' && ordini.filter(o => o.stato === 'in_attesa').length > 0 && (
              <span style={{ marginLeft: 6, background: C.accent, color: C.white, borderRadius: '50%', padding: '1px 6px', fontSize: 11 }}>
                {ordini.filter(o => o.stato === 'in_attesa').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB DIETA */}
      {tab === 'dieta' && (
        <>
          {dieta.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
              <p>Nessun piatto assegnato ancora.</p>
            </div>
          )}
          {['colazione', 'pranzo', 'cena'].map(meal => {
            const dishes = dieta.filter(d => d.pasto === meal)
            if (!dishes.length) return null
            const mc = mealColors[meal]
            return (
              <div key={meal} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{mealIcons[meal]}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: mc.text }}>{meal}</span>
                </div>
                {dishes.map(dish => (
                  <div key={dish.id} onClick={() => openDish(dish)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', marginBottom: 10, boxShadow: '0 1px 4px rgba(80,22,44,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: C.primary }}>{dish.nome}</p>
                        <p style={{ margin: 0, fontSize: 12, color: C.muted }}>📍 {dish.ristorante}</p>
                      </div>
                      <span style={{ background: mc.bg, color: mc.text, padding: '4px 10px', borderRadius: 20, fontSize: 11, border: `1px solid ${mc.border}` }}>Ordina →</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(dish.ingredienti || []).slice(0, 3).map((ing, j) => (
                        <span key={j} style={{ fontSize: 11, color: C.muted, background: C.warm, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.border}` }}>
                          {ing.nome} {ing.quantita}{ing.unita}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}

      {/* TAB ORDINI */}
      {tab === 'ordini' && (
        <>
          {ordini.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
              <p>Nessun ordine ancora.</p>
            </div>
          ) : (
            ordini.map(o => (
              <div key={o.id} style={{
                background: o.stato === 'confermato' ? '#F0FFF4' : C.warm,
                border: `1px solid ${o.stato === 'confermato' ? '#A5D6A7' : C.border}`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: 14, color: C.primary }}>{o.piatto_nome}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{mealIcons[o.pasto]} {o.pasto} · 📍 {o.ristorante}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: o.stato === 'confermato' ? '#E8F5E8' : '#FFF8E7',
                    color: o.stato === 'confermato' ? '#2E7D32' : '#A0750A',
                    border: `1px solid ${o.stato === 'confermato' ? '#A5D6A7' : '#F5D78E'}`,
                  }}>
                    {o.stato === 'confermato' ? '✓ Confermato' : '⏳ In attesa'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(o.ordine_ingredienti || []).map((ing, j) => (
                    <span key={j} style={{ fontSize: 11, color: C.muted, background: C.white, padding: '2px 8px', borderRadius: 20, border: `1px solid ${C.border}` }}>
                      {ing.nome} {ing.quantita}{ing.unita}
                    </span>
                  ))}
                </div>
                {o.note && <p style={{ margin: '8px 0 0', fontSize: 11, color: C.muted, fontStyle: 'italic' }}>📝 {o.note}</p>}
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}

// ─── VISTA RISTORATORE ─────────────────────────────────────────────────────────
function RestaurantView({ supabase, profilo }) {
  const [ordini, setOrdini] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrdini = async () => {
    const { data: ordiniData } = await supabase
      .from('ordini')
      .select('*, ordine_ingredienti(*)')
      .eq('ristorante_id', profilo.ristorante_id)
      .order('creato_il', { ascending: false })

    if (!ordiniData) { setLoading(false); return }

const pazienteIds = [...new Set(ordiniData.map(o => o.paziente_id))]
const { data: pazientiData } = await supabase
  .from('pazienti').select('id, nome').in('id', pazienteIds)

const { data: profiliData } = await supabase
  .from('profili').select('paziente_id, telefono').in('paziente_id', pazienteIds)

const pazientiMap = {}
pazientiData?.forEach(p => { pazientiMap[p.id] = { nome: p.nome } })
profiliData?.forEach(p => {
  if (pazientiMap[p.paziente_id]) pazientiMap[p.paziente_id].telefono = p.telefono
})

setOrdini(ordiniData.map(o => ({
  ...o,
  paziente_nome: pazientiMap[o.paziente_id]?.nome || 'Cliente',
  paziente_telefono: pazientiMap[o.paziente_id]?.telefono || '',
})))
    setLoading(false)
  }

  useEffect(() => {
    fetchOrdini()
    const interval = setInterval(fetchOrdini, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleConfirm = async (id) => {
    await supabase.from('ordini').update({ stato: 'confermato' }).eq('id', id)
    setOrdini(prev => prev.map(o => o.id === id ? { ...o, stato: 'confermato' } : o))
  }

  if (loading) return <Loader />

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.primary, fontSize: 20, margin: 0 }}>Ordini ricevuti</h2>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Aggiornamento ogni 10 secondi</p>
      </div>
      {ordini.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
          <p>Nessun ordine ricevuto</p>
        </div>
      )}
      {ordini.map(order => {
        const mc = mealColors[order.pasto] || mealColors.pranzo
        return (
          <div key={order.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ background: mc.bg, borderBottom: `1px solid ${mc.border}`, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: mc.text, fontSize: 15 }}>{mealIcons[order.pasto]} {order.piatto_nome}</span>
              <span style={{ color: C.muted, fontSize: 12 }}>{order.pasto}</span>
            </div>
            <div style={{ padding: '14px 18px' }}>
<p style={{ margin: '0 0 10px', fontSize: 13, color: C.muted }}>
  👤 <strong style={{ color: C.charcoal }}>{order.paziente_nome}</strong>
  {order.paziente_telefono && (
    <span style={{ marginLeft: 8, color: C.muted, fontWeight: 400 }}>
      · 📞 {order.paziente_telefono}
    </span>
  )}
</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {(order.ordine_ingredienti || []).map((ing, j) => (
                  <span key={j} style={{ background: C.warm, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, color: C.charcoal }}>
                    {ing.nome} <strong>{ing.quantita}{ing.unita}</strong>
                  </span>
                ))}
              </div>
              {order.note && <p style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginBottom: 10 }}>📝 {order.note}</p>}
              {order.stato === 'in_attesa' ? (
                <button onClick={() => handleConfirm(order.id)} style={{ background: C.accent, color: C.white, border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✓ Conferma ordine
                </button>
              ) : (
                <span style={{ background: '#E8F5E8', color: '#2E7D32', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>✓ Confermato</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profilo, setProfilo] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('profili').select('*').eq('id', user.id).single()
      setProfilo(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const ruoloLabel = { nutrizionista: 'Nutrizionista 🌸', cliente: 'Cliente 👤', ristoratore: 'Ristoratore 🍽️' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Loader />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px 16px', fontFamily: 'Georgia, serif' }}>
      <div style={{ width: '100%', maxWidth: 420, background: C.white, borderRadius: 24, boxShadow: '0 8px 40px rgba(80,22,44,0.12)', overflow: 'hidden', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: `linear-gradient(135deg, ${C.primaryDark}, ${C.primary})`, padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, color: C.white, fontSize: 18, letterSpacing: 0.5 }}>NutriOrder</h1>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 2 }}>
                {ruoloLabel[profilo?.ruolo]} · {profilo?.nome}
              </p>
            </div>
            <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: C.white, borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
              Esci
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {profilo?.ruolo === 'nutrizionista' && <NutritionistView supabase={supabase} />}
          {profilo?.ruolo === 'cliente' && <ClientView supabase={supabase} profilo={profilo} />}
          {profilo?.ruolo === 'ristoratore' && <RestaurantView supabase={supabase} profilo={profilo} />}
        </div>
      </div>
    </div>
  )
}
