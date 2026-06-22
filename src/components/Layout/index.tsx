import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { FileOutline, UnorderedListOutline, UserOutline } from 'antd-mobile-icons'
import type { ReactNode } from 'react'
import { initSafeArea } from '@/utils/safeArea'

interface LayoutProps {
  children: ReactNode
}

// 提到组件外部，避免每次渲染重新创建
const tabs = [
  {
    key: '/record',
    title: '记录',
    icon: <FileOutline />,
  },
  {
    key: '/history',
    title: '历史',
    icon: <UnorderedListOutline />,
  },
  {
    key: '/profile',
    title: '我的',
    icon: <UserOutline />,
  },
]

// Android 默认状态栏高度估值 24px，JS 获取后会更新
const LayoutBase = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [safeAreaTop, setSafeAreaTop] = useState(24)

  useEffect(() => {
    initSafeArea().then(setSafeAreaTop).catch(() => setSafeAreaTop(24))
  }, [])

  return (
    <div style={{ 
      height: '100dvh', 
      display: 'flex', 
      flexDirection: 'column',
      paddingTop: safeAreaTop,
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 50px)',
    }}>
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'var(--adm-color-background)',
        borderTop: '1px solid var(--adm-color-border)',
      }}>
        <TabBar activeKey={location.pathname} onChange={(key) => navigate(key)}>
          {tabs.map((item) => (
            <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
          ))}
        </TabBar>
      </div>
    </div>
  )
}

export default LayoutBase
