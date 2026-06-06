package com.questboardmobile

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.TimeUnit

class QBNetModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

    companion object {
        const val NAME = "QBNet"
        private val JSON_TYPE = "application/json; charset=utf-8".toMediaTypeOrNull()
        private val results = ConcurrentHashMap<String, String>()
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .build()

    override fun getName() = NAME

    private fun writeResult(id: String, json: String) {
        results[id] = json
        Log.d("QBNet", "result[$id] ${json.take(120)}")
    }

    private fun safeJson(s: String): String {
        val t = s.trim()
        return if (t.startsWith("{") || t.startsWith("[")) t
        else "\"${t.take(300).replace("\\", "\\\\").replace("\"", "\\\"")}\""
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun poll(requestId: String): String? = results.remove(requestId)

    @ReactMethod
    fun get(url: String, requestId: String) {
        Log.d("QBNet", "GET $url [$requestId]")
        val req = Request.Builder().url(url).header("Connection", "close").build()
        client.newCall(req).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                val msg = (e.message ?: "network error").take(200).replace("\"", "'")
                writeResult(requestId, """{"ok":false,"error":"$msg"}""")
            }
            override fun onResponse(call: Call, response: Response) {
                response.use { r ->
                    val body = runCatching { r.body?.string() ?: "" }.getOrDefault("")
                    writeResult(requestId, """{"ok":${r.isSuccessful},"status":${r.code},"body":${safeJson(body)}}""")
                }
            }
        })
    }

    @ReactMethod
    fun post(url: String, body: String, requestId: String) {
        Log.d("QBNet", "POST $url [$requestId]")
        val reqBody = body.toRequestBody(JSON_TYPE)
        val req = Request.Builder().url(url).post(reqBody).header("Connection", "close").build()
        client.newCall(req).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                val msg = (e.message ?: "network error").take(200).replace("\"", "'")
                writeResult(requestId, """{"ok":false,"error":"$msg"}""")
            }
            override fun onResponse(call: Call, response: Response) {
                response.use { r ->
                    val body2 = runCatching { r.body?.string() ?: "" }.getOrDefault("")
                    writeResult(requestId, """{"ok":${r.isSuccessful},"status":${r.code},"body":${safeJson(body2)}}""")
                }
            }
        })
    }
}
