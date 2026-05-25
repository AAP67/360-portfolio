import { useEffect, useState } from 'react'
import supabase from '../supabase'

export default function AdvisorDashboard() {
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  const loadClients = async () => {
    const { data: clientList } = await supabase.from('clients').select('*')
    const { data: accountList } = await supabase.from('accounts').select('*')
    const merged = (clientList || []).map(c => ({
      ...c,
      accounts: (accountList || []).filter(a => a.client_id === c.id)
    }))
    setClients(merged)
  }

  useEffect(() => { loadClients() }, [])

  const addClient = async () => {
    if (!name) return
    await supabase.from('clients').insert({ name, email })
    setName('')
    setEmail('')
    setShowForm(false)
    loadClients()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth:500, margin:'0 auto', padding:'32px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', fontFamily:'Georgia, serif' }}>360°</div>
        <button onClick={handleLogout} style={{ background:'#f0f0f5', border:'none', borderRadius:6, padding:'6px 12px', fontSize:11, color:'#999', cursor:'pointer' }}>Sign Out</button>
      </div>
      <div style={{ fontSize:16, fontWeight:700, color:'#1a1a2e', marginBottom:16 }}>All Clients</div>
      {clients.map(c => (
        <div key={c.id} style={{ background:'#f8f8fa', borderRadius:10, padding:'14px 16px', marginBottom:8 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'#1f2937' }}>{c.name}</div>
              <div style={{ fontSize:11, color:'#aaa' }}>{c.email}</div>
            </div>
            {c.accounts.length > 0 ? (
              <div style={{ fontSize:10, color:'#059669', fontWeight:600, background:'#ecfdf5', padding:'4px 10px', borderRadius:6 }}>LINKED</div>
            ) : (
              <a href={BACKEND + '/auth/zerodha/login?client_id=' + c.id} style={{ background:'#1a1a2e', color:'#fff', borderRadius:6, padding:'6px 12px', fontSize:10, fontWeight:600, textDecoration:'none' }}>Link Zerodha</a>
            )}
          </div>
        </div>
      ))}
      {showForm ? (
        <div style={{ background:'#f8f8fa', borderRadius:10, padding:'16px', marginTop:12 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name" style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:8, boxSizing:'border-box' }} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email (optional)" style={{ width:'100%', padding:'10px', border:'1px solid #ddd', borderRadius:8, fontSize:13, marginBottom:12, boxSizing:'border-box' }} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addClient} style={{ flex:1, background:'#1a1a2e', color:'#fff', border:'none', borderRadius:8, padding:'10px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save</button>
            <button onClick={() => setShowForm(false)} style={{ flex:1, background:'#fff', color:'#999', border:'1px solid #ddd', borderRadius:8, padding:'10px', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setShowForm(true)} style={{ marginTop:12, border:'1px dashed #ccc', borderRadius:10, padding:'14px', textAlign:'center', color:'#aaa', fontSize:13, cursor:'pointer' }}>+ Add Client</div>
      )}
    </div>
  )
}
