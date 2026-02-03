let sheetName = 'ชีต1';
let sheetId = '1bAMyXysG7-X9Iu5OwWF_ByxGdIqnr2K5KD7JlbOMbR8';

// Column Mappings
let timeColNum = 1;
let registerloginColNum = 2; // Role
let emailColNum = 3;
let passwordColNum = 4;
let statusColNum = 5; // Status
let nameColNum = 6;
let surNColNum = 7;
let hospitalStColNum = 8; // Hospital Type
let hospitalNColNum = 9; // Hospital Name
let adminStatusColNum = 10; // Admin Approval Status (Column J)

function doGet(e) {
  // Get page parameter
  const page = e.parameter.page || 'index';
  const token = e.parameter.token || '';
  
  // Dashboard page
  if (page === 'dashboard') {
    var template = HtmlService.createTemplateFromFile('dashboard');
    
    // Fetch images from Drive
    var logoImage = getDataUrl('16WWPuNem2pxdqOQoU6n2p57GlWYHo2NH');
    
    template.logoImage = logoImage || null;
    template.sessionToken = token;
    
    return template.evaluate()
        .setTitle('Dashboard - BloodLink')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Default login page
  var template = HtmlService.createTemplateFromFile('index');
  
  // Fetch images from Drive
  var nurseImage = getDataUrl('1sTNAeqcTsKIKp4IYK20oyNqjUYsKmnMQ');
  var logoImage = getDataUrl('16WWPuNem2pxdqOQoU6n2p57GlWYHo2NH');
  
  template.nurseImage = nurseImage;
  template.logoImage = logoImage;

  return template.evaluate()
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function getSheet() {
  return SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
}

function handleUserAction(data) {
  try {
    var sheet = getSheet();
    if (!sheet) {
      return { success: false, message: "Sheet '" + sheetName + "' not found." };
    }

    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    if (lock.hasLock()) {
      // Login Verification
      if (data.action === 'login') {
        var user = findUserByEmail(data.email);
        if (!user) {
          lock.releaseLock();
          return { success: false, message: "ไม่พบผู้ใช้งานนี้ในระบบ" };
        }
        if (user.password !== data.password) {
          lock.releaseLock();
          return { success: false, message: "รหัสผ่านไม่ถูกต้อง" };
        }
        
        // Check Admin Approval Status
        if (user.adminStatus !== 'ผ่าน') {
          lock.releaseLock();
          return { success: false, message: "รอการตรวจสอบจากผู้ดูแลระบบ หรือการลงทะเบียนไม่ผ่าน" };
        }
        
        // Login successful, proceed to log it
      } else {
        // Register: Check for existing email
        if (findUserByEmail(data.email)) {
           lock.releaseLock();
           return { success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" };
        }
      }

      var rowData = [];
      for(var i = 0; i < 10; i++) { rowData.push(""); } // Increased to 10 columns
      
      rowData[timeColNum - 1] = new Date();
      
      var actionType = 'สมัครสมาชิก'; 
      if (data.action === 'login') {
        actionType = 'เข้าสู่ระบบ';
      }
      rowData[registerloginColNum - 1] = actionType; 
      
      rowData[emailColNum - 1] = data.email;
      rowData[passwordColNum - 1] = data.password;
      
      if (data.action !== 'login') {
        rowData[statusColNum - 1] = data.role; 
        rowData[nameColNum - 1] = data.name;
        rowData[surNColNum - 1] = data.surname;
        rowData[hospitalStColNum - 1] = data.hospital;
        rowData[hospitalNColNum - 1] = data.hospitalName;
        rowData[adminStatusColNum - 1] = 'รอตรวจสอบ'; // Default status for new registration
      }

      sheet.appendRow(rowData);
      
      lock.releaseLock();
      
      // For login, return user info and session token
      if (data.action === 'login') {
        var sessionToken = generateSessionToken(data.email);
        var user = findUserByEmail(data.email);
        return { 
          success: true, 
          message: actionType + " successful",
          token: sessionToken,
          user: {
            email: user.email,
            name: user.name,
            role: user.role
          }
        };
      }
      
      return { success: true, message: actionType + " successful" };
    } else {
      return { success: false, message: "Server is busy, please try again later." };
    }
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function findUserByEmail(email) {
  var sheet = getSheet();
  if (!sheet) return null;
  
  var lastRow = sheet.getLastRow();
  if (lastRow < 1) return null;
  
  // Normalize the search email
  var searchEmail = String(email).trim().toLowerCase();
  
  // Get all data (extended to 10 columns to include Admin Status)
  var data = sheet.getRange(1, 1, lastRow, 10).getValues();
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var action = String(row[registerloginColNum - 1]).trim();
    var rowEmail = String(row[emailColNum - 1]).trim().toLowerCase();
    
    // Check for Registration rows - case insensitive email match
    if ((action === 'Register' || action === 'สมัครสมาชิก') && rowEmail === searchEmail) {
      return {
        email: row[emailColNum - 1], // Return original email
        password: String(row[passwordColNum - 1]), // Convert to string
        role: row[statusColNum - 1],
        name: row[nameColNum - 1],
        surname: row[surNColNum - 1],
        adminStatus: row[adminStatusColNum - 1] // Return Admin Status
      };
    }
  }
  return null;
}

// Helper functions provided by user (preserved for future use)
function getDataUrl(id) {
  try {
    var tmp = DriveApp.getFileById(id);
    if (tmp) {
      var bytes = Utilities.base64Encode(tmp.getBlob().getBytes());
      var type = tmp.getMimeType();
      return {
        bytes: bytes,
        type: type
      };
    }
  } catch (e) {
    return null;
  }
}

function uploadFileToDrive(fileName, data) {
  // Placeholder ID, user needs to replace if they use this feature
  var folderId = "YOUR_FOLDER_ID"; 
  try {
    var folder = DriveApp.getFolderById(folderId); 
    var blob = Utilities.newBlob(data, "", fileName);
    var file = folder.createFile(blob);
    return "อัปโหลดไฟล์สำเร็จ: " + file.getName();
  } catch(e) {
    return "Error uploading: " + e.toString();
  }
}

function listFiles() {
  var folderId = "YOUR_FOLDER_ID";
  try {
    var folder = DriveApp.getFolderById(folderId); 
    var files = folder.getFiles();
    var result = [];
    while (files.hasNext()) {
      var file = files.next();
      result.push({
        name: file.getName(),
        url: file.getUrl(),
        date: file.getDateCreated()
      });
    }
    return result;
  } catch(e) {
    return [];
  }
}

// Session Token Generation (Simple Implementation)
function generateSessionToken(email) {
  var timestamp = new Date().getTime();
  var random = Math.random().toString(36).substring(2);
  var emailHash = Utilities.base64Encode(email);
  return emailHash + '_' + timestamp + '_' + random;
}
