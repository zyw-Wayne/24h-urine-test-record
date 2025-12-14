import { useLocation, useNavigate } from 'react-router-dom'
import { TabBar } from 'antd-mobile'
import { FileOutline, UnorderedListOutline, UserOutline } from 'antd-mobile-icons'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const navigate = useNavigate()

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

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 50px)',
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
        backgroundColor: '#fff',
        borderTop: '1px solid #f0f0f0',
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

export default Layout

