// ============================================================
// CONFIGURATION — change these values only
// ============================================================
var PASSWORD = "MySecret123";       // <-- your password here
var PROTECTED_SHEET = "marbella trip"; // exact name of the sheet to lock
var LOCK_SHEET_NAME = "🔒 LOCKED";    // name of the placeholder shown when locked
// ============================================================

/**
 * Runs automatically when the spreadsheet is opened.
 * Hides all real content and shows the lock screen dialog.
 */
function onOpen() {
  lockSpreadsheet();
  showPasswordDialog();
}

/**
 * Hides the protected sheet and inserts a lock placeholder in its position.
 * All other sheets are left untouched.
 */
function lockSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Try exact match first, then case-insensitive fallback
  var targetSheet = ss.getSheetByName(PROTECTED_SHEET);
  if (!targetSheet) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName().toLowerCase().trim() === PROTECTED_SHEET.toLowerCase().trim()) {
        targetSheet = sheets[i];
        break;
      }
    }
  }
  if (!targetSheet) return;

  // Remember the tab position so the placeholder sits in the same spot
  var sheetIndex = targetSheet.getIndex();

  // Hide the real sheet
  targetSheet.hideSheet();

  // Create the lock placeholder at the same position (if not already there)
  var lockSheet = ss.getSheetByName(LOCK_SHEET_NAME);
  if (!lockSheet) {
    lockSheet = ss.insertSheet(LOCK_SHEET_NAME, sheetIndex - 1);
    lockSheet.getRange("A1").setValue("🔒 \"" + PROTECTED_SHEET + "\" is password protected.");
    lockSheet.getRange("A2").setValue("Please enter the password in the dialog box to continue.");
    lockSheet.getRange("A1:A2").setFontSize(14).setFontWeight("bold");
    lockSheet.setTabColor("#ff0000");
  }

  // Only redirect the user if they were on the protected sheet
  if (ss.getActiveSheet().getName() === PROTECTED_SHEET ||
      ss.getActiveSheet().getName() === LOCK_SHEET_NAME) {
    ss.setActiveSheet(lockSheet);
  }
}

/**
 * Shows the password prompt as a modal dialog.
 */
function showPasswordDialog() {
  var html = HtmlService.createHtmlOutput(getDialogHtml())
    .setWidth(360)
    .setHeight(240);

  SpreadsheetApp.getUi().showModalDialog(html, "🔒 Password Required");
}

/**
 * Called from the dialog when the user submits a password.
 * Returns true on success so the client can close the dialog.
 */
function checkPassword(attempt) {
  if (attempt === PASSWORD) {
    unlockSpreadsheet();
    return true;
  }
  return false;
}

/**
 * Unhides the protected sheet, removes the lock placeholder,
 * and navigates the user to the protected sheet.
 */
function unlockSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Unhide the real sheet
  var targetSheet = ss.getSheetByName(PROTECTED_SHEET);
  if (targetSheet) {
    targetSheet.showSheet();
    ss.setActiveSheet(targetSheet);
  }

  // Delete the lock placeholder
  var lockSheet = ss.getSheetByName(LOCK_SHEET_NAME);
  if (lockSheet) {
    ss.deleteSheet(lockSheet);
  }
}

/**
 * Returns the HTML string for the password dialog.
 * The dialog re-shows itself on wrong password and cannot be closed.
 */
function getDialogHtml() {
  var html = '<!DOCTYPE html>' +
    '<html><head><base target="_top"><style>' +
    '* { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }' +
    'body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #f8f9fa; padding: 24px; }' +
    'h2 { font-size: 18px; margin-bottom: 8px; color: #202124; text-align: center; }' +
    'p { font-size: 13px; color: #5f6368; margin-bottom: 20px; text-align: center; }' +
    'input { width: 100%; padding: 10px 12px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; outline: none; }' +
    'input:focus { border-color: #1a73e8; }' +
    'button { margin-top: 12px; width: 100%; padding: 10px; background: #1a73e8; color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }' +
    'button:hover { background: #1557b0; }' +
    '.error { color: #d93025; font-size: 13px; margin-top: 10px; display: none; text-align: center; }' +
    '.shake { animation: shake 0.4s; }' +
    '@keyframes shake {' +
    '  0%,100% { transform: translateX(0); }' +
    '  20% { transform: translateX(-8px); }' +
    '  40% { transform: translateX(8px); }' +
    '  60% { transform: translateX(-6px); }' +
    '  80% { transform: translateX(6px); }' +
    '}' +
    '</style></head><body>' +
    '<div id="card" style="width:100%">' +
    '<h2>🔒 Protected Sheet</h2>' +
    '<p>Enter the password to access the Marbella Trip sheet.</p>' +
    '<input type="password" id="pwd" placeholder="Password" autofocus onkeydown="if(event.key===\'Enter\') submit()">' +
    '<button onclick="submit()">Unlock</button>' +
    '<div class="error" id="err">Incorrect password. Please try again.</div>' +
    '</div>' +
    '<script>' +
    'function submit() {' +
    '  var pwd = document.getElementById("pwd").value;' +
    '  document.getElementById("err").style.display = "none";' +
    '  google.script.run' +
    '    .withSuccessHandler(function(ok) {' +
    '      if (ok) {' +
    '        google.script.host.close();' +
    '      } else {' +
    '        var card = document.getElementById("card");' +
    '        var input = document.getElementById("pwd");' +
    '        card.classList.remove("shake");' +
    '        void card.offsetWidth;' +
    '        card.classList.add("shake");' +
    '        input.value = "";' +
    '        input.focus();' +
    '        document.getElementById("err").style.display = "block";' +
    '      }' +
    '    })' +
    '    .withFailureHandler(function(err) {' +
    '      document.getElementById("err").textContent = "Error: " + err.message;' +
    '      document.getElementById("err").style.display = "block";' +
    '    })' +
    '    .checkPassword(pwd);' +
    '}' +
    '</s' + 'cript></body></html>';
  return html;
}
