/**
 * Instructions for Adishy:
 * 1. Create a Google Form with fields exactly like this (in order, or update the indexes below):
 *    - Name (Short answer)
 *    - Email (Short answer)
 *    - Date of Meeting (Date)
 *    - Time Preferences / Additional Notes (Paragraph)
 * 2. In your Google Form, click the three dots (More) in the top right -> Script Editor.
 * 3. Delete any code there and paste all of the code below.
 * 4. Save the project (Ctrl+S).
 * 5. Click the "Triggers" icon on the left (looks like an alarm clock).
 * 6. Add a trigger:
 *    - Choose which function to run: onFormSubmit
 *    - Choose which deployment should run: Head
 *    - Select event source: From form
 *    - Select event type: On form submit
 * 7. Click Save, and authorize your account to manage Calendars and Forms!
 */

function onFormSubmit(e) {
  // Replace these variables if your form fields are ordered differently.
  // In Google Apps Script for Forms, e.values array contains the responses in order.
  // e.values[0] is the Timestamp automatically added by Google Forms.
  
  var name = e.values[1];
  var clientEmail = e.values[2];
  var meetingDateStr = e.values[3]; // Output from Date field
  var notes = e.values[4]; // Time preferences or notes

  var myEmail = "adishy.is19@gmail.com";
  var eventTitle = "Meeting: " + name + " & Adishy";
  
  // Since time might just be text preferences in a basic form, 
  // we will create an "All Day" event or handle basic time passing.
  // For simplicity, we create an All Day event on the requested date. 
  // You will reach out to confirm the exact time based on their notes.
  
  var meetingDate = new Date(meetingDateStr);
  
  // Description included in the calendar invite
  var description = "Name: " + name + "\n" +
                    "Email: " + clientEmail + "\n" +
                    "Client Notes/Time Preferences: " + notes + "\n\n" +
                    "Note: The exact time will be confirmed by Adishy shortly.";

  try {
    // Get default calendar
    var calendar = CalendarApp.getDefaultCalendar();
    
    // Create an all-day event on that date (or you can use createEvent for specific times if you parse time)
    var event = calendar.createAllDayEvent(eventTitle, meetingDate, {
      description: description,
      guests: clientEmail + "," + myEmail,
      sendInvites: true
    });
    
    Logger.log("Event created ID: " + event.getId());
  } catch(error) {
    Logger.log(error.toString());
  }
}
