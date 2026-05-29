import { Empty } from 'antd-mobile'

interface EmptyStateProps {
  description?: string
}

const EmptyState = ({ description = '暂无数据' }: EmptyStateProps) => {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <Empty description={description} imageStyle={{ width: 128 }} />
    </div>
  )
}

export default EmptyState

