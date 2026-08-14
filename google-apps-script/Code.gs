/**
 * Beauty Expert Summit 2026 — registration form backend.
 *
 * Deploy this as a Web App (Extensions > Apps Script, inside a Google Sheet).
 * See README.md in the project root for step-by-step setup instructions.
 */

var SHEET_NAME = "Responses";
var UPLOAD_FOLDER_NAME = "Beauty Expert Summit 2026 — Uploads";

// Order controls both the sheet's column order and how values are read from the payload.
var COLUMNS = [
  "submitted_at",
  "full_name",
  "date_of_birth",
  "country",
  "city",
  "phone_whatsapp",
  "email",
  "title_degree",
  "title_degree_other",
  "specialization",
  "specialization_other",
  "subspecialization",
  "current_position",
  "website_social",
  "years_experience",
  "procedures_count",
  "medical_diploma",
  "residency",
  "academic_degree",
  "certifications",
  "participation_status",
  "attendance_day",
  "presentation_title",
  "presentation_duration",
  "presentation_format",
  "presentation_abstract",
  "av_required",
  "av_requirements",
  "visa_invitation_required",
  "passport_full_name",
  "passport_number",
  "nationality",
  "passport_expiry",
  "embassy_consulate",
  "transfer_arrival",
  "arrival_airport",
  "arrival_date",
  "arrival_time",
  "flight_number",
  "departure_date",
  "departure_time",
  "transfer_departure",
  "hotel_assistance",
  "checkin_date",
  "checkout_date",
  "accompanying_persons",
  "room_preference",
  "dietary",
  "dietary_other",
  "allergies_requirements",
  "accessibility_requirements",
  "short_biography",
  "instagram",
  "linkedin",
  "other_social_media",
  "promo_consent",
  "additional_information",
  "confirm_info_correct",
  "agree_receive_info",
  "understand_photo_video",
  "confirmation_date",
  "signature",
  "diploma_file_link",
  "abstract_file_link",
  "photo_file_link",
  "logo_file_link",
  "certificate_file_link",
];

// Human-readable column headers shown in the sheet, in the same order as COLUMNS.
var HEADER_LABELS = [
  "Дата и время отправки",
  "ФИО",
  "Дата рождения",
  "Страна",
  "Город",
  "Телефон / WhatsApp",
  "E-mail",
  "Учёная степень / звание",
  "Учёная степень — другое",
  "Специализация",
  "Специализация — другое",
  "Узкая специализация / область экспертизы",
  "Текущая должность / клиника / институт",
  "Сайт / Instagram / LinkedIn",
  "Стаж работы (лет)",
  "Кол-во выполненных процедур / операций",
  "Мед. / университетский диплом",
  "Специализация / резидентура",
  "Учёная степень",
  "Доп. сертификаты / стажировки",
  "Статус участия",
  "День участия",
  "Тема доклада",
  "Длительность доклада (мин)",
  "Формат выступления",
  "Тезисы доклада",
  "Нужно ли AV/техническое оборудование",
  "Какое оборудование нужно",
  "Нужно ли визовое приглашение",
  "ФИО как в загранпаспорте",
  "Номер паспорта",
  "Гражданство",
  "Срок действия паспорта",
  "Посольство / консульство",
  "Трансфер при прилёте нужен?",
  "Аэропорт прилёта",
  "Дата прилёта",
  "Время прилёта",
  "Номер рейса",
  "Дата вылета",
  "Время вылета",
  "Трансфер при вылете нужен?",
  "Нужна помощь с отелем?",
  "Дата заезда",
  "Дата выезда",
  "Кол-во сопровождающих",
  "Тип номера",
  "Диетические предпочтения",
  "Диета — другое",
  "Аллергии / особые требования",
  "Требования по доступности",
  "Краткая биография для программы",
  "Instagram",
  "LinkedIn",
  "Другие соцсети",
  "Согласие на использование фото/био в промо",
  "Дополнительная информация",
  "Подтверждение достоверности данных",
  "Согласие получать информацию о саммите",
  "Согласие на фото/видеосъёмку",
  "Дата подтверждения",
  "Подпись (ФИО)",
  "Файл: диплом/сертификат (ссылка)",
  "Файл: тезисы доклада (ссылка)",
  "Файл: фото (ссылка)",
  "Файл: логотип клиники (ссылка)",
  "Файл: сертификат (ссылка)",
];

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();
    var files = payload.files || {};
    var fileLinks = saveFiles(files, payload.full_name || "unknown");

    var row = COLUMNS.map(function (key) {
      if (key.indexOf("_file_link") !== -1) {
        var fileKey = key.replace("_link", "");
        return fileLinks[fileKey] || "";
      }
      var value = payload[key];
      if (Array.isArray(value)) return value.join("; ");
      if (typeof value === "boolean") return value ? "Yes" : "No";
      if (value === undefined || value === null) return "";
      return value;
    });

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_LABELS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Run this once if the header row already exists with the old technical
// column names (submitted_at, full_name, ...) and you want to switch it to
// the human-readable Russian labels instead. Safe to re-run at any time —
// it only touches row 1, never the data rows below it.
function renameHeaders() {
  var sheet = getOrCreateSheet();
  sheet.getRange(1, 1, 1, HEADER_LABELS.length).setValues([HEADER_LABELS]);
}

function saveFiles(files, applicantName) {
  var links = {};
  var keys = Object.keys(files);
  if (keys.length === 0) return links;

  var folder = getOrCreateFolder();
  keys.forEach(function (fieldName) {
    var file = files[fieldName];
    if (!file || !file.data) return;
    try {
      var bytes = Utilities.base64Decode(file.data);
      var blob = Utilities.newBlob(bytes, file.mimeType, applicantName + " — " + file.name);
      var driveFile = folder.createFile(blob);
      driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links[fieldName] = driveFile.getUrl();
    } catch (err) {
      links[fieldName] = "Upload failed: " + String(err);
    }
  });
  return links;
}

function getOrCreateFolder() {
  var folders = DriveApp.getFoldersByName(UPLOAD_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(UPLOAD_FOLDER_NAME);
}

// Optional: open this function from the Apps Script editor and run it once
// to confirm the sheet + folder are created before your first real submission.
function setup() {
  getOrCreateSheet();
  getOrCreateFolder();
}
