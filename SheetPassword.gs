// ============================================================
// CONFIGURATION — change these two values only
// ============================================================
var PASSWORD = "MySecret123";   // <-- your password here
var LOCK_SHEET_NAME = "🔒 LOCKED"; // name of the placeholder sheet shown when locked
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
 * Hides all sheets except the lock placeholder.
 * Creates the placeholder if it doesn't exist.
 */
function lockSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // Create the lock sheet if it doesn't exist
  var lockSheet = ss.getSheetByName(LOCK_SHEET_NAME);
  if (!lockSheet) {
    lockSheet = ss.insertSheet(LOCK_SHEET_NAME, 0);
    lockSheet.getRange("A1").setValue("🔒 This spreadsheet is password protected.");
    lockSheet.getRange("A2").setValue("Please enter the password in the dialog box to continue.");
    lockSheet.getRange("A1:A2").setFontSize(14).setFontWeight("bold");
    lockSheet.setTabColor("#ff0000");
  }

  // Show the lock sheet first so users land on it
  ss.setActiveSheet(lockSheet);

  // Hide every other sheet
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== LOCK_SHEET_NAME) {
      sheets[i].hideSheet();
    }
  }
}

/**
 * Shows the HTML password dialog. The dialog is modal — users
 * cannot click behind it or dismiss it with Escape.
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
 * Makes all hidden sheets visible again and removes the lock sheet.
 */
function unlockSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // Unhide every real sheet
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== LOCK_SHEET_NAME) {
      sheets[i].showSheet();
    }
  }

  // Activate the first real sheet
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== LOCK_SHEET_NAME) {
      ss.setActiveSheet(sheets[i]);
      break;
    }
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
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, sans-serif; }
    body { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa; }
    .card { background: white; border-radius: 8px; padding: 32px; width: 100%; max-width: 320px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); text-align: center; }
    h2 { font-size: 20px; margin-bottom: 8px; color: #202124; }
    p  { font-size: 13px; color: #5f6368; margin-bottom: 20px; }
    input { width: 100%; padding: 10px 12px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; outline: none; }
    input:focus { border-color: #1a73e8; }
    button { margin-top: 16px; width: 100%; padding: 10px; background: #1a73e8; color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; }
    button:hover { background: #1557b0; }
    .error { color: #d93025; font-size: 13px; margin-top: 10px; display: none; }
    .shake { animation: shake 0.4s; }
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-6px); }
      80%      { transform: translateX(6px); }
    }
  </style>
</head>
<body>
  <div class="card" id="card">
    <h2>🔒 Protected Sheet</h2>
    <p>Enter the password to access this spreadsheet.</p>
    <input type="password" id="pwd" placeholder="Password" autofocus
           onkeydown="if(event.key==='Enter') submit()">
    <button onclick="submit()">Unlock</button>
    <div class="error" id="err">Incorrect password. Please try again.</div>
  </div>

  <script>
    function submit() {
      var pwd = document.getElementById('pwd').value;
      document.getElementById('err').style.display = 'none';

      google.script.run
        .withSuccessHandler(function(ok) {
          if (ok) {
            // Close the dialog on success
            google.script.host.close();
          } else {
            // Wrong password — shake the card, clear input, show error
            var card = document.getElementById('card');
            var input = document.getElementById('pwd');
            card.classList.remove('shake');
            void card.offsetWidth; // force reflow to restart animation
            card.classList.add('shake');
            input.value = '';
            input.focus();
            document.getElementById('err').style.display = 'block';
          }
        })
        .withFailureHandler(function(err) {
          document.getElementById('err').textContent = 'Error: ' + err.message;
          document.getElementById('err').style.display = 'block';
        })
        .checkPassword(pwd);
    }

    // Block the Escape key so the dialog cannot be dismissed
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') e.preventDefault();
    });
  </script>
</body>
</html>`;
}
