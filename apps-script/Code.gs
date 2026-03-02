/* ============================================
   EHS LiveWell — Code.gs
   Main Apps Script: configuration, form handler,
   calendar integration, GitHub webhook trigger
   ============================================ */

// =============================================
// CONFIGURATION — Update these values
// =============================================
const CONFIG = {
  // Admin email addresses that receive approval notifications
  ADMIN_EMAILS: [
    'admin1@yourdomain.com',
    'admin2@yourdomain.com',
  ],

  // Google Calendar IDs — one per wellness category
  // Create calendars in Google Calendar, then find their IDs in calendar settings
  CALENDAR_IDS: {
    'Physical':     'your_physical_calendar_id@group.calendar.google.com',
    'Mental':       'your_mental_calendar_id@group.calendar.google.com',
    'Nutrition':    'your_nutrition_calendar_id@group.calendar.google.com',
    'Social':       'your_social_calendar_id@group.calendar.google.com',
    'Professional': 'your_professional_calendar_id@group.calendar.google.com',
  },

  // Calendar event colors (Google Calendar color IDs)
  // 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana,
  // 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato
  CALENDAR_COLORS: {
    'Physical':     '10', // Basil (green)
    'Mental':       '9',  // Blueberry (purple)
    'Nutrition':    '5',  // Banana (yellow)
    'Social':       '11', // Tomato (red-orange)
    'Professional': '8',  // Graphite (dark)
  },

  // GitHub repository dispatch webhook
  GITHUB_REPO: 'your-username/ehslivewell',
  GITHUB_TOKEN: '', // Personal access token with repo scope — store in Script Properties for security

  // Sheet name where form responses land
  SHEET_NAME: 'Submissions',

  // Column indices (1-based) — adjust if your form changes
  COLUMNS: {
    TIMESTAMP:    1,
    TYPE:         2,   // Event, Recommendation, Provider, Wellness Resource
    TITLE:        3,
    DESCRIPTION:  4,
    LINK:         5,
    FILE_UPLOAD:  6,
    START_DATE:   7,
    END_DATE:     8,
    CATEGORY:     9,   // Calendar category (for events)
    SUBMITTER:    10,
    EMAIL:        11,
    STATUS:       12,  // Pending / Approved / Rejected
    APPROVED_BY:  13,
    APPROVED_AT:  14,
    DRIVE_LINKS:  15,
  },
};

// =============================================
// FORM SUBMISSION HANDLER
// =============================================

/**
 * Trigger: set up an installable "On form submit" trigger pointing to this function.
 */
function onFormSubmit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const row = sheet.getLastRow();

  // Set initial status to Pending
  sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue('Pending');

  // Extract uploaded file links from Drive (if any)
  const fileCell = sheet.getRange(row, CONFIG.COLUMNS.FILE_UPLOAD).getValue();
  if (fileCell) {
    const driveLinks = extractDriveLinks(fileCell);
    sheet.getRange(row, CONFIG.COLUMNS.DRIVE_LINKS).setValue(driveLinks);
  }

  // Auto-categorize placeholder (stub for AI integration)
  autoCategorizePlaceholder(row, sheet);

  // Send approval email to admins with Approve/Reject buttons
  sendApprovalEmail(row, sheet);
}

// =============================================
// DRIVE FILE LINK EXTRACTION
// =============================================

/**
 * Extracts viewable Drive links from form file upload responses.
 */
function extractDriveLinks(fileCell) {
  if (!fileCell) return '';
  try {
    // Form file uploads store Drive file IDs
    const ids = String(fileCell).split(',').map(s => s.trim()).filter(Boolean);
    const links = ids.map(id => {
      try {
        const file = DriveApp.getFileById(id);
        return file.getUrl();
      } catch (err) {
        return `https://drive.google.com/file/d/${id}/view`;
      }
    });
    return links.join('\n');
  } catch (err) {
    return String(fileCell);
  }
}

// =============================================
// STATUS CHANGE HANDLER (backup for manual edits)
// =============================================

/**
 * If someone manually changes the Status column in the sheet,
 * this "On edit" trigger handles the approval flow.
 * Set up an installable "On edit" trigger pointing here.
 */
function onSheetEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) return;
  if (e.range.getColumn() !== CONFIG.COLUMNS.STATUS) return;

  const newStatus = e.range.getValue();
  const row = e.range.getRow();
  if (row <= 1) return; // Header row

  if (newStatus === 'Approved') {
    processApproval(row, sheet, 'Sheet Edit');
  }
}

// =============================================
// APPROVAL PROCESSING
// =============================================

/**
 * Called when a submission is approved (via email button or sheet edit).
 */
function processApproval(row, sheet, approvedBy) {
  // Record approval metadata
  sheet.getRange(row, CONFIG.COLUMNS.APPROVED_BY).setValue(approvedBy || 'Admin');
  sheet.getRange(row, CONFIG.COLUMNS.APPROVED_AT).setValue(new Date());

  const type = sheet.getRange(row, CONFIG.COLUMNS.TYPE).getValue();

  // If it's an Event, create a Google Calendar entry
  if (type === 'Event') {
    createCalendarEvent(row, sheet);
  }

  // Trigger GitHub Actions rebuild
  triggerGitHubRebuild();
}

