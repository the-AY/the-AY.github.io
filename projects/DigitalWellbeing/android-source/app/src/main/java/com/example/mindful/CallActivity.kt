package com.example.mindful

import android.os.Bundle
import android.os.Vibrator
import android.widget.ImageButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class CallActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_call)
        
        // Wake Screen logic (already handled by manifest flags mostly, but good to have)
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        val taskTitle = intent.getStringExtra("EXTRA_TITLE") ?: "Focus Time"
        findViewById<TextView>(R.id.callTitle).text = taskTitle

        // Vibrate
        val vibrator = getSystemService(VIBRATOR_SERVICE) as Vibrator
        val pattern = longArrayOf(0, 500, 500, 500, 500)
        vibrator.vibrate(pattern, 0) // Repeat at 0

        findViewById<ImageButton>(R.id.btnDecline).setOnClickListener {
            vibrator.cancel()
            finish()
        }

        findViewById<ImageButton>(R.id.btnAccept).setOnClickListener {
            vibrator.cancel()
            finish()
        }
    }
}
