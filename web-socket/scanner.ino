#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <time.h>

#define SCREEN_W           128
#define SCREEN_H            64
#define SCANNER_RX          16
#define SCANNER_TX          14
#define QR_TIMEOUT       10000
#define HEARTBEAT_INTERVAL 1000
#define RESET_PIN            0
#define RESET_HOLD_TIME   5000

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
HardwareSerial scannerSerial(2);
Preferences prefs;

// ── Device config ─────────────────────────────────────────────────
struct Config {
  String pairing_token;
  String wifi_ssid;
  String wifi_password;
  String server_url;
  String register_url;
  String device_name;
  int    scan_cooldown;
  bool   paired;
};
Config cfg;

String        buffer        = "";
unsigned long lastScanTime  = 0;
unsigned long lastHeartbeat = 0;
unsigned long lastClockDraw = 0;
bool          waitingShown  = false;

// Button handling variables
unsigned long buttonPressStart = 0;
bool buttonPressed = false;
bool resetInProgress = false;

// ── Flash storage ─────────────────────────────────────────────────

void saveConfig() {
  prefs.begin("cfg", false);
  prefs.putString("token",    cfg.pairing_token);
  prefs.putString("ssid",     cfg.wifi_ssid);
  prefs.putString("pass",     cfg.wifi_password);
  prefs.putString("srv",      cfg.server_url);
  prefs.putString("reg",      cfg.register_url);
  prefs.putString("name",     cfg.device_name);
  prefs.putInt   ("cooldown", cfg.scan_cooldown);
  prefs.putBool  ("paired",   cfg.paired);
  prefs.end();
}

bool loadConfig() {
  prefs.begin("cfg", true);
  cfg.pairing_token = prefs.getString("token",    "");
  cfg.wifi_ssid     = prefs.getString("ssid",     "");
  cfg.wifi_password = prefs.getString("pass",     "");
  cfg.server_url    = prefs.getString("srv",      "");
  cfg.register_url  = prefs.getString("reg",      "");
  cfg.device_name   = prefs.getString("name",     "");
  cfg.scan_cooldown = prefs.getInt   ("cooldown", 3000);
  cfg.paired        = prefs.getBool  ("paired",   false);
  prefs.end();
  return cfg.pairing_token.length() > 0;
}

void clearConfig() {
  prefs.begin("cfg", false);
  prefs.clear();
  prefs.end();
  cfg = Config();
}

// ── OLED Helpers ──────────────────────────────────────────────────

