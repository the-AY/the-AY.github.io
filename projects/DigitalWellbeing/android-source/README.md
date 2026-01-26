# Mindful - Android Source Code

Here are the essential Kotlin and XML files to recreate the Digital Wellbeing app in Android Studio.

## How to specific use
1. Create a new **Android Project** in Android Studio (Select "Empty Views Activity").
2. Copy the files from this folder into your project structure logic:
   - `MainActivity.kt` -> `app/src/main/java/com/example/mindful/`
   - `model/Task.kt` -> `app/src/main/java/com/example/mindful/model/`
   - `layout/*.xml` -> `app/src/main/res/layout/`
   - `values/colors.xml` -> `app/src/main/res/values/`
3. Add these dependencies to your `build.gradle (Module: app)`:
   ```gradle
   implementation("androidx.recyclerview:recyclerview:1.3.0")
   implementation("com.google.android.material:material:1.9.0")
   implementation("com.google.code.gson:gson:2.10.1") // For simple persistence
   ```

## Features Included
- **Task Management**: Add tasks with date/time.
- **Cancel Logic**: Working Cancel button in dialogs.
- **RecyclerView**: Efficient list rendering.
- **Modern UI**: Dark theme styles matching web design.
