/**
 * 安全区域初始化：在 Capacitor 原生环境中获取真实状态栏高度，
 * 通过 CSS 变量传递给前端。
 *
 * 调用时机：应用启动时（main.tsx）
 */

import { StatusBar, Style } from '@capacitor/status-bar'

export async function initSafeArea(): Promise<number> {
  const isNative = !!(window as any).Capacitor?.isNativePlatform()
  if (!isNative) return 0

  try {
    // 不启用 overlay，让系统管理状态栏区域
    await StatusBar.setOverlaysWebView({ overlay: false })

    // 深色图标适配浅色背景
    await StatusBar.setStyle({ style: Style.Dark })

    // 获取实际状态栏高度（px）
    const info = await StatusBar.getInfo()
    const height = info?.height ?? 0

    // 设为 CSS 变量供全局使用
    document.documentElement.style.setProperty('--safe-area-top', `${height || 24}px`)
    
    return height
  } catch {
    document.documentElement.style.setProperty('--safe-area-top', '24px')
    return 24
  }
}