void oledHeader(const char* title) {
  display.fillRect(0, 0, SCREEN_W, 14, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(2, 3);
  display.print(title);
  display.setTextColor(SSD1306_WHITE);
}

// ── Clock display (replaces showWaiting) ──────────────────────────

void showClock() {
  display.clearDisplay();
  oledHeader("QR READER");

  struct tm timeInfo;
  if (getLocalTime(&timeInfo)) {
    // Large HH:MM
    char timeBuf[6];
    strftime(timeBuf, sizeof(timeBuf), "%I:%M", &timeInfo);

    display.setTextSize(3);
    display.setTextColor(SSD1306_WHITE);
    // Each char ~18px wide at size 3; 5 chars = ~90px
    display.setCursor((SCREEN_W - 90) / 2, 16);
    display.print(timeBuf);

    // Seconds + AM/PM — small, centred below time
    char secBuf[10];
    strftime(secBuf, sizeof(secBuf), ":%S %p", &timeInfo);
    display.setTextSize(1);
    int sw = strlen(secBuf) * 6;
    display.setCursor((SCREEN_W - sw) / 2, 43);
    display.print(secBuf);

    // Date at bottom
    char dateBuf[20];
    strftime(dateBuf, sizeof(dateBuf), "%a, %b %d %Y", &timeInfo);
    int dx = max(0, (int)(SCREEN_W - strlen(dateBuf) * 6) / 2);
    display.setCursor(dx, 55);
    display.print(dateBuf);
  } else {
    // NTP not yet synced
    display.setTextSize(2);
    display.setCursor(14, 22);
    display.print("--:--");
    display.setTextSize(1);
    display.setCursor(16, 44);
    display.print("Syncing time...");
  }

  display.display();
}

void showSetupMode() {
  display.clearDisplay();
  oledHeader("SETUP MODE");
  display.setCursor(0, 18); display.print("Scan the pairing");
  display.setCursor(0, 30); display.print("QR from dashboard");
  display.setCursor(0, 42); display.print("to configure WiFi");
  display.setCursor(0, 54); display.print("and connect.");
  display.display();
}

void showPairingQRScanned() {
  display.clearDisplay();
  oledHeader("PAIRING");
  display.setCursor(0, 18); display.print("QR received!");
  display.setCursor(0, 30); display.print("Connecting to");
  display.setCursor(0, 42); display.print(cfg.wifi_ssid);
  display.display();
}

void showPairingSuccess() {
  display.clearDisplay();
  oledHeader("PAIRED!");
  display.drawLine(28, 28, 40, 40, SSD1306_WHITE);
  display.drawLine(29, 28, 41, 40, SSD1306_WHITE);
  display.drawLine(40, 40, 62, 18, SSD1306_WHITE);
  display.drawLine(41, 40, 63, 18, SSD1306_WHITE);
  display.setCursor(0, 50); display.print(cfg.device_name);
  display.display();
}

void showPairingFail(const char* reason) {
  display.clearDisplay();
  oledHeader("PAIR FAILED");
  display.drawLine(44, 18, 84, 50, SSD1306_WHITE);
  display.drawLine(84, 18, 44, 50, SSD1306_WHITE);
  display.drawLine(45, 18, 85, 50, SSD1306_WHITE);
  display.drawLine(85, 18, 45, 50, SSD1306_WHITE);
  display.setCursor(0, 54); display.print(reason);
  display.display();
  delay(3000);
}

void showConnectingWiFi() {
  display.clearDisplay();
  oledHeader("CONNECTING WIFI");
  display.setCursor(0, 22); display.print(cfg.wifi_ssid);
  display.display();
}

void showWiFiConnected() {
  display.clearDisplay();
  oledHeader("WIFI CONNECTED");
  display.setCursor(0, 24); display.print(WiFi.localIP().toString());
  display.display();
  delay(1500);
}

void showWiFiFailed() {
  display.clearDisplay();
  oledHeader("WIFI FAILED");
  display.setCursor(0, 24); display.print("Check credentials");
  display.setCursor(0, 36); display.print("Restarting...");
  display.display();
  delay(3000);
  ESP.restart();
}

void showProcessing(String id) {
  display.clearDisplay();
  oledHeader("PROCESSING...");
  display.setCursor(0, 22); display.print("ID: " + id);
  display.setCursor(0, 34); display.print("Contacting server");
  display.setCursor(0, 46); display.print("Please wait...");
  display.display();
}

void showSuccess(String name, String action) {
  display.clearDisplay();
  oledHeader("SCANNED!");
  display.setTextColor(SSD1306_WHITE);

  // Checkmark
  display.drawLine(28, 22, 40, 34, SSD1306_WHITE);
  display.drawLine(29, 22, 41, 34, SSD1306_WHITE);
  display.drawLine(40, 34, 62, 14, SSD1306_WHITE);
  display.drawLine(41, 34, 63, 14, SSD1306_WHITE);

  // Employee name
  display.setTextSize(1);
  String shortName = name.length() > 18 ? name.substring(0, 18) : name;
  int nx = max(0, (int)(SCREEN_W - shortName.length() * 6) / 2);
  display.setCursor(nx, 38);
  display.print(shortName);

  // Action bar at bottom — TIME IN / TIME OUT
  display.fillRect(0, 52, SCREEN_W, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  int ax = max(0, (int)(SCREEN_W - action.length() * 6) / 2);
  display.setCursor(ax, 54);
  display.print(action);

  display.display();
}

void showAlreadyLogged(String name) {
  display.clearDisplay();
  oledHeader("ALREADY LOGGED");
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 20); display.print(name);
  display.setCursor(0, 32); display.print("Already timed out");
  display.setCursor(0, 44); display.print("today.");
  display.display();
}

void showNotFound() {
  display.clearDisplay();
  oledHeader("NOT FOUND");
  display.drawLine(44, 20, 84, 52, SSD1306_WHITE);
  display.drawLine(84, 20, 44, 52, SSD1306_WHITE);
  display.drawLine(45, 20, 85, 52, SSD1306_WHITE);
  display.drawLine(85, 20, 45, 52, SSD1306_WHITE);
  display.fillRect(0, 54, SCREEN_W, 10, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setCursor(22, 55);
  display.print("ACCESS DENIED");
  display.display();
}

void showNoQR() {
  display.clearDisplay();
  oledHeader("QR READER");
  display.drawLine(44, 20, 84, 52, SSD1306_WHITE);
  display.drawLine(84, 20, 44, 52, SSD1306_WHITE);
  display.drawLine(45, 20, 85, 52, SSD1306_WHITE);
  display.drawLine(85, 20, 45, 52, SSD1306_WHITE);
  display.setCursor(38, 55); display.print("NO QR FOUND");
  display.display();
}

void showResetProgress(int secondsLeft) {
  display.clearDisplay();
  oledHeader("RESETTING...");
  display.setCursor(0, 22); display.print("Hold BOOT button");
  display.setCursor(0, 34); display.print("to reset device");
  display.setCursor(0, 46); display.print("Release to cancel");
  display.fillRect(0, 58, map(secondsLeft, 0, 5, 0, SCREEN_W), 4, SSD1306_WHITE);
  display.display();
}

void showResetting() {
  display.clearDisplay();
  oledHeader("RESETTING");
  display.setCursor(0, 30); display.print("Clearing config...");
  display.display();
}

// ── Scanner: set continuous auto-scan mode ────────────────────────

void setScannerContinuousMode() {
  Serial.println("Attempting to configure MH-ET Live v3 scanner...");
  
  // Try alternative v3 command set for continuous scanning
  byte cmd1[] = {0x7E, 0x00, 0xEB, 0x01, 0x00, 0x94, 0xEB, 0xCD};
  Serial.print("Sending CMD1: ");
  for(int i = 0; i < sizeof(cmd1); i++) Serial.printf("%02X ", cmd1[i]);
  Serial.println();
  
  scannerSerial.write(cmd1, sizeof(cmd1));
  delay(500);
  
  Serial.print("Scanner response: ");
  while (scannerSerial.available()) {
    byte b = scannerSerial.read();
    Serial.printf("%02X ", b);
  }
  Serial.println();
  
  byte cmd2[] = {0x7E, 0x00, 0xE9, 0x01, 0x00, 0x01, 0xE9, 0xCD};
  Serial.print("Sending CMD2: ");
  for(int i = 0; i < sizeof(cmd2); i++) Serial.printf("%02X ", cmd2[i]);
  Serial.println();
  
  scannerSerial.write(cmd2, sizeof(cmd2));
  delay(500);
  
  Serial.print("Scanner response: ");
  while (scannerSerial.available()) {
    byte b = scannerSerial.read();
    Serial.printf("%02X ", b);
  }
  Serial.println();
  
  Serial.println("Configuration commands sent.");
  Serial.println("If scanner still requires button press:");
  Serial.println("  1. Check for physical P/F switch on scanner");
  Serial.println("  2. Or manually scan config QR codes from manual");
}

// ── WiFi ──────────────────────────────────────────────────────────

bool connectWiFi() {
  showConnectingWiFi();
  WiFi.begin(cfg.wifi_ssid.c_str(), cfg.wifi_password.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;

    // ── Allow reset during WiFi connect ───────────────────────
    if (digitalRead(RESET_PIN) == LOW) {
      if (!buttonPressed) {
        buttonPressed = true;
        buttonPressStart = millis();
      }
      unsigned long holdTime = millis() - buttonPressStart;
      int secondsLeft = (RESET_HOLD_TIME - holdTime) / 1000 + 1;

      if (holdTime >= RESET_HOLD_TIME) {
        showResetting();
        delay(1000);
        clearConfig();
        ESP.restart();
      } else if (holdTime > 1000) {
        showResetProgress(secondsLeft);
        continue;
      }
    } else {
      buttonPressed = false;
      buttonPressStart = 0;
    }
    // ──────────────────────────────────────────────────────────

    display.fillRect(0, 34, SCREEN_W, 12, SSD1306_BLACK);
    for (int i = 0; i < (attempts % 4); i++) {
      display.fillCircle(54 + i * 10, 40, 3, SSD1306_WHITE);
    }
    display.display();
  }

  if (WiFi.status() == WL_CONNECTED) {
    showWiFiConnected();
    return true;
  }

  showWiFiFailed();
  return false;
}

// ── NTP sync ──────────────────────────────────────────────────────

void syncNTP() {
  // UTC+8 = Philippine Time. Change first arg for your timezone offset in seconds.
  configTime(8 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("NTP sync started...");

  // Wait up to 5 seconds for NTP
  struct tm timeInfo;
  int retries = 0;
  while (!getLocalTime(&timeInfo) && retries < 10) {
    delay(500);
    retries++;
  }

  if (getLocalTime(&timeInfo)) {
    Serial.println("NTP synced OK");
  } else {
    Serial.println("NTP sync failed — will retry in background");
  }
}

// ── Heartbeat ─────────────────────────────────────────────────────

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  String heartbeatUrl = cfg.server_url;
  int pos = heartbeatUrl.lastIndexOf("/api/");
  if (pos != -1) {
    heartbeatUrl = heartbeatUrl.substring(0, pos) + "/api/devices/heartbeat";
  }

  HTTPClient http;
  http.begin(heartbeatUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(4000);

  String payload = "{\"pairing_token\":\"" + cfg.pairing_token + "\"}";
  int code = http.POST(payload);
  http.end();

  Serial.println("Heartbeat: " + String(code));
}

// ── Register device after pairing QR scanned ─────────────────────

bool registerDevice() {
  HTTPClient http;
  http.begin(cfg.register_url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(8000);

  StaticJsonDocument<256> doc;
  doc["pairing_token"] = cfg.pairing_token;
  doc["chip_id"]       = String((uint32_t)ESP.getEfuseMac(), HEX);
  doc["mac_address"]   = WiFi.macAddress();
  doc["name"]          = cfg.device_name;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.println("Register code: " + String(code));
  Serial.println("Register resp: " + resp);

  return (code == 200 || code == 201);
}

// ── Parse pairing QR ─────────────────────────────────────────────

bool parsePairingQR(const String& raw) {
  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, raw) != DeserializationError::Ok) return false;
  if (!doc.containsKey("pairing_token")) return false;

  cfg.pairing_token = doc["pairing_token"] | "";
  cfg.wifi_ssid     = doc["wifi_ssid"]     | "";
  cfg.wifi_password = doc["wifi_password"] | "";
  cfg.server_url    = doc["server_url"]    | "";
  cfg.register_url  = doc["register_url"]  | "";
  cfg.device_name   = doc["name"]          | "ESP32 Device";
  cfg.scan_cooldown = doc["scan_cooldown"] | 3000;

  return cfg.pairing_token.length() > 0 && cfg.wifi_ssid.length() > 0;
}

// ── Extract employee ID from scanned QR ──────────────────────────

String extractEmployeeId(String raw) {
  raw.trim();
  while (raw.length() > 0 && (raw[0] < 32 || raw[0] > 126)) {
    raw = raw.substring(1);
  }

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, raw) == DeserializationError::Ok) {
    if (doc.containsKey("employee_id"))   return doc["employee_id"].as<String>();
    if (doc.containsKey("instructor_id")) return doc["instructor_id"].as<String>();
    if (doc.containsKey("id"))            return doc["id"].as<String>();
    if (doc.containsKey("emp_id"))        return doc["emp_id"].as<String>();
  }

  return raw;
}

