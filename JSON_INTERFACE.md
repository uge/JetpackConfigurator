# JSON Interface Documentation

This document describes the JSON-based API interface extracted from the vendor projects (picoinf and TraquitoJetpack). The interface uses a `RegisterHandler` pattern with request/response message types.

## Interface Overview

The JSON interface is implemented through `JSONMsgRouter::RegisterHandler()` calls that register message handlers for specific message types. Each handler receives an input JSON object (`in`) and produces an output JSON object (`out`).

### Message Pattern
- **Request messages**: Typically start with `REQ_`
- **Response messages**: Typically start with `REP_`
- **Shell commands**: Use `SHELL_COMMAND` type

## Core System Messages

### REQ_PING
Basic ping message for connectivity testing.

**Request:**
```json
{
  "type": "REQ_PING"
}
```

**Response:**
```json
{
  "type": "REP_PING",
  "timeNow": <microseconds_timestamp>
}
```

### REQ_PINGX
Extended ping message.

**Request:**
```json
{
  "type": "REQ_PINGX"
}
```

**Response:**
```json
{
  "type": "REP_PINGX",
  "timeNow": <microseconds_timestamp>
}
```

### REQ_SYS_RESET
System reset command.

**Request:**
```json
{
  "type": "REQ_SYS_RESET"
}
```

**Response:** None (system resets)

### REQ_SYS_BOOTLOADER
Reset system to bootloader mode.

**Request:**
```json
{
  "type": "REQ_SYS_BOOTLOADER"
}
```

**Response:** None (system enters bootloader)

### REQ_GET_DEVICE_INFO
Get device information.

**Request:**
```json
{
  "type": "REQ_GET_DEVICE_INFO"
}
```

**Response:**
```json
{
  "type": "REP_GET_DEVICE_INFO",
  "swVersion": "<software_version>",
  "mode": "API" | "TRACKER"
}
```

### SHELL_COMMAND
Execute shell commands.

**Request:**
```json
{
  "type": "SHELL_COMMAND",
  "cmd": "<command_string>"
}
```

**Response:** Command output via logging

## Radio Control Messages

### REQ_RADIO_POWER_ON
Power on radio subsystem.

**Request:**
```json
{
  "type": "REQ_RADIO_POWER_ON"
}
```

**Response:** None

### REQ_RADIO_POWER_OFF
Power off radio subsystem.

**Request:**
```json
{
  "type": "REQ_RADIO_POWER_OFF"
}
```

**Response:** None

### REQ_RADIO_OUTPUT_ENABLE
Enable radio output.

**Request:**
```json
{
  "type": "REQ_RADIO_OUTPUT_ENABLE"
}
```

**Response:** None

### REQ_RADIO_OUTPUT_DISABLE
Disable radio output.

**Request:**
```json
{
  "type": "REQ_RADIO_OUTPUT_DISABLE"
}
```

**Response:** None

### REQ_SET_CONFIG_TEMP
Set temporary configuration (not saved).

**Request:**
```json
{
  "type": "REQ_SET_CONFIG_TEMP",
  "band": "<band_string>",
  "channel": <channel_number>,
  "correction": <frequency_correction>
}
```

**Response:** None

### REQ_RESTORE_CONFIG
Restore saved configuration.

**Request:**
```json
{
  "type": "REQ_RESTORE_CONFIG"
}
```

**Response:** None

### REQ_WSPR_SEND
Send WSPR message.

**Request:**
```json
{
  "type": "REQ_WSPR_SEND",
  "callsign": "<callsign>",
  "grid": "<grid_locator>",
  "power": <power_dbm>
}
```

**Response:**
```json
{
  "type": "REP_WSPR_SEND"
}
```

## Configuration Messages

### REQ_GET_CONFIG
Get current configuration.

**Request:**
```json
{
  "type": "REQ_GET_CONFIG"
}
```

**Response:**
```json
{
  "type": "REP_GET_CONFIG",
  "band": "<band_string>",
  "channel": <channel_number>,
  "callsign": "<callsign>",
  "correction": <frequency_correction>,
  "callsignOk": <boolean>
}
```

### REQ_SET_CONFIG
Set configuration.

**Request:**
```json
{
  "type": "REQ_SET_CONFIG",
  "band": "<band_string>",
  "channel": <channel_number>,
  "callsign": "<callsign>",
  "correction": <frequency_correction>
}
```

**Response:**
```json
{
  "type": "REP_SET_CONFIG",
  "ok": <boolean>
}
```

## GPS Control Messages

### REQ_GPS_RESET
Reset GPS module.

