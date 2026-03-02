# EHS LiveWell — Apps Script Setup

This folder contains the Google Apps Script files that power the approval workflow.

## Files

- **Code.gs** — Configuration, form submission handler, Google Calendar integration, GitHub webhook trigger, AI categorization placeholder
- **approval.gs** — Email-based approval with Approve/Reject buttons, web app endpoint that processes clicks

## Setup Steps

### 1. Create the Google Form

Create a Google Form with these fields:
1. **Resource Type** (dropdown): Event, Recommendation, Provider, Wellness Resource
2. **Title** (short text, required)
3. **Description** (paragraph text)
4. **Link** (short text, URL validation)
5. **File Upload** (allow PDFs, images — requires Google sign-in)
6. **Start Date/Time** (date-time) — show via section/page logic when Type = Event
7. **End Date/Time** (date-time) — show via section/page logic when Type = Event
8. **Calendar Category** (dropdown): Physical, Mental, Nutrition, Social, Professional — show when Type = Event
9. Enable "Collect email addresses" in Form settings
10. Optionally add a "Your Name" field

Link the form responses to a Google Sheet.

### 2. Set Up the Google Sheet

1. Open the linked response sheet
2. Rename the responses tab to **Submissions** (or match `CONFIG.SHEET_NAME` in Code.gs)
3. Add these columns after the last form-response column:
   - **Status** (column L) — add Data Validation dropdown: Pending, Approved, Rejected
   - **Approved By** (column M)
   - **Approval Timestamp** (column N)
   - **Drive File Links** (column O)
4. Verify column indices match `CONFIG.COLUMNS` in Code.gs (adjust if your form has different ordering)

### 3. Add the Apps Script

1. In the Google Sheet, go to **Extensions → Apps Script**
2. Delete the default `Code.gs` content
3. Paste the contents of `Code.gs` from this folder
4. Create a new file (`+` button → Script) named `approval` and paste `approval.gs`
5. Update the `CONFIG` object in Code.gs:
   - Set your admin email addresses
   - Set your Google Calendar IDs (one per category)
   - Set your GitHub repo name

### 4. Deploy as Web App

1. In Apps Script editor, click **Deploy → New deployment**
2. Select type: **Web app**
3. Settings:
   - Description: "EHS LiveWell Approval"
   - Execute as: **Me**
   - Who has access: **Anyone** (needed so email links work without sign-in)
4. Click **Deploy** and authorize when prompted
5. **Copy the Web app URL**
6. Paste it into `WEB_APP_URL` in approval.gs
7. Change `APPROVAL_SECRET` to a random string of your choosing
8. Re-deploy (Deploy → Manage deployments → Edit → New version)

### 5. Set Up Triggers

In Apps Script editor, go to **Triggers** (clock icon on left sidebar):

1. **On form submit** trigger:
   - Function: `onFormSubmit`
   - Event source: From spreadsheet
   - Event type: On form submit

2. **On edit** trigger (backup for manual sheet edits):
   - Function: `onSheetEdit`
   - Event source: From spreadsheet
   - Event type: On edit

### 6. Store Secrets

Go to **Project Settings → Script Properties** and add:
- `GITHUB_TOKEN` — your GitHub Personal Access Token (with `repo` scope)
- Optionally: `AI_API_KEY` if you want to enable auto-categorization

### 7. Create Google Calendars

Create 5 Google Calendars (one per category):
- Physical Wellness
- Mental Wellness
- Nutrition
- Social Wellness
- Professional Development

For each, go to **Calendar Settings → Integrate calendar** and copy the Calendar ID. Paste into `CONFIG.CALENDAR_IDS`.

## How the Approval Flow Works

```
Form Submission
       ↓
onFormSubmit() → Sets status to "Pending"
       ↓
sendApprovalEmail() → Sends email with Approve/Reject buttons
       ↓
Admin clicks button in email
       ↓
doGet() web app endpoint processes the action
       ↓
If Approved:
  → Updates sheet status
  → Creates Google Calendar event (if Event type)
  → Triggers GitHub Actions rebuild
If Rejected:
  → Updates sheet status
  → No further action
```

## Redeploying After Changes

When you update the code:
1. In Apps Script editor, click **Deploy → Manage deployments**
2. Click the pencil icon on your deployment
3. Set version to **New version**
4. Click **Deploy**

The web app URL stays the same — no need to update email links.
