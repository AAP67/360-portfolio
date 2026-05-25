import supabase from '../supabase'

export default function ClientDashboard() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ maxWidth:500, margin:'0 auto', padding:'32px 20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'#1a1a2e', fontFamily:'Georgia, serif' }}>360°</div>
        <button onClick={handleLogout} style={{ background:'#f0f0f5', border:'none', borderRadius:6, padding:'6px 12px', fontSize:11, color:'#999', cursor:'pointer' }}>Sign Out</button>
      </div>

      <div style={{ fontSize:16, fontWeight:700, color:'#1a1a2e', marginBottom:16 }}>My Portfolio</div>

      <div style={{ background:'#f8f8fa', borderRadius:10, padding:'40px 20px', textAlign:'center', color:'#aaa', fontSize:13 }}>
        No holdings yet. Your advisor will link your accounts.
      </div>
    </div>
  )
}
