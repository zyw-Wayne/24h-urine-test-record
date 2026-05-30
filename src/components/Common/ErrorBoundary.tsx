import { Component, ErrorInfo, ReactNode } from 'react'
import { Card, Button } from 'antd-mobile'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  private _prevOnError: typeof window.onerror = null
  private _prevOnRejection: typeof window.onunhandledrejection = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidMount() {
    this._prevOnError = window.onerror
    this._prevOnRejection = window.onunhandledrejection
    window.onerror = (_msg, _url, _line, _col, error) => {
      console.error('Global error:', error)
    }
    window.onunhandledrejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
    }
  }

  componentWillUnmount() {
    window.onerror = this._prevOnError
    window.onunhandledrejection = this._prevOnRejection
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
                出现错误
              </div>
              <div style={{ color: 'var(--adm-color-weak)', marginBottom: '20px', fontSize: '14px' }}>
                {this.state.error?.message || '未知错误'}
              </div>
              <Button color="primary" onClick={this.handleReset}>
                重试
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

