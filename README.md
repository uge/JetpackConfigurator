# Device Configurator

A modern web-based configurator for serial devices using the WebSerial API. This application allows you to connect to, configure, and test embedded devices through a clean web interface.

## Features

- 🔌 **WebSerial Integration**: Connect to USB serial devices directly from the browser
- 📡 **Real-time Communication**: Send and receive JSON messages with live logging
- 🎛️ **Device Control**: Full JSON API interface for device configuration
- 📊 **Connection Status**: Visual indicators for connection state and device info
- 🎨 **Modern UI**: Responsive design with smooth animations
- 📱 **Mobile Friendly**: Works on desktop, tablet, and mobile devices

## Device Support

This configurator is designed to work with devices that implement the JSON message interface documented in [JSON_INTERFACE.md](JSON_INTERFACE.md), including:

- **System Control**: Reset, bootloader mode, device info
- **Radio Control**: Power management, WSPR transmission
- **GPS Control**: Module power and reset operations
- **Configuration**: Get/set device parameters
- **JavaScript Engine**: Script management and execution

## Browser Requirements

- **Chrome 89+**
- **Edge 89+**
- **Opera 75+**

WebSerial API is **not supported** in Firefox or Safari.

## Project Structure

```
Configurator/
├── index.html          # Main application interface
├── styles.css          # Styling and animations
├── script.js           # WebSerial and device communication
├── README.md           # This file
├── JSON_INTERFACE.md   # Complete API documentation
└── vendor/             # Git submodules
    ├── picoinf/        # Core platform abstraction
    └── TraquitoJetpack/ # Radio and GPS functionality
```

## Getting Started

1. **Clone the repository** with submodules:
   ```bash
   git clone --recursive <repository-url>
   ```

2. **Open in a supported browser**:
   - Open `index.html` in Chrome, Edge, or Opera
   - Must be served over HTTPS for WebSerial to work

3. **Connect your device**:
   - Click "Connect Device" button
   - Select your serial device from the browser dialog
   - Device information will be displayed once connected

4. **Test communication**:
   - Use the "Send Ping" button for basic connectivity
   - Select predefined messages from the dropdown
   - Send custom JSON messages using the text area

## Usage

### Connecting to a Device

1. Ensure your device is connected via USB
2. Click the "Connect Device" button
3. Select your device from the browser's serial port dialog
4. The status indicator will show "Connected" when successful

### Sending Messages

The configurator supports multiple ways to send messages:

- **Quick Commands**: Use the dropdown to select common messages
- **Custom JSON**: Write your own JSON in the text area
- **Ping Test**: Quick connectivity test

### Message Logging

All communication is logged in real-time:
- **Blue arrows (▶)**: Sent messages
- **Green arrows (◀)**: Received messages  
- **Red text**: Error messages
- **Timestamps**: All messages include time stamps

## API Reference

See [JSON_INTERFACE.md](JSON_INTERFACE.md) for complete documentation of all supported messages and their parameters.

## Development

### Local Development

For development, you'll need to serve the files over HTTPS:

```bash
# Using Python
python -m http.server 8000 --bind 127.0.0.1

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S 127.0.0.1:8000
```

Then visit `https://127.0.0.1:8000` (note HTTPS requirement).

### Customization

- **Add new message types**: Update the dropdown in `index.html`
- **Modify styling**: Edit `styles.css` for visual changes
- **Extend functionality**: Add features to the `DeviceConfigurator` class in `script.js`

## Security

- WebSerial requires HTTPS (except for localhost)
- User must explicitly grant permission to access serial ports
- No automatic connections - user must click "Connect Device"

## Troubleshooting

### WebSerial Not Supported
- Make sure you're using Chrome, Edge, or Opera
- Firefox and Safari don't support WebSerial API

### Connection Failed
- Check that the device is properly connected
- Verify the device is not in use by another application
- Try a different USB cable or port

### No Messages Received
- Verify the device is sending data at 115200 baud
- Check that messages are newline-terminated
- Ensure JSON format matches the documented API

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to submit issues and pull requests to improve this template!

---

**Happy coding!** 🚀
