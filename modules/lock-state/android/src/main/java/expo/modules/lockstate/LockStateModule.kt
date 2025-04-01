package expo.modules.lockstate

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LockStateModule : Module() {
  private lateinit var lockStateReceiver: BroadcastReceiver

  override fun definition() = ModuleDefinition {
    Name("LockState")

    // We declare the two event types we plan to send
    Events("LOCKED", "UNLOCKED")

    OnCreate {
      lockStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
          when (intent.action) {
            Intent.ACTION_SCREEN_OFF -> {
              // Device locked
              sendEvent("LOCKED", mapOf<String, Any>())
            }
            Intent.ACTION_USER_PRESENT -> {
              // Device unlocked
              sendEvent("UNLOCKED", mapOf<String, Any>())
            }
          }
        }
      }

      val filter = IntentFilter().apply {
        addAction(Intent.ACTION_SCREEN_OFF)
        addAction(Intent.ACTION_USER_PRESENT)
      }

      appContext.reactContext?.registerReceiver(lockStateReceiver, filter)
    }

    OnDestroy {
      appContext.reactContext?.unregisterReceiver(lockStateReceiver)
    }
  }
}
