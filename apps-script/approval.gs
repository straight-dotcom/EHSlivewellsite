/* ============================================
   EHS LiveWell — approval.gs
   Email-based approval workflow with
   Approve / Reject buttons in the notification
   ============================================

   HOW IT WORKS:
   1. Form submission triggers onFormSubmit() in Code.gs
   2. sendApprovalEmail() sends admins an email with two buttons
   3. Each button is a link to this script's deployed web app
      with query params: ?action=approve&row=N or ?action=reject&row=N
      plus a token for basic security
   4. doGet() handles the click, updates the sheet, and shows a
      confirmation page

   SETUP:
   - Deploy this project as a Web App:
     Publish → Deploy as web app
     Execute as: Me
     Who has access: Anyone (even anonymous) — so the email links work
   - Copy the deployed URL into WEB_APP_URL below
   ============================================ */

// =============================================
// WEB APP URL — Set after deploying as web app
// =============================================
const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

// Simple shared secret to validate email links (not full auth, but prevents random clicks)
// Change this to a random string of your choosing
const APPROVAL_SECRET = 'CHANGE_THIS_TO_A_RANDOM_SECRET_STRING';

// =============================================
// SEND APPROVAL EMAIL WITH BUTTONS
// =============================================

function sendApprovalEmail(row, sheet) {
  const type        = sheet.getRange(row, CONFIG.COLUMNS.TYPE).getValue();
  const title       = sheet.getRange(row, CONFIG.COLUMNS.TITLE).getValue();
  const description = sheet.getRange(row, CONFIG.COLUMNS.DESCRIPTION).getValue();
  const link        = sheet.getRange(row, CONFIG.COLUMNS.LINK).getValue();
  const submitter   = sheet.getRange(row, CONFIG.COLUMNS.SUBMITTER).getValue();
  const email       = sheet.getRange(row, CONFIG.COLUMNS.EMAIL).getValue();
  const category    = sheet.getRange(row, CONFIG.COLUMNS.CATEGORY).getValue();
  const startDate   = sheet.getRange(row, CONFIG.COLUMNS.START_DATE).getValue();
  const endDate     = sheet.getRange(row, CONFIG.COLUMNS.END_DATE).getValue();

  // Build secure approval / reject URLs
  const token = generateToken(row);
  const approveUrl = `${WEB_APP_URL}?action=approve&row=${row}&token=${token}`;
  const rejectUrl  = `${WEB_APP_URL}?action=reject&row=${row}&token=${token}`;

  // Build details section
  let detailsHtml = '';
  if (type === 'Event' && startDate) {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    detailsHtml += `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;"><strong>Date/Time:</strong></td>
      <td style="padding:8px 12px;font-size:14px;">${start.toLocaleString()}${end ? ' – ' + end.toLocaleTimeString() : ''}</td></tr>`;
  }
  if (category) {
    detailsHtml += `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;"><strong>Category:</strong></td>
      <td style="padding:8px 12px;font-size:14px;">${category}</td></tr>`;
  }
  if (link) {
    detailsHtml += `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;"><strong>Link:</strong></td>
      <td style="padding:8px 12px;font-size:14px;"><a href="${link}" style="color:#2a9d8f;">${link}</a></td></tr>`;
  }

  const htmlBody = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#264653 0%,#1a5c52 100%);padding:24px 32px;border-radius:12px 12px 0 0;">
      <h1 style="color:#ffffff;margin:0;font-size:20px;">EHS LiveWell</h1>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">New Submission Awaiting Approval</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border:1px solid #e2e8f0;border-top:none;">
      <!-- Type badge -->
      <span style="display:inline-block;padding:4px 12px;background:#e8f5f3;color:#2a9d8f;border-radius:50px;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:16px;">${type}</span>

      <h2 style="color:#264653;margin:0 0 8px;font-size:18px;">${title}</h2>
      <p style="color:#4a5568;margin:0 0 20px;font-size:14px;line-height:1.6;">${description || 'No description provided.'}</p>

      <!-- Details table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f8fafb;border-radius:8px;">
        <tr><td style="padding:8px 12px;color:#64748b;font-size:14px;"><strong>Submitted by:</strong></td>
          <td style="padding:8px 12px;font-size:14px;">${submitter || 'Unknown'} ${email ? '(' + email + ')' : ''}</td></tr>
        <tr><td style="padding:8px 12px;color:#64748b;font-size:14px;"><strong>Type:</strong></td>
          <td style="padding:8px 12px;font-size:14px;">${type}</td></tr>
        ${detailsHtml}
      </table>

      <!-- Approve / Reject Buttons -->
      <div style="text-align:center;margin:32px 0 16px;">
        <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#2a9d8f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-right:12px;">
          &#10003; Approve
        </a>
        <a href="${rejectUrl}" style="display:inline-block;padding:12px 32px;background:#e76f51;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          &#10007; Reject
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
        You can also update the status directly in the
        <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" style="color:#2a9d8f;">Google Sheet</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;padding:16px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
      <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
        EHS LiveWell Wellness Platform &middot; Automated notification
      </p>
    </div>
  </div>`;

  const subject = `[EHS LiveWell] New ${type}: "${title}" — Approval Needed`;

  CONFIG.ADMIN_EMAILS.forEach(adminEmail => {
    try {
      GmailApp.sendEmail(adminEmail, subject, `New ${type} submission: "${title}" by ${submitter}. Approve or reject in the Google Sheet.`, {
        htmlBody: htmlBody,
        name: 'EHS LiveWell',
      });
    } catch (err) {
      Logger.log('Error sending email to ' + adminEmail + ': ' + err.message);
    }
  });
}

// =============================================
// WEB APP ENDPOINT — Handles Approve/Reject clicks
// =============================================

/**
 * doGet() is called when an admin clicks the Approve or Reject
 * button in the email. It processes the action and returns a
 * confirmation HTML page.
 */
function doGet(e) {
  const action = e.parameter.action;
  const row = parseInt(e.parameter.row, 10);
  const token = e.parameter.token;

  // Validate
  if (!action || !row || !token) {
    return buildHtmlResponse('Error', 'Invalid request. Missing parameters.', false);
  }

  if (!validateToken(row, token)) {
    return buildHtmlResponse('Error', 'Invalid or expired approval link.', false);
  }

  if (action !== 'approve' && action !== 'reject') {
    return buildHtmlResponse('Error', 'Invalid action. Must be "approve" or "reject".', false);
  }

  // Get the sheet and check current status
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const currentStatus = sheet.getRange(row, CONFIG.COLUMNS.STATUS).getValue();
  const title = sheet.getRange(row, CONFIG.COLUMNS.TITLE).getValue();

  if (currentStatus !== 'Pending') {
    return buildHtmlResponse(
      'Already Processed',
      `"${title}" has already been ${currentStatus.toLowerCase()}. No further action needed.`,
      currentStatus === 'Approved'
    );
  }

  // Process the action
  if (action === 'approve') {
    sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue('Approved');
    processApproval(row, sheet, 'Email Approval');
    return buildHtmlResponse(
      'Approved',
      `"${title}" has been approved and published. If this is an event, it has been added to the Google Calendar.`,
      true
    );
  } else {
    sheet.getRange(row, CONFIG.COLUMNS.STATUS).setValue('Rejected');
    sheet.getRange(row, CONFIG.COLUMNS.APPROVED_BY).setValue('Email Rejection');
    sheet.getRange(row, CONFIG.COLUMNS.APPROVED_AT).setValue(new Date());
    return buildHtmlResponse(
      'Rejected',
      `"${title}" has been rejected and will not be published.`,
      false
    );
  }
}

// =============================================
// TOKEN GENERATION & VALIDATION
// =============================================

/**
 * Generates a simple HMAC-like token for a given row.
 * This prevents unauthorized people from approving/rejecting
 * submissions by guessing URLs.
 */
function generateToken(row) {
  const data = `${APPROVAL_SECRET}-row-${row}-${CONFIG.SHEET_NAME}`;
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data);
  return Utilities.base64EncodeWebSafe(hash).substring(0, 32);
}

function validateToken(row, token) {
  return token === generateToken(row);
}

// =============================================
// HTML RESPONSE PAGE
// =============================================

function buildHtmlResponse(title, message, isSuccess) {
  const color = isSuccess ? '#2a9d8f' : '#e76f51';
  const icon = isSuccess ? '&#10003;' : '&#10007;';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — EHS LiveWell</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: ${color}; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 28px; margin: 0 auto 20px;
    }
    h1 { color: #264653; font-size: 22px; margin-bottom: 12px; }
    p { color: #64748b; font-size: 15px; line-height: 1.6; }
    .link { display: inline-block; margin-top: 24px; color: #2a9d8f; font-weight: 600; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="link" href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">Open Google Sheet &rarr;</a>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle(title + ' — EHS LiveWell')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =============================================
// MANUAL TEST FUNCTIONS
// =============================================

/**
 * Test: send a sample approval email for a specific row.
 * Change the row number and run manually.
 */
function testSendApprovalEmail() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  sendApprovalEmail(2, sheet); // Test with row 2 (first data row)
}

/**
 * Test: generate a token for a row to verify the URL works.
 */
function testGenerateToken() {
  Logger.log('Token for row 2: ' + generateToken(2));
  Logger.log('Approve URL: ' + WEB_APP_URL + '?action=approve&row=2&token=' + generateToken(2));
}
