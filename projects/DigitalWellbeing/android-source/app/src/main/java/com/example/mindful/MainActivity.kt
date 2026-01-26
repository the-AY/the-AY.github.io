package com.example.mindful

import android.app.AlarmManager
import android.app.Dialog
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.mindful.data.DatabaseHelper
import com.example.mindful.model.ItemType
import com.example.mindful.model.ReminderType
import com.example.mindful.model.Task
import com.google.android.material.floatingactionbutton.FloatingActionButton
import java.text.SimpleDateFormat
import java.util.*

class MainActivity : AppCompatActivity(), SensorEventListener {

    private lateinit var tasksAdapter: TasksAdapter
    private var taskList = mutableListOf<Task>()
    private lateinit var dbHelper: DatabaseHelper
    private lateinit var sensorManager: SensorManager
    private var accelerometer: Sensor? = null

    // Flip Detection logic
    private var isFaceDown = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        dbHelper = DatabaseHelper(this)
        loadTasks()

        // Setup RecyclerView
        val recyclerView = findViewById<RecyclerView>(R.id.idTasksRecycler)
        recyclerView.layoutManager = LinearLayoutManager(this)
        tasksAdapter = TasksAdapter(taskList) { task ->
            // Update completion status in DB
            task.isCompleted = !task.isCompleted
            dbHelper.updateTaskStatus(task.id, task.isCompleted)
            tasksAdapter.notifyDataSetChanged()
        }
        recyclerView.adapter = tasksAdapter

        // Live Clock
        val clockText = findViewById<TextView>(R.id.idLiveClock)
        val timeFormat = SimpleDateFormat("EEEE, MMM d, hh:mm a", Locale.US)
        Timer().scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                runOnUiThread { clockText.text = timeFormat.format(Date()) }
            }
        }, 0, 1000)

        // Settings Button (Hidden visual, triggered by clock click for demo or could add icon)
        clockText.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }

        // Floating Action Button
        findViewById<FloatingActionButton>(R.id.idFab).setOnClickListener {
            showAddTaskDialog()
        }

        // Initialize Sensors
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    }

    override fun onResume() {
        super.onResume()
        accelerometer?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_UI)
        }
        loadTasks() // Refresh list
    }

    override fun onPause() {
        super.onPause()
        sensorManager.unregisterListener(this)
    }

    private fun loadTasks() {
        taskList.clear()
        taskList.addAll(dbHelper.getAllTasks().sortedByDescending { it.id })
    }

    // --- Sensor Logic (Flip to DND) ---
    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            val z = it.values[2]
            // If Z is around -9.8 (gravity), phone is face down
            if (z < -8.0 && !isFaceDown) {
                isFaceDown = true
                Toast.makeText(this, "🔕 Phone Flipped: DND Enabled", Toast.LENGTH_SHORT).show()
                // Here we would programmatically toggle DND in NotificationManager if allowed
            } else if (z > -8.0 && isFaceDown) {
                isFaceDown = false
                Toast.makeText(this, "🔔 DND Disabled", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not used
    }

    private fun showAddTaskDialog() {
        val dialog = Dialog(this)
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE)
        dialog.setContentView(R.layout.dialog_add_task)
        dialog.window?.setBackgroundDrawable(ColorDrawable(Color.TRANSPARENT))
        dialog.window?.setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

        val etTitle = dialog.findViewById<EditText>(R.id.etTitle)
        val etDesc = dialog.findViewById<EditText>(R.id.etDesc)
        val etAttach = dialog.findViewById<EditText>(R.id.etAttachment) // New Field
        val btnSave = dialog.findViewById<Button>(R.id.btnSave)
        val btnCancel = dialog.findViewById<Button>(R.id.btnCancel)

        btnCancel.setOnClickListener {
            dialog.dismiss()
        }

        btnSave.setOnClickListener {
            val title = etTitle.text.toString()
            if (title.isNotEmpty()) {
                val newTask = Task(
                    title = title,
                    description = etDesc.text.toString(),
                    time = SimpleDateFormat("HH:mm", Locale.US).format(Date()),
                    attachmentUri = etAttach.text.toString(), // Save attachment
                    type = ItemType.TASK
                )
                
                // Save to DB
                val id = dbHelper.addTask(newTask)
                loadTasks()
                tasksAdapter.notifyDataSetChanged()
                
                // Schedule Mock Call if needed (Demo logic)
                scheduleCallReminder(newTask)
                
                dialog.dismiss()
                Toast.makeText(this, "Task Added", Toast.LENGTH_SHORT).show()
            } else {
                etTitle.error = "Title required"
            }
        }

        dialog.show()
    }

    private fun scheduleCallReminder(task: Task) {
        // In a real app, use AlarmManager here.
        // For this demo, we'll simulate a delayed call if it's a "Call" type.
        if (task.reminderType == ReminderType.CALL || task.title.contains("Call", true)) {
             Toast.makeText(this, "Call Reminder simulated in 5s...", Toast.LENGTH_LONG).show()
             android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                 val intent = Intent(this, CallActivity::class.java)
                 intent.putExtra("EXTRA_TITLE", task.title)
                 intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                 startActivity(intent)
             }, 5000)
        }
    }

    // --- Adapter Class ---
    inner class TasksAdapter(
        private val tasks: List<Task>,
        private val onClick: (Task) -> Unit
    ) : RecyclerView.Adapter<TasksAdapter.ViewHolder>() {

        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val title: TextView = view.findViewById(R.id.itemTitle)
            val time: TextView = view.findViewById(R.id.itemTime)
            val desc: TextView = view.findViewById(R.id.itemDesc)
            val card: View = view.findViewById(R.id.itemCard)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_task, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val task = tasks[position]
            holder.title.text = task.title
            holder.time.text = task.time ?: ""
            
            // Show attachment in description if present
            var descText = task.description ?: ""
            if (!task.attachmentUri.isNullOrEmpty()) {
                descText += "\n📎 ${task.attachmentUri}"
            }
            holder.desc.text = descText.trim()
            
            holder.card.alpha = if (task.isCompleted) 0.5f else 1.0f
            holder.itemView.setOnClickListener { onClick(task) }
            
            // Long click to open settings as secret shortcut
            holder.itemView.setOnLongClickListener { 
                 startActivity(Intent(this@MainActivity, SettingsActivity::class.java))
                 true
            }
        }

        override fun getItemCount() = tasks.size
    }
}
