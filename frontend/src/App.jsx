import { useEffect, useState } from 'react'
import supabase from './supabase'
import Login from './pages/Login'
import AdvisorDashboard from './pages/AdvisorDashboard'
import ClientDashboard from './pages/ClientDashboard'

export default function App() {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadRole(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadRole(session.user.id)
      else { setRole(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadRole = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    setRole(data?.role || 'client')
    setLoading(false)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'80px', color:'#aaa', fontSize:14 }}>Loading...</div>

  if (!session) return <Login />

  if (role === 'advisor') return <AdvisorDashboard />
  return <ClientDashboard />
}
