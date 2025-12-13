// AIGC START
import { Empty } from 'antd-mobile'

interface EmptyStateProps {
  description?: string
  icon?: React.ReactNode
}

const EmptyState = ({ description = '暂无数据', icon }: EmptyStateProps) => {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Empty description={description} imageStyle={{ width: 128 }} />
      {icon && <div style={{ marginTop: '16px' }}>{icon}</div>}
    </div>
  )
}

export default EmptyState
// AIGC END

