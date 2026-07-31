import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toast } from 'antd-mobile'
import { App as CapacitorApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import Layout from './components/Layout'
import ErrorBoundary from './components/Common/ErrorBoundary'
import Loading from './components/Common/Loading'
import { configService } from './services/db'
import { handleBackPress, isNativePlatform } from './utils/backHandler'

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

  // Android 返回键统一处理：
  // 1. 有弹层（Popup）时先关闭弹层，不退出应用
  // 2. 无弹层时，2 秒内再按一次才退出（二次确认）
  useEffect(() => {
    if (!isNativePlatform()) return

    let lastExitTime = 0
    let handle: PluginListenerHandle | null = null

    CapacitorApp.addListener('backButton', () => {
      // 优先关闭当前打开的弹层（各页面已注册关闭回调）
      if (handleBackPress()) return

      // 无弹层：二次确认退出
      const now = Date.now()
      if (now - lastExitTime < 2000) {
        void CapacitorApp.exitApp()
      } else {
        lastExitTime = now
        Toast.show({ content: '再按一次退出应用', icon: 'info', duration: 1500 })
      }
    }).then((h) => {
      handle = h
    })

    return () => {
      handle?.remove()
    }
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