// ── Send employee scan to server (WITH DEVICE TIME) ────────────────

void sendScan(String employeeId) {
  Serial.println("Using token: " + cfg.pairing_token);
  Serial.println("Server URL: " + cfg.server_url);
  showProcessing(employeeId);

  if (WiFi.status() != WL_CONNECTED) connectWiFi();

  HTTPClient http;
  http.begin(cfg.server_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  http.setTimeout(6000);

  // Get current time from ESP32 (Unix timestamp)
  time_t deviceTime = time(nullptr);
  
  // Create JSON payload with device time
  StaticJsonDocument<256> scanDoc;
  scanDoc["employee_id"]   = employeeId;
  scanDoc["pairing_token"] = cfg.pairing_token;
  scanDoc["device_time"]   = (long)deviceTime;  // Unix timestamp from ESP32
  
  String payload;
  serializeJson(scanDoc, payload);
  
  Serial.println("Payload: " + payload);
  int code = http.POST(payload);

  Serial.println("HTTP " + String(code));

  if (code == 200) {
    String body = http.getString();
    Serial.println(body);

    StaticJsonDocument<256> doc;
    deserializeJson(doc, body);

    String name   = doc["name"]   | "Unknown";
    String action = doc["action"] | "SCANNED";
    String status = doc["status"] | "";

    if (status == "already_out") {
      showAlreadyLogged(name);
    } else {
      showSuccess(name, action);
    }
  } else {
    Serial.println("Failed: " + http.getString());
    showNotFound();
  }

  http.end();
  delay(3000);

  // Return to clock display
  showClock();
  lastScanTime  = millis();
  lastClockDraw = millis();
  waitingShown  = true;
}

// ── Handle pairing QR scan ────────────────────────────────────────

void handlePairingQR(const String& raw) {
  Serial.println("Trying pairing QR: " + raw);

  if (!parsePairingQR(raw)) {
    showPairingFail("Bad QR");
    cfg = Config();
    showSetupMode();
    return;
  }

  showPairingQRScanned();
  delay(800);

  if (!connectWiFi()) {
    showPairingFail("WiFi failed");
    clearConfig();
    showSetupMode();
    return;
  }

  display.clearDisplay();
  oledHeader("PAIRING");
  display.setCursor(0, 22); display.print("Registering with");
  display.setCursor(0, 34); display.print("server...");
  display.display();

  if (!registerDevice()) {
    showPairingFail("Server error");
    clearConfig();
    showSetupMode();
    return;
  }

  cfg.paired = true;
  saveConfig();
  showPairingSuccess();
  delay(2500);
  Serial.println("Pairing complete — rebooting");
  ESP.restart();
}

// ── Handle manual reset button ────────────────────────────────────

void checkResetButton() {
  if (resetInProgress) return;

  if (digitalRead(RESET_PIN) == LOW) {
    if (!buttonPressed) {
      buttonPressed = true;
      buttonPressStart = millis();
    } else {
      unsigned long holdTime = millis() - buttonPressStart;
      int secondsLeft = (RESET_HOLD_TIME - holdTime) / 1000 + 1;

      if (holdTime >= RESET_HOLD_TIME) {
        resetInProgress = true;
        showResetting();
        delay(1000);
        clearConfig();
        ESP.restart();
      } else if (holdTime > 1000 && (holdTime / 500) % 2 == 0) {
        showResetProgress(secondsLeft);
      }
    }
  } else {
    if (buttonPressed) {
      buttonPressed = false;
      // Restore display based on current mode
      if (cfg.paired) {
        showClock();
        lastClockDraw = millis();
      } else {
        showSetupMode();
      }
    }
  }
}

// ── Setup ─────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  Wire.begin(5, 4);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C, false, false)) {
    Serial.println("OLED failed!");
    while (true);
  }
  display.clearDisplay();
  display.display();

  scannerSerial.begin(9600, SERIAL_8N1, SCANNER_RX, SCANNER_TX);
  delay(500);
  setScannerContinuousMode();

  if (loadConfig() && cfg.paired) {
    Serial.println("Config found: " + cfg.device_name);
    connectWiFi();

    // Sync time via NTP after WiFi connected
    syncNTP();

    showClock();
    lastScanTime  = millis();
    lastHeartbeat = millis();
    lastClockDraw = millis();
    waitingShown  = true;
    Serial.println("Ready — waiting for QR scan...");
    Serial.println("Hold BOOT button for 5 seconds to reset");
  } else {
    Serial.println("No config — entering setup mode");
    showSetupMode();
    Serial.println("Hold BOOT button for 5 seconds to reset");
  }
}

