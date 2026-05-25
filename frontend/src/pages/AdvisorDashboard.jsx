import { useEffect, useState } from 'react'
import supabase from '../supabase'

export default function AdvisorDashboard() {
  const [clients, setClients] = useState([])

  useEffect(() => {
    supabase.from('clients').select('*').then(({ data }) => setClients(data || []))
  }, [])

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

      {clients.length === 0 ? (
        <div style={{ background:'#f8f8fa', borderRadius:10, padding:'40px 20px', textAlign:'center', color:'#aaa', fontSize:13 }}>
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {clients.map(c => (
            <div key={c.id} style={{ background:'#f8f8fa', borderRadius:10, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color:'#1f2937' }}>{c.name}</div>
                <div style={{ fontSize:11, color:'#aaa' }}>{c.email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