// =============================================
// GOOGLE CALENDAR INTEGRATION
// =============================================

function createCalendarEvent(row, sheet) {
  const title = sheet.getRange(row, CONFIG.COLUMNS.TITLE).getValue();
  const description = sheet.getRange(row, CONFIG.COLUMNS.DESCRIPTION).getValue();
  const startDate = sheet.getRange(row, CONFIG.COLUMNS.START_DATE).getValue();
  const endDate = sheet.getRange(row, CONFIG.COLUMNS.END_DATE).getValue();
  const category = sheet.getRange(row, CONFIG.COLUMNS.CATEGORY).getValue();
  const link = sheet.getRange(row, CONFIG.COLUMNS.LINK).getValue();

  const calendarId = CONFIG.CALENDAR_IDS[category];
  if (!calendarId) {
    Logger.log('No calendar configured for category: ' + category);
    return;
  }

  try {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      Logger.log('Calendar not found: ' + calendarId);
      return;
    }

    const eventDesc = description + (link ? '\n\nLink: ' + link : '');
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1hr

    const event = calendar.createEvent(title, start, end, { description: eventDesc });

    // Set color
    const colorId = CONFIG.CALENDAR_COLORS[category];
    if (colorId) {
      event.setColor(colorId);
    }

    Logger.log('Created calendar event: ' + title);
  } catch (err) {
    Logger.log('Error creating calendar event: ' + err.message);
  }
}

// =============================================
// GITHUB ACTIONS WEBHOOK
// =============================================

function triggerGitHubRebuild() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN') || CONFIG.GITHUB_TOKEN;
  if (!token || !CONFIG.GITHUB_REPO) {
    Logger.log('GitHub token or repo not configured — skipping rebuild trigger.');
    return;
  }

  const url = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/dispatches`;
  const payload = { event_type: 'sheet-approved' };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      contentType: 'application/json',
      headers: { Authorization: 'token ' + token },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    Logger.log('GitHub dispatch response: ' + response.getResponseCode());
  } catch (err) {
    Logger.log('Error triggering GitHub rebuild: ' + err.message);
  }
}

// =============================================
// AI AUTO-CATEGORIZATION PLACEHOLDER
// =============================================

/**
 * Stub function for AI-powered auto-categorization.
 * Uncomment and add your API key to enable.
 *
 * This could call OpenAI, Claude, or any other API to suggest:
 * - Resource type (Event, Recommendation, Provider, Wellness Resource)
 * - Calendar category (Physical, Mental, Nutrition, Social, Professional)
 *
 * The suggestion would be placed in an adjacent column for admin review.
 */
function autoCategorizePlaceholder(row, sheet) {
  // const title = sheet.getRange(row, CONFIG.COLUMNS.TITLE).getValue();
  // const description = sheet.getRange(row, CONFIG.COLUMNS.DESCRIPTION).getValue();
  //
  // const prompt = `Categorize this wellness resource.
  //   Title: ${title}
  //   Description: ${description}
  //   Categories: Physical, Mental, Nutrition, Social, Professional
  //   Types: Event, Recommendation, Provider, Wellness Resource
  //   Respond with JSON: {"type": "...", "category": "..."}`;
  //
  // const API_KEY = PropertiesService.getScriptProperties().getProperty('AI_API_KEY');
  // const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   contentType: 'application/json',
  //   headers: { Authorization: 'Bearer ' + API_KEY },
  //   payload: JSON.stringify({
  //     model: 'gpt-4o-mini',
  //     messages: [{ role: 'user', content: prompt }],
  //     max_tokens: 100,
  //   }),
  // });
  //
  // const result = JSON.parse(response.getContentText());
  // const suggestion = JSON.parse(result.choices[0].message.content);
  // // Write suggestion to a "Suggested Category" column for admin review
  // sheet.getRange(row, CONFIG.COLUMNS.DRIVE_LINKS + 1).setValue(JSON.stringify(suggestion));

  Logger.log('Auto-categorization placeholder — no API key configured.');
}

// =============================================
// UTILITY: Read all approved rows for a given type
// =============================================

function getApprovedByType(type) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  return data.slice(1).filter(row => {
    return row[CONFIG.COLUMNS.STATUS - 1] === 'Approved' &&
           (!type || row[CONFIG.COLUMNS.TYPE - 1] === type);
  }).map(row => ({
    type:        row[CONFIG.COLUMNS.TYPE - 1],
    title:       row[CONFIG.COLUMNS.TITLE - 1],
    description: row[CONFIG.COLUMNS.DESCRIPTION - 1],
    link:        row[CONFIG.COLUMNS.LINK - 1],
    startDate:   row[CONFIG.COLUMNS.START_DATE - 1],
    endDate:     row[CONFIG.COLUMNS.END_DATE - 1],
    category:    row[CONFIG.COLUMNS.CATEGORY - 1],
    submitter:   row[CONFIG.COLUMNS.SUBMITTER - 1],
    driveLinks:  row[CONFIG.COLUMNS.DRIVE_LINKS - 1],
  }));
}
