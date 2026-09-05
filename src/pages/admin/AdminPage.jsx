export default function AdminPage() {
  return (
    <section style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 560 }}>
        <h1 style={{ marginBottom: '0.75rem' }}>Admin Dashboard</h1>
        <p style={{ opacity: 0.85, marginBottom: '1rem' }}>
          The admin panel is hosted as a separate app.
        </p>
        <a href="https://admin.nexasphere-glbajaj.vercel.app" target="_blank" rel="noreferrer">
          Open Admin Dashboard
        </a>
      </div>
    </section>
  );
}
