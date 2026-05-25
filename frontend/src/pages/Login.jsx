import { useState } from 'react'
import supabase from '../supabase'

export default function Login() {
  const [role, setRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  if (!role) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px' }}>
        <div style={{ fontSize:32, fontWeight:700, color:'#1a1a2e', fontFamily:'Georgia, serif', marginBottom:6 }}>360°</div>
        <div style={{ fontSize:13, color:'#aaa', marginBottom:40 }}>Portfolio Intelligence</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
          <button onClick={() => setRole('advisor')} style={{ background:'#1a1a2e', color:'#fff', border:'none', borderRadius:10, padding:'15px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Sign in as Advisor</button>
          <button onClick={() => setRole('client')} style={{ background:'#fff', color:'#1a1a2e', border:'1px solid #ddd', borderRadius:10, padding:'15px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Sign in as Client</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'80px 24px' }}>
      <div style={{ fontSize:24, fontWeight:700, color:'#1a1a2e', fontFamily:'Georgia, serif', marginBottom:28 }}>360°</div>
      <div style={{ width:'100%', maxWidth:300 }}>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:12, boxSizing:'border-box' }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width:'100%', padding:'12px', border:'1px solid #ddd', borderRadius:8, fontSize:14, marginBottom:16, boxSizing:'border-box' }} />
        {error && <div style={{ color:'#dc2626', fontSize:12, marginBottom:12 }}>{error}</div>}
        <button onClick={handleLogin} style={{ width:'100%', background:'#1a1a2e', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontSize:14, fontWeight:600, cursor:'pointer' }}>Sign In</button>
        <button onClick={() => setRole(null)} style={{ width:'100%', background:'none', border:'none', color:'#aaa', fontSize:12, marginTop:16, cursor:'pointer' }}>← Back</button>
      </div>
    </div>
  )
}
