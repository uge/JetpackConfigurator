// WebSerial Device Configurator
class DeviceConfigurator {
    constructor() {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.isConnected = false;
        this.messageBuffer = '';
        
        // Band data from WSPR.h bandDataList_
        this.bandDataList = [
            { band: "2190m", freq: 136000 },
            { band: "630m", freq: 474200 },
            { band: "160m", freq: 1836600 },
            { band: "80m", freq: 3568600 },
            { band: "60m", freq: 5287200 },
            { band: "40m", freq: 7038600 },
            { band: "30m", freq: 10138700 },
            { band: "20m", freq: 14095600 },
            { band: "17m", freq: 18104600 },
            { band: "15m", freq: 21094600 },
            { band: "12m", freq: 24924600 },
            { band: "10m", freq: 28124600 },
            { band: "6m", freq: 50293000 },
            { band: "4m", freq: 70091000 },
            { band: "2m", freq: 144489000 },
            { band: "70cm", freq: 432300000 },
            { band: "23cm", freq: 1296500000 }
        ];
        
        this.initializeElements();
        this.populateBandSelector();
        this.setupEventListeners();
        this.checkWebSerialSupport();
    }

    initializeElements() {
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.statusIndicator = document.querySelector('.status-indicator');
        this.statusText = document.querySelector('.status-text');
        this.deviceInfo = {
            port: document.getElementById('portInfo'),
            vendorId: document.getElementById('vendorId'),
            productId: document.getElementById('productId'),
            serialNumber: document.getElementById('serialNumber')
        };
        this.messageLog = document.getElementById('messageLog');
        this.pingBtn = document.getElementById('pingBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.hideGpsLines = document.getElementById('hideGpsLines');
        this.messageType = document.getElementById('messageType');
        this.sendMessageBtn = document.getElementById('sendMessageBtn');
        this.jsonInput = document.getElementById('jsonInput');
        this.sendJsonBtn = document.getElementById('sendJsonBtn');
        
        // Configuration display elements
        this.configElements = {
            band: document.getElementById('configBand'),
            channel: document.getElementById('configChannel'),
            correction: document.getElementById('configCorrection'),
            callsign: document.getElementById('configCallsign'),
            callsignOk: document.getElementById('configCallsignOk'),
            tempValue: document.getElementById('tempValue'),
            tempTimestamp: document.getElementById('tempTimestamp'),
            // GPS elements
            gpsStatus: document.getElementById('gpsStatus'),
            gpsSatellites: document.getElementById('gpsSatellites'),
            gpsAntenna: document.getElementById('gpsAntenna'),
            gpsJamming: document.getElementById('gpsJamming'),
            gpsLatitude: document.getElementById('gpsLatitude'),
            gpsLongitude: document.getElementById('gpsLongitude'),
            gpsAltitude: document.getElementById('gpsAltitude'),
            gpsTimestamp: document.getElementById('gpsTimestamp'),
            gpsTime: document.getElementById('gpsTime'),
            gpsSpeed: document.getElementById('gpsSpeed'),
            gpsCourse: document.getElementById('gpsCourse'),
            gpsMagVar: document.getElementById('gpsMagVar')
        };
        this.refreshConfigBtn = document.getElementById('refreshConfigBtn');
        this.saveConfigBtn = document.getElementById('saveConfigBtn');
        
        this.originalConfig = {}; // Store original values for change detection
    }

    setupEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.pingBtn.addEventListener('click', () => this.sendPing());
        this.clearBtn.addEventListener('click', () => this.clearLog());
        this.hideGpsLines.addEventListener('change', () => this.toggleGpsLineFilter());
        this.refreshConfigBtn.addEventListener('click', () => this.refreshConfig());
        this.saveConfigBtn.addEventListener('click', () => this.saveConfig());
        
        // Add change listeners for editable config fields
        this.configElements.band.addEventListener('change', () => this.onConfigFieldChange());
        this.configElements.channel.addEventListener('input', () => this.onConfigFieldChange());
        this.configElements.callsign.addEventListener('input', () => this.onConfigFieldChange());
        this.configElements.callsign.addEventListener('input', () => this.validateCallsign());
        
        this.sendMessageBtn.addEventListener('click', () => this.sendSelectedMessage());
        this.sendJsonBtn.addEventListener('click', () => this.sendCustomJson());
        this.messageType.addEventListener('change', () => this.updateJsonInput());
    }

    checkWebSerialSupport() {
        if (!('serial' in navigator)) {
            this.showError('WebSerial is not supported in this browser. Please use Chrome, Edge, or Opera.');
            this.connectBtn.disabled = true;
            this.connectBtn.textContent = 'WebSerial Not Supported';
            return false;
        }
        return true;
    }

