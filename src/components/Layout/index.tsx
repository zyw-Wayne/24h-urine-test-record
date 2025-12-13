// AIGC START
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      <TabBar activeKey={location.pathname} onChange={(key) => navigate(key)}>
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
    </div>
  )
}

export default Layout
// AIGC END

