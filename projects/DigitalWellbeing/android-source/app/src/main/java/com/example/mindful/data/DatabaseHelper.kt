package com.example.mindful.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import com.example.mindful.model.ItemType
import com.example.mindful.model.ReminderType
import com.example.mindful.model.Task
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class DatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        private const val DATABASE_NAME = "Mindful.db"
        private const val DATABASE_VERSION = 1
        private const val TABLE_TASKS = "tasks"
        
        // Col names
        private const val COL_ID = "id"
        private const val COL_TYPE = "type"
        private const val COL_TITLE = "title"
        private const val COL_DESC = "description"
        private const val COL_DATE = "date"
        private const val COL_TIME = "time"
        private const val COL_REMINDER = "reminder_type"
        private const val COL_ATTACHMENT = "attachment"
        private const val COL_RECURRING = "recurring" // JSON string
        private const val COL_COMPLETED = "completed"
        private const val COL_SKIPPED = "skipped"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createTable = "CREATE TABLE $TABLE_TASKS (" +
                "$COL_ID INTEGER PRIMARY KEY, " +
                "$COL_TYPE TEXT, " +
                "$COL_TITLE TEXT, " +
                "$COL_DESC TEXT, " +
                "$COL_DATE TEXT, " +
                "$COL_TIME TEXT, " +
                "$COL_REMINDER TEXT, " +
                "$COL_ATTACHMENT TEXT, " +
                "$COL_RECURRING TEXT, " +
                "$COL_COMPLETED INTEGER, " +
                "$COL_SKIPPED INTEGER)"
        db.execSQL(createTable)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS $TABLE_TASKS")
        onCreate(db)
    }

    fun addTask(task: Task): Long {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COL_ID, task.id)
            put(COL_TYPE, task.type.name)
            put(COL_TITLE, task.title)
            put(COL_DESC, task.description)
            put(COL_DATE, task.date)
            put(COL_TIME, task.time)
            put(COL_REMINDER, task.reminderType.name)
            put(COL_ATTACHMENT, task.attachmentUri)
            put(COL_RECURRING, Gson().toJson(task.recurringDays))
            put(COL_COMPLETED, if (task.isCompleted) 1 else 0)
            put(COL_SKIPPED, if (task.isSkipped) 1 else 0)
        }
        return db.insert(TABLE_TASKS, null, values)
    }

    fun getAllTasks(): List<Task> {
        val taskList = ArrayList<Task>()
        val db = this.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM $TABLE_TASKS", null)

        if (cursor.moveToFirst()) {
            do {
                val task = Task(
                    id = cursor.getLong(cursor.getColumnIndexOrThrow(COL_ID)),
                    type = ItemType.valueOf(cursor.getString(cursor.getColumnIndexOrThrow(COL_TYPE))),
                    title = cursor.getString(cursor.getColumnIndexOrThrow(COL_TITLE)),
                    description = cursor.getString(cursor.getColumnIndexOrThrow(COL_DESC)),
                    date = cursor.getString(cursor.getColumnIndexOrThrow(COL_DATE)),
                    time = cursor.getString(cursor.getColumnIndexOrThrow(COL_TIME)),
                    reminderType = ReminderType.valueOf(cursor.getString(cursor.getColumnIndexOrThrow(COL_REMINDER))),
                    attachmentUri = cursor.getString(cursor.getColumnIndexOrThrow(COL_ATTACHMENT)),
                    recurringDays = try {
                        val json = cursor.getString(cursor.getColumnIndexOrThrow(COL_RECURRING))
                        Gson().fromJson(json, object : TypeToken<List<Int>>() {}.type)
                    } catch (e: Exception) { null },
                    isCompleted = cursor.getInt(cursor.getColumnIndexOrThrow(COL_COMPLETED)) == 1,
                    isSkipped = cursor.getInt(cursor.getColumnIndexOrThrow(COL_SKIPPED)) == 1
                )
                taskList.add(task)
            } while (cursor.moveToNext())
        }
        cursor.close()
        return taskList
    }

    fun updateTaskStatus(id: Long, isCompleted: Boolean) {
        val db = this.writableDatabase
        val values = ContentValues().apply {
            put(COL_COMPLETED, if (isCompleted) 1 else 0)
        }
        db.update(TABLE_TASKS, values, "$COL_ID = ?", arrayOf(id.toString()))
    }
}
