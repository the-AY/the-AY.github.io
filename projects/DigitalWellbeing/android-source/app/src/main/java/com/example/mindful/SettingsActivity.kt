package com.example.mindful

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.widget.Switch
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    private lateinit var switchUsage: Switch
    private lateinit var switchOverlay: Switch
    private lateinit var switchBattery: Switch

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        switchUsage = findViewById(R.id.switchUsage)
        switchOverlay = findViewById(R.id.switchOverlay)
        switchBattery = findViewById(R.id.switchBattery)

        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        checkPermissions()
    }

    private fun checkPermissions() {
        // Check Usage Stats
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        } else {
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), packageName)
        }
        switchUsage.isChecked = mode == AppOpsManager.MODE_ALLOWED

        // Check Overlay
        switchOverlay.isChecked = Settings.canDrawOverlays(this)

        // Check Battery Optimization
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        switchBattery.isChecked = pm.isIgnoringBatteryOptimizations(packageName)
    }

    private fun setupListeners() {
        switchUsage.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
            Toast.makeText(this, "Find Mindful and enable access", Toast.LENGTH_LONG).show()
        }

        switchOverlay.setOnClickListener {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            startActivity(intent)
        }

        switchBattery.setOnClickListener {
            val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
            intent.data = Uri.parse("package:$packageName")
            startActivity(intent)
        }
    }
}
