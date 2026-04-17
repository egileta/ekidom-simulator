import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { SliderPanel } from './components/SliderPanel'
import { ResultsPanel } from './components/ResultsPanel'

export default function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Header />
      <Hero />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <SliderPanel />
        <ResultsPanel />
      </div>
    </div>
  )
}