    async connect() {
        try {
            this.updateStatus('connecting', 'Connecting...');
            
            // Request a port
            this.port = await navigator.serial.requestPort();
            
            // Open the port
            await this.port.open({
                baudRate: 115200,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
            
            this.isConnected = true;
            this.updateStatus('connected', 'Connected');
            this.updateUI(true);
            this.updateDeviceInfo();
            
            this.log('Connected to device successfully', 'info');
            
            // Start reading from the device
            this.startReading();
            
            // Request initial configuration after connection
            setTimeout(() => {
                this.requestConfig();
            }, 1000); // Wait 1 second after connection to ensure device is ready
            
        } catch (error) {
            this.showError('Connection failed: ' + error.message);
            this.updateStatus('disconnected', 'Connection Failed');
            this.updateUI(false);
        }
    }

    async disconnect() {
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.writer) {
                await this.writer.close();
                this.writer = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            this.isConnected = false;
            this.updateStatus('disconnected', 'Disconnected');
            this.updateUI(false);
            this.clearDeviceInfo();
            
            this.log('Disconnected from device', 'info');
            
        } catch (error) {
            this.showError('Disconnect failed: ' + error.message);
        }
    }

    async startReading() {
        try {
            while (this.isConnected && this.reader) {
                const { value, done } = await this.reader.read();
                
                if (done) {
                    break;
                }
                
                // Convert Uint8Array to string
                const text = new TextDecoder().decode(value);
                this.messageBuffer += text;
                
                // Process complete lines
                let lines = this.messageBuffer.split('\n');
                this.messageBuffer = lines.pop() || ''; // Keep the incomplete line
                
                for (const line of lines) {
                    if (line.trim()) {
                        this.processIncomingMessage(line.trim());
                    }
                }
            }
        } catch (error) {
            if (this.isConnected) {
                this.showError('Read error: ' + error.message);
            }
        }
    }

    processIncomingMessage(message) {
        try {
            // Try to parse as JSON
            const jsonData = JSON.parse(message);
            
            // Check if this is a GPS_LINE message
            const isGpsLine = jsonData.type === 'GPS_LINE' || 
                             (typeof jsonData === 'object' && 
                              (message.includes('GPS_LINE') || 
                               message.includes('$GP') || 
                               message.includes('$GN') || 
                               message.includes('$GL')));
            
            // Handle configuration and temperature responses
            this.handleConfigResponse(jsonData);
            
            // Handle TEMP messages specifically
            if (jsonData.type === 'TEMP' || jsonData.type === 'REP_TEMP') {
                this.updateTempDisplay(jsonData);
            }
            
            // Handle GPS_LINE messages specifically
            if (jsonData.type === 'GPS_LINE') {
                this.handleGpsLineMessage(jsonData);
            }
            
            this.log(`◀ ${JSON.stringify(jsonData, null, 2)}`, 'received', isGpsLine);
        } catch (error) {
            // Not JSON, check if it looks like GPS data
            const isGpsLine = message.startsWith('$GP') || 
                             message.startsWith('$GN') || 
                             message.startsWith('$GL') || 
                             message.includes('GPS_LINE');
            
            // Check for temperature data in plain text
            this.handleTempMessage(message);
            
            // Check for GPS data
            this.handleGpsMessage(message);
            
            this.log(`◀ ${message}`, 'received', isGpsLine);
        }
    }

    async sendMessage(message) {
        if (!this.isConnected || !this.writer) {
            this.showError('Not connected to device');
            return;
        }

        try {
            const data = new TextEncoder().encode(message + '\n');
            await this.writer.write(data);
            
            // Log sent message
            try {
                const jsonData = JSON.parse(message);
                this.log(`▶ ${JSON.stringify(jsonData, null, 2)}`, 'sent');
            } catch (error) {
                this.log(`▶ ${message}`, 'sent');
            }
            
        } catch (error) {
            this.showError('Send failed: ' + error.message);
        }
    }

    async sendPing() {
        const pingMessage = JSON.stringify({ type: 'REQ_PING' });
        await this.sendMessage(pingMessage);
    }

    async sendSelectedMessage() {
        const messageType = this.messageType.value;
        const message = JSON.stringify({ type: messageType });
        await this.sendMessage(message);
    }

    async sendCustomJson() {
        const jsonText = this.jsonInput.value.trim();
        if (!jsonText) {
            this.showError('Please enter JSON message');
            return;
        }

        try {
            // Validate JSON
            JSON.parse(jsonText);
            await this.sendMessage(jsonText);
        } catch (error) {
            this.showError('Invalid JSON: ' + error.message);
        }
    }

    updateJsonInput() {
        const messageType = this.messageType.value;
        this.jsonInput.value = JSON.stringify({ type: messageType }, null, 2);
    }

    updateStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }

    updateUI(connected) {
        this.connectBtn.disabled = connected;
        this.disconnectBtn.disabled = !connected;
        this.pingBtn.disabled = !connected;
        this.sendMessageBtn.disabled = !connected;
        this.jsonInput.disabled = !connected;
        this.sendJsonBtn.disabled = !connected;
        this.refreshConfigBtn.disabled = !connected;
        this.saveConfigBtn.disabled = !connected;
        
        // Enable/disable config inputs
        this.configElements.band.disabled = !connected;
        this.configElements.channel.disabled = !connected;
        this.configElements.callsign.disabled = !connected;
        
        if (!connected) {
            this.clearConfigDisplay();
        }
    }

    updateDeviceInfo() {
        if (!this.port) return;

        const info = this.port.getInfo();
        this.deviceInfo.port.textContent = 'USB Serial Port';
        this.deviceInfo.vendorId.textContent = info.usbVendorId ? `0x${info.usbVendorId.toString(16).padStart(4, '0').toUpperCase()}` : 'Unknown';
        this.deviceInfo.productId.textContent = info.usbProductId ? `0x${info.usbProductId.toString(16).padStart(4, '0').toUpperCase()}` : 'Unknown';
        this.deviceInfo.serialNumber.textContent = 'Connected';
    }

    clearDeviceInfo() {
        this.deviceInfo.port.textContent = '-';
        this.deviceInfo.vendorId.textContent = '-';
        this.deviceInfo.productId.textContent = '-';
        this.deviceInfo.serialNumber.textContent = '-';
    }

    log(message, type = 'info', isGpsLine = false) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        
        let className = `log-entry ${type}`;
        if (isGpsLine) {
            className += ' gps-line';
            if (this.hideGpsLines.checked) {
                className += ' filtered';
            }
        }
        