// ── Loop ──────────────────────────────────────────────────────────

void loop() {
  // Check for manual reset button
  checkResetButton();

  // Don't process scans if reset is in progress
  if (resetInProgress) {
    delay(100);
    return;
  }

  // ── Read scanner ──────────────────────────────────────────────
  while (scannerSerial.available()) {
    char c = scannerSerial.read();

    if (c == '\r' || c == '\n') {
      buffer.trim();

      if (buffer.length() > 0) {
        Serial.println("Raw scan: " + buffer);

        if (!cfg.paired) {
          handlePairingQR(buffer);
        } else {
          String employeeId = extractEmployeeId(buffer);
          Serial.println("Employee ID: " + employeeId);
          if (employeeId.length() > 0) {
            sendScan(employeeId);
          }
          lastScanTime = millis();
          waitingShown = false;
        }

        buffer = "";
      }

    } else {
      buffer += c;
    }
  }

  // ── Timeout → No QR screen then back to clock ─────────────────
  if (cfg.paired && millis() - lastScanTime > QR_TIMEOUT && !waitingShown) {
    showNoQR();
    delay(2000);
    showClock();
    lastScanTime  = millis();
    lastClockDraw = millis();
    waitingShown  = true;
  }

  // ── Update clock every second while idle ──────────────────────
  if (cfg.paired && waitingShown && millis() - lastClockDraw > 1000) {
    showClock();
    lastClockDraw = millis();
  }

  // ── Heartbeat ─────────────────────────────────────────────────
  if (cfg.paired && millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
}
