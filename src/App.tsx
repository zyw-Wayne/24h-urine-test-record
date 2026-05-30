import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/Common/ErrorBoundary'
import Loading from './components/Common/Loading'
import { configService } from './services/db'

// 路由级代码分割 — 每个页面按需加载，减少首屏体积
const RecordPage = lazy(() => import('./pages/Record'))
const HistoryPage = lazy(() => import('./pages/History'))
const ProfilePage = lazy(() => import('./pages/Profile'))

function App() {
  useEffect(() => {
    configService.get().then((config) => {
      if (config?.theme) {
        document.documentElement.setAttribute('data-prefers-color-scheme', config.theme)
      }
    })
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<Loading fullScreen text="加载中..." />}>
            <Routes>
              <Route path="/" element={<Navigate to="/record" replace />} />
              <Route path="/record" element={<RecordPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

