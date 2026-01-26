package com.example.mindful.model

enum class ItemType {
    TASK, SCHEDULE, REMINDER
}

enum class ReminderType {
    NOTIFICATION, ALARM, CALL
}

data class Task(
    val id: Long = System.currentTimeMillis(),
    val type: ItemType = ItemType.TASK,
    val title: String,
    val description: String? = null,
    val date: String? = null,
    val time: String? = null,
    val reminderType: ReminderType = ReminderType.ALARM,
    val attachmentUri: String? = null, // Path to local file or URL
    val recurringDays: List<Int>? = null,
    var isCompleted: Boolean = false,
    var isSkipped: Boolean = false
)