        logEntry.className = className;
        
        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <pre>${message}</pre>
        `;
        
        // Remove placeholder if it exists
        const placeholder = this.messageLog.querySelector('.log-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        this.messageLog.appendChild(logEntry);
        this.messageLog.scrollTop = this.messageLog.scrollHeight;
    }

    clearLog() {
        this.messageLog.innerHTML = '<p class="log-placeholder">Log cleared. Connect to device to see messages...</p>';
    }

    showError(message) {
        this.log(`❌ ${message}`, 'error');
        console.error(message);
    }

    toggleGpsLineFilter() {
        const gpsEntries = this.messageLog.querySelectorAll('.log-entry.gps-line');
        const hideGps = this.hideGpsLines.checked;
        
        gpsEntries.forEach(entry => {
            if (hideGps) {
                entry.classList.add('filtered');
            } else {
                entry.classList.remove('filtered');
            }
        });
        
        // Log the filter change
        const status = hideGps ? 'enabled' : 'disabled';
        this.log(`🔍 GPS line filtering ${status}`, 'info');
    }

    handleConfigResponse(jsonData) {
        if (!jsonData || typeof jsonData !== 'object') return;
        
        switch (jsonData.type) {
            case 'REP_GET_CONFIG':
                this.updateConfigDisplay(jsonData);
                this.log('📡 Device configuration received', 'info');
                break;
            case 'TEMP':
            case 'REP_TEMP':
                this.updateTempDisplay(jsonData);
                break;
            default:
                // Handle other response types if needed
                break;
        }
    }

    handleTempMessage(message) {
        // Handle temperature messages that might not be JSON
        // Look for patterns like "TEMP: 25.5°C", "Temperature: 25.5", or "TEMP 25.5"
        const tempMatch = message.match(/(?:TEMP|Temperature)[\s:]*([0-9.-]+)(?:\s*°?C)?/i);
        if (tempMatch) {
            const tempValue = parseFloat(tempMatch[1]);
            this.updateTempDisplay({ 
                temp: tempValue, 
                temperature: tempValue, 
                timestamp: new Date() 
            });
            this.log(`🌡️ Temperature updated: ${tempValue}°C`, 'info');
        }
    }

    handleGpsMessage(message) {
        // Parse NMEA GPS messages
        if (message.startsWith('$GP') || message.startsWith('$GN') || message.startsWith('$GL')) {
            this.parseNmeaMessage(message);
        }
    }

    handleGpsLineMessage(jsonData) {
        // Handle GPS_LINE JSON responses from the device
        // These typically contain NMEA data in various formats
        if (jsonData.line) {
            // If GPS_LINE contains an NMEA sentence in the 'line' field
            this.parseNmeaMessage(jsonData.line);
        } else if (jsonData.nmea) {
            // If GPS_LINE contains NMEA data in the 'nmea' field
            this.parseNmeaMessage(jsonData.nmea);
        } else if (jsonData.data) {
            // If GPS_LINE contains NMEA data in the 'data' field
            this.parseNmeaMessage(jsonData.data);
        } else {
            // Check if any of the JSON fields contain NMEA-like data
            Object.values(jsonData).forEach(value => {
                if (typeof value === 'string' && 
                    (value.startsWith('$GP') || value.startsWith('$GN') || value.startsWith('$GL'))) {
                    this.parseNmeaMessage(value);
                }
            });
        }
    }

    parseNmeaMessage(nmeaMessage) {
        // Clean up the NMEA message (remove any extra whitespace or line endings)
        const cleanMessage = nmeaMessage.trim();
        
        // Skip if not a valid NMEA message
        if (!cleanMessage.startsWith('$') || cleanMessage.length < 6) {
            return;
        }
        
        const parts = cleanMessage.split(',');
        const messageType = parts[0];
        
        try {
            switch (messageType) {
                case '$GPGGA':
                case '$GNGGA':
                    this.parseGgaMessage(parts);
                    break;
                case '$GPRMC':
                case '$GNRMC':
                    this.parseRmcMessage(parts);
                    break;
                case '$GPGSV':
                case '$GNGSV':
                case '$GLGSV':
                    this.parseGsvMessage(parts);
                    break;
                case '$GPGSA':
                case '$GNGSA':
                    this.parseGsaMessage(parts);
                    break;
                case '$GPVTG':
                case '$GNVTG':
                    this.parseVtgMessage(parts);
                    break;
                case '$GPTXT':
                case '$GNTXT':
                    this.parseGptxtMessage(parts);
                    break;
                case '$GPZDA':
                case '$GNZDA':
                    this.parseZdaMessage(parts);
                    break;
                default:
                    // Log unknown NMEA message types for debugging
                    this.log(`🛰️ Unknown NMEA message: ${messageType}`, 'info');
                    break;
            }
        } catch (error) {
            this.log(`⚠️ NMEA parsing error for ${messageType}: ${error.message}`, 'error');
        }
    }

    parseGgaMessage(parts) {
        // $GPGGA,time,lat,lat_dir,lon,lon_dir,quality,satellites,hdop,altitude,alt_units,geoid_height,geoid_units,dgps_time,dgps_id*checksum
        if (parts.length >= 15) {
            const quality = parseInt(parts[6]);
            const satellites = parseInt(parts[7]);
            const latitude = this.parseCoordinate(parts[2], parts[3]);
            const longitude = this.parseCoordinate(parts[4], parts[5]);
            const altitude = parseFloat(parts[9]);
            const hdop = parseFloat(parts[8]);
            
            const updateData = {
                quality: !isNaN(quality) ? quality : undefined,
                satellites: !isNaN(satellites) ? satellites : undefined,
                latitude: latitude,
                longitude: longitude,
                altitude: !isNaN(altitude) ? altitude : undefined,
                hdop: !isNaN(hdop) ? hdop : undefined,
                timestamp: new Date()
            };
            
            // Only update with valid data
            const validData = Object.fromEntries(
                Object.entries(updateData).filter(([_, value]) => value !== undefined)
            );
            
            if (Object.keys(validData).length > 1) { // More than just timestamp
                this.updateGpsDisplay(validData);
            }
        }
    }

    parseRmcMessage(parts) {
        // $GPRMC,time,status,lat,lat_dir,lon,lon_dir,speed,course,date,mag_var,var_dir*checksum
        // $GNRMC,time,status,lat,lat_dir,lon,lon_dir,speed,course,date,mag_var,var_dir*checksum
        // Format: $GNRMC,064951.000,A,4807.038,N,01131.000,E,0.02,54.7,260523,,,A*76
        // Where:
        // - Field 1: Time in HHMMSS.sss format (UTC)
        // - Field 2: Status (A=active, V=void)
        // - Field 3: Latitude in DDMM.mmmm format
        // - Field 4: N/S hemisphere
        // - Field 5: Longitude in DDDMM.mmmm format
        // - Field 6: E/W hemisphere
        // - Field 7: Speed over ground in knots
        // - Field 8: Course over ground in degrees
        // - Field 9: Date in DDMMYY format
        // - Field 10: Magnetic variation (degrees)
        // - Field 11: E/W direction of magnetic variation
        // - Field 12: Mode indicator (A=autonomous, D=differential, E=estimated, N=not valid)
        
        if (parts.length >= 12) {
            const time = parts[1];
            const status = parts[2]; // A = active, V = void
            const latitude = this.parseCoordinate(parts[3], parts[4]);
            const longitude = this.parseCoordinate(parts[5], parts[6]);
            const speed = parseFloat(parts[7]); // Speed in knots
            const course = parseFloat(parts[8]); // Course in degrees
            const date = parts[9]; // Date in DDMMYY format
            const magVar = parseFloat(parts[10]); // Magnetic variation
            const magVarDir = parts[11]; // E/W direction
            const modeIndicator = parts[12] ? parts[12].split('*')[0] : undefined; // Remove checksum
            
            const updateData = {
                status: status === 'A' ? 'active' : 'void',
                latitude: latitude,
                longitude: longitude,
                speedKnots: !isNaN(speed) ? speed : undefined,
                course: !isNaN(course) ? course : undefined,
                magneticVariation: !isNaN(magVar) ? magVar : undefined,
                magneticVariationDirection: magVarDir,
                modeIndicator: modeIndicator,
                timestamp: new Date()
            };
            
            // Parse date and time if available
            if (time && time.length >= 6 && date && date.length === 6) {
                try {
                    const hours = parseInt(time.substring(0, 2));
                    const minutes = parseInt(time.substring(2, 4));
                    const seconds = parseFloat(time.substring(4));
                    
                    const day = parseInt(date.substring(0, 2));
                    const month = parseInt(date.substring(2, 4));
                    const year = 2000 + parseInt(date.substring(4, 6)); // Convert YY to YYYY
                    
                    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && 
                        !isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        
                        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, Math.floor(seconds)));
                        updateData.gpsTime = utcDate.toISOString();
                        
                        // Store RMC date/time information
                        this.rmcDateTime = {
                            utcDate: utcDate,
                            timestamp: new Date()
                        };
                        
                        this.log(`🕐 RMC Time: ${utcDate.toISOString()} (UTC)`, 'info');
                    }
                } catch (error) {
                    this.log(`⚠️ RMC date/time parsing error: ${error.message}`, 'error');
                }
            }
            
            // Only update with valid data
            const validData = Object.fromEntries(
                Object.entries(updateData).filter(([_, value]) => value !== undefined)
            );
            
            if (Object.keys(validData).length > 1) { // More than just timestamp
                this.updateGpsDisplay(validData);
            }
            
            // Log additional RMC information
            const rmcInfo = [];
            if (updateData.speedKnots !== undefined) {
                rmcInfo.push(`Speed: ${updateData.speedKnots.toFixed(1)} knots`);
            }
            if (updateData.course !== undefined) {
                rmcInfo.push(`Course: ${updateData.course.toFixed(1)}°`);
            }
            if (updateData.magneticVariation !== undefined) {
                rmcInfo.push(`Mag Var: ${updateData.magneticVariation.toFixed(1)}° ${updateData.magneticVariationDirection || ''}`);
            }
            if (rmcInfo.length > 0) {
                this.log(`🧭 RMC Data: ${rmcInfo.join(', ')}`, 'info');
            }
        }
    }

    parseGsvMessage(parts) {
        // $GPGSV,total_messages,message_number,total_satellites,...
        if (parts.length >= 4) {
            const totalSatellites = parseInt(parts[3]);
            
            if (!isNaN(totalSatellites)) {
                this.updateGpsDisplay({
                    satellites: totalSatellites,
                    timestamp: new Date()
                });
            }
        }
    }

    parseGsaMessage(parts) {
        // $GPGSA,selection_mode,mode,satellite_ids...,pdop,hdop,vdop*checksum
        if (parts.length >= 18) {
            const mode = parseInt(parts[2]);
            const hdop = parseFloat(parts[16]);
            const vdop = parseFloat(parts[17]);
            
            // Count active satellites (non-empty fields from positions 3-14)
            let activeSatellites = 0;
            for (let i = 3; i <= 14; i++) {
                if (parts[i] && parts[i].trim() !== '') {
                    activeSatellites++;
                }
            }
            
            this.updateGpsDisplay({
                mode: mode, // 1 = no fix, 2 = 2D fix, 3 = 3D fix
                activeSatellites: activeSatellites,
                hdop: hdop,
                vdop: vdop,
                timestamp: new Date()
            });
        }
    }

    parseVtgMessage(parts) {
        // $GPVTG,course,T,course,M,speed_knots,N,speed_kmh,K,mode*checksum
        if (parts.length >= 10) {
            const course = parseFloat(parts[1]);
            const speedKnots = parseFloat(parts[5]);
            const speedKmh = parseFloat(parts[7]);
            
            this.updateGpsDisplay({
                course: course,
                speedKnots: speedKnots,
                speedKmh: speedKmh,
                timestamp: new Date()
            });
        }
    }

    parseGptxtMessage(parts) {
        // $GPTXT,xx,xx,xx,text*checksum
        // Format: $GPTXT,01,01,02,ANTSTATUS=OPEN*25
        // Where:
        // - Field 1: Total number of sentences
        // - Field 2: Sentence number
        // - Field 3: Text identifier (message type)
        // - Field 4: Text message
        
        if (parts.length >= 5) {
            const totalSentences = parseInt(parts[1]);
            const sentenceNumber = parseInt(parts[2]);
            const textIdentifier = parseInt(parts[3]);
            let textMessage = parts[4];
            
            // Remove checksum if present
            if (textMessage.includes('*')) {
                textMessage = textMessage.split('*')[0];
            }
            
            // Parse common u-blox GPS text messages
            this.parseUbloxTextMessage(textIdentifier, textMessage);
            
            // Log the GPS text message
            this.log(`📡 GPS Text (${sentenceNumber}/${totalSentences}): ${textMessage}`, 'info');
        }
    }

    parseUbloxTextMessage(textId, message) {
        // Parse specific u-blox GPS text message types
        const gpsTextData = {
            timestamp: new Date()
        };
        
        switch (textId) {
            case 1: // Startup message
                this.handleGpsStartupMessage(message);
                break;
            case 2: // Antenna status
                this.handleGpsAntennaStatus(message);
                break;
            case 3: // Jamming status
                this.handleGpsJammingStatus(message);
                break;
            case 4: // RF/AGC status
                this.handleGpsRfStatus(message);
                break;
            case 5: // Navigation status
                this.handleGpsNavStatus(message);
                break;
            case 6: // Time/Clock status
                this.handleGpsTimeStatus(message);
                break;
            case 7: // Hardware status
                this.handleGpsHardwareStatus(message);
                break;
            default:
                // Generic text message handling
                this.handleGpsGenericText(message);
                break;
        }
    }

    handleGpsStartupMessage(message) {
        // Handle GPS startup messages
        if (message.includes('STARTUP')) {
            this.updateGpsDisplay({
                status: 'starting',
                timestamp: new Date()
            });
            this.log('🚀 GPS module starting up', 'info');
        }
    }

    handleGpsAntennaStatus(message) {
        // Handle antenna status messages
        // Examples: "ANTSTATUS=OPEN", "ANTSTATUS=SHORT", "ANTSTATUS=OK"
        if (message.includes('ANTSTATUS=')) {
            const status = message.split('ANTSTATUS=')[1];
            let antennaStatus = 'unknown';
            let statusClass = 'invalid';
            
            switch (status.toUpperCase()) {
                case 'OK':
                    antennaStatus = 'OK';
                    statusClass = 'valid';
                    break;
                case 'OPEN':
                    antennaStatus = 'Open Circuit';
                    statusClass = 'invalid';
                    break;
                case 'SHORT':
                    antennaStatus = 'Short Circuit';
                    statusClass = 'invalid';
                    break;
                default:
                    antennaStatus = status;
                    break;
            }
            
            this.updateGpsDisplay({
                antennaStatus: antennaStatus,
                antennaStatusClass: statusClass,
                timestamp: new Date()
            });
            
            this.log(`📡 Antenna Status: ${antennaStatus}`, statusClass === 'valid' ? 'info' : 'error');
        }
    }

    handleGpsJammingStatus(message) {
        // Handle jamming/interference status
        if (message.includes('JAMMING') || message.includes('INTERFERENCE')) {
            const isJamming = message.includes('DETECTED') || message.includes('HIGH');
            this.updateGpsDisplay({
                jammingStatus: isJamming ? 'Detected' : 'Clear',
                jammingStatusClass: isJamming ? 'invalid' : 'valid',
                timestamp: new Date()
            });
            
            this.log(`📡 Jamming Status: ${isJamming ? 'Detected' : 'Clear'}`, 
                    isJamming ? 'error' : 'info');
        }
    }

    handleGpsRfStatus(message) {
        // Handle RF/AGC status messages
        if (message.includes('AGC') || message.includes('RF')) {
            this.log(`📡 RF Status: ${message}`, 'info');
        }
    }

    handleGpsNavStatus(message) {
        // Handle navigation status messages
        if (message.includes('NAV')) {
            this.log(`📡 Navigation: ${message}`, 'info');
        }
    }

    handleGpsTimeStatus(message) {
        // Handle time/clock status messages
        if (message.includes('TIME') || message.includes('CLOCK')) {
            this.log(`📡 Time Status: ${message}`, 'info');
        }
    }

    handleGpsHardwareStatus(message) {
        // Handle hardware status messages
        if (message.includes('HW') || message.includes('HARDWARE')) {
            this.log(`📡 Hardware: ${message}`, 'info');
        }
    }

    handleGpsGenericText(message) {
        // Handle generic GPS text messages
        this.log(`📡 GPS Info: ${message}`, 'info');
    }

    parseCoordinate(coordStr, direction) {
        // Parse NMEA coordinate format (DDMM.mmmm or DDDMM.mmmm) to decimal degrees
        if (!coordStr || coordStr === '' || !direction) {
            return null;
        }
        
        try {
            const coord = parseFloat(coordStr);
            if (isNaN(coord)) {
                return null;
            }
            
            // For latitude: DDMM.mmmm (degrees are first 2 digits)
            // For longitude: DDDMM.mmmm (degrees are first 3 digits)
            let degrees, minutes;
            
            if (coordStr.length <= 9) {
                // Latitude format: DDMM.mmmm
                degrees = Math.floor(coord / 100);
                minutes = coord - (degrees * 100);
            } else {
                // Longitude format: DDDMM.mmmm
                degrees = Math.floor(coord / 100);
                minutes = coord - (degrees * 100);
            }
            
            // Convert to decimal degrees
            let decimalDegrees = degrees + (minutes / 60);
            
            // Apply direction (negative for South and West)
            if (direction === 'S' || direction === 'W') {
                decimalDegrees = -decimalDegrees;
            }
            
            return parseFloat(decimalDegrees.toFixed(6));
        } catch (error) {
            this.log(`⚠️ Coordinate parsing error: ${error.message}`, 'error');
            return null;
        }
    }

    updateGpsDisplay(gpsData) {
        if (gpsData.status !== undefined) {
            const statusElement = this.configElements.gpsStatus;
            statusElement.textContent = gpsData.status === 'active' ? 'Active' : 'No Fix';
            statusElement.className = `status-badge ${gpsData.status === 'active' ? 'valid' : 'invalid'}`;
            this.animateConfigUpdate(statusElement);
        }
        
        if (gpsData.quality !== undefined) {
            const statusElement = this.configElements.gpsStatus;
            const qualityText = ['No Fix', 'GPS', 'DGPS', 'PPS', 'RTK', 'Float RTK', 'Dead Reckoning', 'Manual', 'Simulation'][gpsData.quality] || 'Unknown';
            statusElement.textContent = qualityText;
            statusElement.className = `status-badge ${gpsData.quality > 0 ? 'valid' : 'invalid'}`;
            this.animateConfigUpdate(statusElement);
        }
        
        if (gpsData.mode !== undefined) {
            const statusElement = this.configElements.gpsStatus;
            const modeText = ['No Fix', 'No Fix', '2D Fix', '3D Fix'][gpsData.mode] || 'Unknown';
            statusElement.textContent = modeText;
            statusElement.className = `status-badge ${gpsData.mode > 1 ? 'valid' : 'invalid'}`;
            this.animateConfigUpdate(statusElement);
        }
        
        if (gpsData.satellites !== undefined) {
            this.configElements.gpsSatellites.textContent = gpsData.satellites;
            this.animateConfigUpdate(this.configElements.gpsSatellites);
        }
        
        if (gpsData.activeSatellites !== undefined) {
            const current = this.configElements.gpsSatellites.textContent;
            const display = current.includes('/') ? 
                           `${gpsData.activeSatellites}/${current.split('/')[1]}` : 
                           `${gpsData.activeSatellites}`;
            this.configElements.gpsSatellites.textContent = display;
            this.animateConfigUpdate(this.configElements.gpsSatellites);
        }
        
        if (gpsData.antennaStatus !== undefined) {
            this.configElements.gpsAntenna.textContent = gpsData.antennaStatus;
            this.configElements.gpsAntenna.className = `status-badge ${gpsData.antennaStatusClass || 'invalid'}`;
            this.animateConfigUpdate(this.configElements.gpsAntenna);
        }
        
        if (gpsData.jammingStatus !== undefined) {
            this.configElements.gpsJamming.textContent = gpsData.jammingStatus;
            this.configElements.gpsJamming.className = `status-badge ${gpsData.jammingStatusClass || 'invalid'}`;
            this.animateConfigUpdate(this.configElements.gpsJamming);
        }
        
        if (gpsData.latitude !== undefined && gpsData.latitude !== null) {
            this.configElements.gpsLatitude.textContent = gpsData.latitude + '°';
            this.animateConfigUpdate(this.configElements.gpsLatitude);
        }
        
        if (gpsData.longitude !== undefined && gpsData.longitude !== null) {
            this.configElements.gpsLongitude.textContent = gpsData.longitude + '°';
            this.animateConfigUpdate(this.configElements.gpsLongitude);
        }
        
        if (gpsData.altitude !== undefined && !isNaN(gpsData.altitude)) {
            this.configElements.gpsAltitude.textContent = gpsData.altitude.toFixed(1) + 'm';
            this.animateConfigUpdate(this.configElements.gpsAltitude);
        }
        
        if (gpsData.timestamp) {
            const timeStr = gpsData.timestamp.toLocaleTimeString();
            this.configElements.gpsTimestamp.textContent = timeStr;
            this.animateConfigUpdate(this.configElements.gpsTimestamp);
        }
        
        if (gpsData.gpsTime) {
            // Display GPS time from GNZDA message
            const gpsTimeStr = new Date(gpsData.gpsTime).toLocaleString();
            this.configElements.gpsTime.textContent = gpsTimeStr;
            this.animateConfigUpdate(this.configElements.gpsTime);
        }
        
        if (gpsData.speedKnots !== undefined && !isNaN(gpsData.speedKnots)) {
            this.configElements.gpsSpeed.textContent = gpsData.speedKnots.toFixed(1) + ' knots';
            this.animateConfigUpdate(this.configElements.gpsSpeed);
        }
        
        if (gpsData.course !== undefined && !isNaN(gpsData.course)) {
            this.configElements.gpsCourse.textContent = gpsData.course.toFixed(1) + '°';
            this.animateConfigUpdate(this.configElements.gpsCourse);
        }
        
        if (gpsData.magneticVariation !== undefined && !isNaN(gpsData.magneticVariation)) {
            const varText = gpsData.magneticVariation.toFixed(1) + '°' + 
                          (gpsData.magneticVariationDirection ? ' ' + gpsData.magneticVariationDirection : '');
            this.configElements.gpsMagVar.textContent = varText;
            this.animateConfigUpdate(this.configElements.gpsMagVar);
        }
        
        // Log GPS updates for debugging
        const updateFields = Object.keys(gpsData).filter(key => key !== 'timestamp');
        if (updateFields.length > 0) {
            this.log(`🛰️ GPS updated: ${updateFields.join(', ')}`, 'info');
        }
    }

    animateConfigUpdate(element) {
        const configItem = element.closest('.config-item');
        if (configItem) {
            configItem.classList.remove('updated');
            setTimeout(() => configItem.classList.add('updated'), 10);
        }
    }

    clearConfigDisplay() {
        // Clear configuration fields
        this.configElements.band.value = '';
        this.configElements.channel.value = '';
        this.configElements.correction.textContent = '-';
        this.configElements.callsign.value = '';
        this.configElements.callsignOk.textContent = '-';
        this.configElements.callsignOk.className = 'status-badge';
        
        // Clear temperature fields
        this.configElements.tempValue.textContent = '-';
        this.configElements.tempTimestamp.textContent = '-';
        
        // Clear GPS fields
        this.configElements.gpsStatus.textContent = '-';
        this.configElements.gpsStatus.className = 'status-badge';
        this.configElements.gpsSatellites.textContent = '-';
        this.configElements.gpsAntenna.textContent = '-';
        this.configElements.gpsAntenna.className = 'status-badge';
        this.configElements.gpsJamming.textContent = '-';
        this.configElements.gpsJamming.className = 'status-badge';
        this.configElements.gpsLatitude.textContent = '-';
        this.configElements.gpsLongitude.textContent = '-';
        this.configElements.gpsAltitude.textContent = '-';
        this.configElements.gpsTimestamp.textContent = '-';
        this.configElements.gpsTime.textContent = '-';
        this.configElements.gpsSpeed.textContent = '-';
        this.configElements.gpsCourse.textContent = '-';
        this.configElements.gpsMagVar.textContent = '-';
        
        // Clear change indicators
        this.clearChangeIndicators();
    }

    onConfigFieldChange() {
        this.updateChangeIndicators();
        this.validateConfig();
    }

    updateChangeIndicators() {
        const hasChanges = this.hasConfigChanges();
        this.saveConfigBtn.disabled = !this.isConnected || !hasChanges || this.hasConfigErrors();
        
        // Update visual indicators
        ['band', 'channel', 'callsign'].forEach(field => {
            const element = this.configElements[field];
            const originalValue = this.originalConfig[field];
            const currentValue = element.value;
            
            element.classList.remove('changed');
            if (originalValue !== undefined && currentValue !== originalValue) {
                element.classList.add('changed');
            }
        });
    }

    hasConfigChanges() {
        return ['band', 'channel', 'callsign'].some(field => {
            const currentValue = this.configElements[field].value;
            const originalValue = this.originalConfig[field];
            return originalValue !== undefined && currentValue !== originalValue;
        });
    }

    hasConfigErrors() {
        return ['band', 'channel', 'callsign'].some(field => {
            return this.configElements[field].classList.contains('error');
        });
    }

    clearChangeIndicators() {
        ['band', 'channel', 'callsign'].forEach(field => {
            this.configElements[field].classList.remove('changed', 'error', 'valid');
        });
        this.saveConfigBtn.disabled = !this.isConnected;
    }

    validateConfig() {
        this.validateCallsign();
        this.validateChannel();
        this.validateBand();
    }

    validateCallsign() {
        const callsign = this.configElements.callsign.value.toUpperCase();
        const element = this.configElements.callsign;
        
        element.classList.remove('error', 'valid');
        
        if (callsign === '') {
            return; // Empty is OK
        }
        
        // Basic callsign validation (alphanumeric, 3-10 characters)
        const callsignRegex = /^[A-Z0-9]{3,10}$/;
        if (callsignRegex.test(callsign)) {
            element.classList.add('valid');
            // Auto-uppercase
            if (element.value !== callsign) {
                element.value = callsign;
            }
        } else {
            element.classList.add('error');
        }
    }

    validateChannel() {
        const channel = parseInt(this.configElements.channel.value);
        const element = this.configElements.channel;
        
        element.classList.remove('error', 'valid');
        
        if (isNaN(channel)) {
            if (this.configElements.channel.value !== '') {
                element.classList.add('error');
            }
            return;
        }
        
        if (channel >= 0 && channel <= 599) {
            element.classList.add('valid');
        } else {
            element.classList.add('error');
        }
    }

    validateBand() {
        const band = this.configElements.band.value;
        const element = this.configElements.band;
        
        element.classList.remove('error', 'valid');
        
        if (band && band !== '') {
            element.classList.add('valid');
        }
    }

    async saveConfig() {
        if (!this.isConnected || this.hasConfigErrors()) {
            this.showError('Cannot save: invalid configuration');
            return;
        }

        const config = {
            type: 'REQ_SET_CONFIG',
            band: this.configElements.band.value,
            channel: parseInt(this.configElements.channel.value),
            callsign: this.configElements.callsign.value.toUpperCase(),
            correction: this.originalConfig.correction || 0
        };

        this.log('💾 Saving configuration...', 'info');
        
        try {
            await this.sendMessage(JSON.stringify(config));
            
            // Update original config to reflect saved state
            this.originalConfig.band = config.band;
            this.originalConfig.channel = config.channel;
            this.originalConfig.callsign = config.callsign;
            
            this.clearChangeIndicators();
            this.log('✅ Configuration saved successfully', 'info');
            
        } catch (error) {
            this.showError('Failed to save configuration: ' + error.message);
        }
    }

    populateBandSelector() {
        const bandSelect = this.configElements.band;
        
        // Clear existing options except the placeholder
        bandSelect.innerHTML = '<option value="">-</option>';
        
        // Add options from bandDataList
        this.bandDataList.forEach(bandData => {
            const option = document.createElement('option');
            option.value = bandData.band;
            option.textContent = `${bandData.band} (${(bandData.freq / 1000).toFixed(1)} kHz)`;
            bandSelect.appendChild(option);
        });
        
        this.log('📡 Band selector populated with ' + this.bandDataList.length + ' bands', 'info');
    }

    async requestConfig() {
        if (!this.isConnected) {
            this.showError('Not connected to device');
            return;
        }

        try {
            const message = JSON.stringify({ type: "REQ_GET_CONFIG" });
            await this.sendMessage(message);
            this.log('📡 Requesting device configuration...', 'info');
        } catch (error) {
            this.showError('Failed to request configuration: ' + error.message);
        }
    }

    async refreshConfig() {
        await this.requestConfig();
    }

    updateConfigDisplay(config) {
        if (config.band !== undefined) {
            this.configElements.band.value = config.band;
            this.originalConfig.band = config.band;
            this.animateConfigUpdate(this.configElements.band);
        }
        
        if (config.channel !== undefined) {
            this.configElements.channel.value = config.channel;
            this.originalConfig.channel = config.channel;
            this.animateConfigUpdate(this.configElements.channel);
        }
        
        if (config.correction !== undefined) {
            this.configElements.correction.textContent = config.correction;
            this.originalConfig.correction = config.correction;
            this.animateConfigUpdate(this.configElements.correction);
        }
        
        if (config.callsign !== undefined) {
            this.configElements.callsign.value = config.callsign;
            this.originalConfig.callsign = config.callsign;
            this.animateConfigUpdate(this.configElements.callsign);
        }
        
        if (config.callsignOk !== undefined) {
            const isValid = config.callsignOk;
            this.configElements.callsignOk.textContent = isValid ? 'Valid' : 'Invalid';
            this.configElements.callsignOk.className = `status-badge ${isValid ? 'valid' : 'invalid'}`;
            this.originalConfig.callsignOk = isValid;
            this.animateConfigUpdate(this.configElements.callsignOk);
        }
        
        // Clear any change indicators since we just received fresh data
        this.clearChangeIndicators();
        
        this.log('📡 Configuration updated', 'info');
    }

    updateTempDisplay(tempData) {
        if (tempData.temp !== undefined || tempData.temperature !== undefined) {
            const temp = tempData.temp || tempData.temperature;
            this.configElements.tempValue.textContent = `${temp}°C`;
            
            // Apply temperature-based styling
            const tempItem = this.configElements.tempValue.closest('.config-item');
            if (tempItem) {
                tempItem.classList.remove('temp-warning', 'temp-critical');
                
                if (temp > 70) {
                    tempItem.classList.add('temp-critical');
                } else if (temp > 50) {
                    tempItem.classList.add('temp-warning');
                }
            }
            
            this.animateConfigUpdate(this.configElements.tempValue);
        }
        
        if (tempData.timestamp || tempData.time) {
            const timestamp = tempData.timestamp || tempData.time;
            const timeStr = timestamp instanceof Date ? 
                          timestamp.toLocaleTimeString() : 
                          new Date(timestamp).toLocaleTimeString();
            this.configElements.tempTimestamp.textContent = timeStr;
            this.animateConfigUpdate(this.configElements.tempTimestamp);
        } else {
            // Use current time if no timestamp provided
            this.configElements.tempTimestamp.textContent = new Date().toLocaleTimeString();
            this.animateConfigUpdate(this.configElements.tempTimestamp);
        }
    }

    parseZdaMessage(parts) {
        // $GNZDA,time,day,month,year,local_hour_offset,local_minute_offset*checksum
        // Format: $GNZDA,064951.000,26,05,2023,00,00*67
        // Where:
        // - Field 1: Time in HHMMSS.sss format
        // - Field 2: Day (01-31)
        // - Field 3: Month (01-12)
        // - Field 4: Year (4 digits)
        // - Field 5: Local zone hours offset
        // - Field 6: Local zone minutes offset
        
        if (parts.length >= 7) {
            const time = parts[1];
            const day = parseInt(parts[2]);
            const month = parseInt(parts[3]);
            const year = parseInt(parts[4]);
            const localHourOffset = parseInt(parts[5]);
            const localMinuteOffset = parseInt(parts[6]);
            
            // Parse time (HHMMSS.sss)
            if (time && time.length >= 6) {
                const hours = parseInt(time.substring(0, 2));
                const minutes = parseInt(time.substring(2, 4));
                const seconds = parseFloat(time.substring(4));
                
                // Create UTC date object
                if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                    !isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
                    
                    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, Math.floor(seconds)));
                    
                    // Store GPS date/time information
                    this.gpsDateTime = {
                        utcDate: utcDate,
                        localHourOffset: !isNaN(localHourOffset) ? localHourOffset : 0,
                        localMinuteOffset: !isNaN(localMinuteOffset) ? localMinuteOffset : 0,
                        timestamp: new Date()
                    };
                    
                    // Update GPS display with time information
                    this.updateGpsDisplay({
                        gpsTime: utcDate.toISOString(),
                        timestamp: new Date()
                    });
                    
                    // Log the GPS time
                    this.log(`🕐 GPS Time: ${utcDate.toISOString()} (UTC)`, 'info');
                }
            }
        }
    }
}

// Initialize the configurator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Device Configurator loaded successfully!');
    console.log('💡 WebSerial support:', 'serial' in navigator ? 'Available' : 'Not available');
    
    const configurator = new DeviceConfigurator();
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 200);
    });
});

// Export for debugging
window.DeviceConfigurator = DeviceConfigurator;
