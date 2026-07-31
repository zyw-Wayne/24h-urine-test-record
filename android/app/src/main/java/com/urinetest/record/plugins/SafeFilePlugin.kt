package com.urinetest.record.plugins

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.OpenableColumns
import android.util.Base64
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Logger
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * 通过 Android Storage Access Framework (SAF) 保存文件。
 *
 * 背景：targetSdk 30+ 强制 scoped storage，应用无法直接写入公共目录
 * （Environment.getExternalStoragePublicDirectory 会抛异常），而 Cache+Share
 * 方案依赖用户手动选择保存位置，体验割裂。
 *
 * 方案：使用 ACTION_CREATE_DOCUMENT 让系统弹出"保存到"对话框，用户选定位置后
 * 由系统授予 URI 写权限，应用直接写入 —— 这是 Android 官方推荐的外部存储持久化方式。
 */
@CapacitorPlugin(name = "SafeFile")
class SafeFilePlugin : Plugin() {
    @PluginMethod
    fun saveDocument(call: PluginCall) {
        val fileName = call.getString("fileName")
        val data = call.getString("data") // Base64 编码的文件内容
        val mimeType = call.getString("mimeType") ?: "application/octet-stream"

        if (fileName.isNullOrEmpty() || data.isNullOrEmpty()) {
            call.reject("fileName 和 data 不能为空")
            return
        }

        try {
            // 解码 Base64 得到原始字节
            val bytes = Base64.decode(data, Base64.DEFAULT)
            if (bytes.isEmpty()) {
                call.reject("文件内容为空")
                return
            }

            // 构建系统"保存到"对话框。ACTION_CREATE_DOCUMENT 会：
            // 1. 让用户选择保存位置（下载/文档/其他 app）
            // 2. 返回带写权限的 content:// URI
            val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = mimeType
                putExtra(Intent.EXTRA_TITLE, fileName)
            }

            saveCall(call, bytes)
            startActivityForResult(call, intent, "saveDocumentResult")
        } catch (e: Exception) {
            call.reject("文件内容无法解码: ${e.message}")
        }
    }

    // 保存待写入的字节，供回调使用（PluginCall 的存活周期跨 activity 回调）
    private val pendingBytes = HashMap<String, ByteArray>()

    private fun saveCall(call: PluginCall, bytes: ByteArray) {
        pendingBytes[call.callbackId] = bytes
    }

    private fun takeBytes(call: PluginCall): ByteArray? = pendingBytes.remove(call.callbackId)

    @ActivityCallback
    fun saveDocumentResult(call: PluginCall, result: ActivityResult) {
        try {
            val bytes = takeBytes(call)
            if (bytes == null) {
                call.reject("内部错误：未找到待写入的数据")
                return
            }

            if (result.resultCode != Activity.RESULT_OK || result.data?.data == null) {
                // 用户取消保存，不视为失败
                call.resolve(JSObject().apply {
                    put("status", "canceled")
                })
                return
            }

            val uri: Uri = result.data!!.data!!
            val contentResolver = context.contentResolver

            // 写入文件内容
            contentResolver.openOutputStream(uri)?.use { output ->
                output.write(bytes)
                output.flush()
            } ?: run {
                call.reject("无法打开目标文件写入")
                return
            }

            // 通知系统媒体库/文件已变更，让新文件立即可见
            val displayName = queryDisplayName(uri) ?: "export"
            val values = android.content.ContentValues().apply {
                put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, displayName)
                put(android.provider.MediaStore.MediaColumns.IS_PENDING, 0)
            }
            try {
                contentResolver.update(uri, values, null, null)
            } catch (_: Exception) {
                // MediaStore update 非必须，忽略失败
            }

            call.resolve(JSObject().apply {
                put("status", "saved")
                put("uri", uri.toString())
            })
        } catch (e: Exception) {
            Logger.error("SafeFile save failed", e)
            call.reject("保存失败: ${e.message}")
        }
    }

    // 查询 SAF 返回 URI 的显示文件名（用于 MediaStore 更新）
    private fun queryDisplayName(uri: Uri): String? {
        return try {
            context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (idx >= 0) cursor.getString(idx) else null
                } else null
            }
        } catch (_: Exception) {
            null
        }
    }
}
