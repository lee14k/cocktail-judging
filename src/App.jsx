import { Routes, Route, Navigate } from 'react-router'
import Home from './Home.jsx'
import JudgeApp from './judge/JudgeApp.jsx'
import AdminApp from './admin/AdminApp.jsx'
import EnterPage from './enter/EnterPage.jsx'
import EmbedPage from './enter/EmbedPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/judge" element={<JudgeApp />} />
      <Route path="/admin" element={<AdminApp />} />
      <Route path="/enter" element={<EnterPage />} />
      <Route path="/embed" element={<EmbedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
