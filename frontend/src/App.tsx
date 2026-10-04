import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './features/auth/Login'
import Home from './features/home/Home'
import Vision from './features/vision/Vision'
import StagePage from './features/stages/StagePage'
import TechCompanies from './features/tech/TechCompanies'
import Settings from './features/settings/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/vision" element={<Vision />} />
        <Route path="/stages/:id" element={<StagePage />} />
        <Route path="/tech" element={<TechCompanies />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
