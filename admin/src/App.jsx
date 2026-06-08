import Admin from './components/Admin';
import { getImageUrl } from './api';

export default function App() {
  return (
    <>
      <header style={{
        background: 'var(--bg-glass)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={getImageUrl('/uploads/logo.png')} 
            alt="🌶️" 
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          />
          <div>
            <h1 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontSize: '1.25rem', 
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.2
            }}>
              Паприка
            </h1>
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              fontWeight: 600
            }}>
              Панель управления
            </span>
          </div>
        </div>
      </header>
      <main style={{ paddingBottom: '40px' }}>
        <Admin />
      </main>
    </>
  );
}
