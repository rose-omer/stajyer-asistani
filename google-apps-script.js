// Google Apps Script - Web App için
// Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone

function doPost(e) {
  try {
    // Parse JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Email parametreleri
    const to = data.to;
    const subject = data.subject;
    const body = data.body;
    const fromName = data.fromName || "Stajyer";
    
    // E-posta gönderme seçenekleri
    const options = {
      name: fromName
    };
    
    // Eğer attachment varsa ekle
    if (data.attachment && data.attachment.data) {
      const fileName = data.attachment.name || "CV.pdf";
      const mimeType = data.attachment.mimeType || "application/pdf";
      const base64Data = data.attachment.data;
      
      // Base64'ü decode et ve blob oluştur
      const decodedData = Utilities.base64Decode(base64Data);
      const blob = Utilities.newBlob(decodedData, mimeType, fileName);
      
      options.attachments = [blob];
      
      Logger.log("Ek dosya eklendi: " + fileName);
    }
    
    // E-postayı gönder
    GmailApp.sendEmail(to, subject, body, options);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Email sent successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log("Error: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput("Email Service is running. Use POST method to send emails.")
    .setMimeType(ContentService.MimeType.TEXT);
}