**Request:**
```json
{
  "type": "REQ_GPS_RESET",
  "temp": "hot" | "warm" | "cold"
}
```

**Response:** None

### REQ_GPS_POWER_ON
Power on GPS module.

**Request:**
```json
{
  "type": "REQ_GPS_POWER_ON"
}
```

**Response:** None

### REQ_GPS_POWER_OFF_BATT_ON
Power off GPS module but keep battery backup.

**Request:**
```json
{
  "type": "REQ_GPS_POWER_OFF_BATT_ON"
}
```

**Response:** None

### REQ_GPS_POWER_OFF
Power off GPS module completely.

**Request:**
```json
{
  "type": "REQ_GPS_POWER_OFF"
}
```

**Response:** None

## Message Definition Messages

### REQ_GET_MSG_DEF
Get message definition.

**Request:**
```json
{
  "type": "REQ_GET_MSG_DEF",
  "name": "<message_name>"
}
```

**Response:**
```json
{
  "type": "REP_GET_MSG_DEF",
  "name": "<message_name>",
  "msgDef": "<message_definition>"
}
```

### REQ_SET_MSG_DEF
Set message definition.

**Request:**
```json
{
  "type": "REQ_SET_MSG_DEF",
  "name": "<message_name>",
  "msgDef": "<message_definition>"
}
```

**Response:**
```json
{
  "type": "REP_SET_MSG_DEF",
  "name": "<message_name>",
  "ok": <boolean>
}
```

## JavaScript Control Messages

### REQ_GET_JS
Get JavaScript code.

**Request:**
```json
{
  "type": "REQ_GET_JS",
  "name": "<script_name>"
}
```

**Response:**
```json
{
  "type": "REP_GET_JS",
  "name": "<script_name>",
  "script": "<javascript_code>"
}
```

### REQ_SET_JS
Set JavaScript code.

**Request:**
```json
{
  "type": "REQ_SET_JS",
  "name": "<script_name>",
  "script": "<javascript_code>"
}
```

**Response:**
```json
{
  "type": "REP_SET_JS",
  "name": "<script_name>",
  "ok": <boolean>
}
```

### REQ_PARSE_JS
Parse JavaScript code.

**Request:**
```json
{
  "type": "REQ_PARSE_JS",
  "name": "<script_name>",
  "script": "<javascript_code>"
}
```

**Response:**
```json
{
  "type": "REP_PARSE_JS",
  "name": "<script_name>",
  "ok": <boolean>,
  "err": "<error_message>",
  "parseMs": <parse_time_ms>,
  "vmOverheadMs": <vm_overhead_ms>
}
```

### REQ_RUN_JS
Run JavaScript code.

**Request:**
```json
{
  "type": "REQ_RUN_JS",
  "name": "<script_name>",
  "script": "<javascript_code>"
}
```

**Response:**
```json
{
  "type": "REP_RUN_JS",
  "name": "<script_name>",
  "parseOk": <boolean>,
  "parseErr": "<parse_error>",
  "parseMs": <parse_time_ms>,
  "runOk": <boolean>,
  "runErr": "<run_error>",
  "runMs": <run_time_ms>,
  "runMemUsed": <memory_used_bytes>,
  "runMemAvail": <memory_available_bytes>,
  "usesAPIGPS": <boolean>,
  "usesAPIMsg": <boolean>
}
```

## Implementation Notes

1. **Message Routing**: All messages are routed through `JSONMsgRouter::RegisterHandler()`
2. **Response Pattern**: Response messages typically echo the request type with `REP_` prefix
3. **Error Handling**: Some responses include `ok` boolean field for success/failure indication
4. **Logging**: Most handlers log the received message type for debugging
5. **Asynchronous**: Some commands (like reset) don't provide immediate responses
6. **Memory Management**: JavaScript execution includes memory usage statistics

## Data Types

- `<boolean>`: true/false
- `<string>`: Text string
- `<number>`: Integer or floating point number
- `<microseconds_timestamp>`: 64-bit microsecond timestamp
- `<channel_number>`: 16-bit unsigned integer (0-65535)
- `<frequency_correction>`: 32-bit signed integer
- `<power_dbm>`: 8-bit unsigned integer (0-255)

## Usage Example

```javascript
// Send a ping request
const request = {
  type: "REQ_PING"
};

// Expected response
const response = {
  type: "REP_PING",
  timeNow: 1234567890123456
};
```

## Error Handling

The interface generally uses:
- `ok` field in responses to indicate success/failure
- `err` field for error messages
- Logging for debugging information
- Some commands may reset the system on failure
