import { useEffect, useRef } from 'react'
import { pushBackHandler, removeBackHandler } from './backHandler'

/**
 * 注册一个 Android 返回键处理回调。
 *
 * 每次渲染都会用最新的闭包（通过 ref），但只向全局栈注册/注销一次。
 * 回调返回 true 表示已处理本次返回（关闭了某个弹层），返回 false 表示
 * 未处理（会继续走全局的退出确认流程）。
 */
export function useBackHandler(handler: () => boolean): void {
  const ref = useRef(handler)
  ref.current = handler

  useEffect(() => {
    const wrapped = () => ref.current()
    pushBackHandler(wrapped)
    return () => removeBackHandler(wrapped)
  }, [])
}
