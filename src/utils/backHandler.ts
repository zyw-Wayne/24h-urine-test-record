// Android 返回键全局处理
//
// Capacitor 中注册 backButton listener 后，默认的"无路由可回退则退出应用"
// 行为会被禁用，返回键完全交给 JS 处理。这里维护一个"关闭当前弹层"的
// 回调栈（LIFO），各页面把自己的 Popup 关闭逻辑注册进来，backButton 触发
// 时按后进先出的顺序尝试关闭，全部失败才走"退出应用"流程。

type BackHandler = () => boolean
const handlers: BackHandler[] = []

/** 注册一个返回处理回调（页面挂载/弹窗打开时调用） */
export function pushBackHandler(handler: BackHandler): void {
  handlers.push(handler)
}

/** 注销回调（必须传入与 push 相同的函数引用） */
export function removeBackHandler(handler: BackHandler): void {
  const idx = handlers.indexOf(handler)
  if (idx >= 0) handlers.splice(idx, 1)
}

/** 触发返回处理：从栈顶往下找能处理的回调，返回是否已消费本次返回 */
export function handleBackPress(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true
  }
  return false
}

/** Capacitor 原生平台检测 */
export function isNativePlatform(): boolean {
  return !!(window as unknown as { Capacitor?: { isNativePlatform: () => boolean } }).Capacitor?.isNativePlatform()
}
