// AIGC START
import { SpinLoading } from 'antd-mobile'

interface LoadingProps {
  text?: string
  fullScreen?: boolean
}

const Loading = ({ text = '加载中...', fullScreen = false }: LoadingProps) => {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <SpinLoading style={{ '--size': '48px' }} />
      {text && <div style={{ marginTop: '16px', color: '#999' }}>{text}</div>}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    )
  }

  return content
}

export default Loading
// AIGC END

