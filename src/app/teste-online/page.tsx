export default function TestPage() {
  return (
    <div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <h1>SISTEMA ONLINE ✅</h1>
      <p>Data/Hora: {new Date().toLocaleString()}</p>
      <p>Se você está vendo isso, o deploy da Vercel funcionou.</p>
    </div>
  )
}
