import React, { useEffect, useState } from 'react'
import Nav from '../components/Nav'
import { getMe } from '../api'

const S = {
  page: { padding: 32 },
  h1: { fontSize: 22, fontWeight: 700, marginBottom: 20, color: '#0d4f2e' },
  card: { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 400,
          boxShadow: '0 2px 12px rgba(0,0,0,.07)' },
  row: { display: 'flex', gap: 8, marginBottom: 12, fontSize: 14 },
  key: { fontWeight: 600, color: '#555', width: 120 },
}

export default function Profile() {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    getMe().then(r => setProfile(r.data))
  }, [])

  return (
    <>
      <Nav />
      <div style={S.page}>
        <h1 style={S.h1}>Profile</h1>
        {profile ? (
          <div style={S.card}>
            {Object.entries(profile).map(([k, v]) => (
              <div key={k} style={S.row}>
                <span style={S.key}>{k}</span>
                <span>{String(v)}</span>
              </div>
            ))}
          </div>
        ) : <p>Loading…</p>}
      </div>
    </>
  )
}
