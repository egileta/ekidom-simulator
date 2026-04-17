import { Header } from './components/Header'
import { SliderPanel } from './components/SliderPanel'
import { ResultsPanel } from './components/ResultsPanel'

export default function App() {
  return (
    <>
      <div style={{ minHeight: '100vh' }}>
        <Header />
        <div
          className="main-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <SliderPanel />
          <ResultsPanel />
        </div>
      </div>
      {/* Mobile: padding so SliderPanel content isn't hidden behind fixed panel */}
      <style>{`
        @media (max-width: 700px) { .main-grid { padding-bottom: 240px; } }
      `}</style>
    </>
  )
}
