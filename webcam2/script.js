// Get references to the HTML elements
const videoElement = document.getElementById('webcamFeed');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const messageBox = document.getElementById('messageBox');

// References for specs display
const settingsStatus = document.getElementById('settingsStatus');
const activeResolution = document.getElementById('activeResolution');
const activeFrameRate = document.getElementById('activeFrameRate');
const activeAspectRatio = document.getElementById('activeAspectRatio');
const activeFacingMode = document.getElementById('activeFacingMode');

const capResolutions = document.getElementById('capResolutions');
const capFrameRates = document.getElementById('capFrameRates');
const capAspectRatios = document.getElementById('capAspectRatios');
const capFacingModes = document.getElementById('capFacingModes');


// Variable to store the MediaStream object
let currentStream;

/**
 * Displays a message in the message box.
 * @param {string} message The message to display.
 * @param {string} type The type of message (e.g., 'success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    // Clear previous type classes
    messageBox.className = 'message-box show';
    // Add type-specific classes for styling
    if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700', 'border-red-400');
    } else if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-700', 'border-green-400');
    } else { // info
        messageBox.classList.add('bg-blue-100', 'text-blue-700', 'border-blue-400');
    }
}

/**
 * Hides the message box.
 */
function hideMessageBox() {
    messageBox.classList.remove('show', 'bg-red-100', 'text-red-700', 'border-red-400', 'bg-green-100', 'text-green-700', 'border-green-400', 'bg-blue-100', 'text-blue-700', 'border-blue-400');
    messageBox.textContent = '';
}

/**
 * Updates the displayed active stream settings.
 */
function updateActiveSettings() {
    if (currentStream && currentStream.getVideoTracks().length > 0) {
        const videoTrack = currentStream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();

        settingsStatus.textContent = 'Active';
        settingsStatus.classList.remove('text-gray-500');
        settingsStatus.classList.add('text-green-600', 'font-bold');

        activeResolution.textContent = `${settings.width || 'N/A'}x${settings.height || 'N/A'}`;
        activeFrameRate.textContent = `${settings.frameRate ? settings.frameRate.toFixed(2) : 'N/A'}`;
        activeAspectRatio.textContent = settings.aspectRatio ? settings.aspectRatio.toFixed(4) : 'N/A';
        activeFacingMode.textContent = settings.facingMode || 'N/A';
    } else {
        settingsStatus.textContent = 'Not active';
        settingsStatus.classList.add('text-gray-500');
        settingsStatus.classList.remove('text-green-600', 'font-bold');

        activeResolution.textContent = 'N/A';
        activeFrameRate.textContent = 'N/A';
        activeAspectRatio.textContent = 'N/A';
        activeFacingMode.textContent = 'N/A';
    }
}

/**
 * Updates the displayed device capabilities.
 */
function updateDeviceCapabilities(track) {
    if (track) {
        const capabilities = track.getCapabilities();

        // Resolutions
        if (capabilities.width && capabilities.height) {
            let resolutions = [];
            if (capabilities.width.min && capabilities.height.min && capabilities.width.max && capabilities.height.max) {
                 resolutions.push(`Min: ${capabilities.width.min}x${capabilities.height.min}`);
                 resolutions.push(`Max: ${capabilities.width.max}x${capabilities.height.max}`);
            }
            // If it also supports discrete resolutions, list them.
            // This part is tricky as getCapabilities might not list all discrete options directly.
            // For simplicity, we just show min/max range for now.
            capResolutions.textContent = resolutions.join(', ') || 'Range N/A';
        } else {
            capResolutions.textContent = 'N/A';
        }

        // Frame Rates
        if (capabilities.frameRate) {
            capFrameRates.textContent = `Min: ${capabilities.frameRate.min.toFixed(2)}, Max: ${capabilities.frameRate.max.toFixed(2)}`;
        } else {
            capFrameRates.textContent = 'N/A';
        }

        // Aspect Ratios
        if (capabilities.aspectRatio) {
            capAspectRatios.textContent = `Min: ${capabilities.aspectRatio.min.toFixed(4)}, Max: ${capabilities.aspectRatio.max.toFixed(4)}`;
        } else {
            capAspectRatios.textContent = 'N/A';
        }

        // Facing Modes
        if (capabilities.facingMode && capabilities.facingMode.length > 0) {
            capFacingModes.textContent = capabilities.facingMode.join(', ');
        } else {
            capFacingModes.textContent = 'N/A';
        }
    } else {
        capResolutions.textContent = 'N/A';
        capFrameRates.textContent = 'N/A';
        capAspectRatios.textContent = 'N/A';
        capFacingModes.textContent = 'N/A';
    }
}


/**
 * Starts the webcam feed.
 */
async function startWebcam() {
    hideMessageBox(); // Clear any previous messages
    try {
        // Request access to the user's media devices (video only)
        currentStream = await navigator.mediaDevices.getUserMedia({ video: true });

        // Attach the MediaStream to the video element
        videoElement.srcObject = currentStream;

        // Listen for when the video metadata is loaded to ensure settings are available
        videoElement.onloadedmetadata = () => {
            updateActiveSettings();
            if (currentStream && currentStream.getVideoTracks().length > 0) {
                updateDeviceCapabilities(currentStream.getVideoTracks()[0]);
            }
        };

        // Enable the stop button and disable the start button
        startButton.disabled = true;
        stopButton.disabled = false;
        showMessage('Webcam started successfully! Displaying current settings and capabilities.', 'success');

    } catch (err) {
        // Handle errors, e.g., user denied permission or no camera found
        console.error('Error accessing webcam:', err);
        if (err.name === 'NotAllowedError') {
            showMessage('Permission to access webcam denied. Please allow camera access in your browser settings.', 'error');
        } else if (err.name === 'NotFoundError') {
            showMessage('No webcam found. Please ensure a webcam is connected and working.', 'error');
        } else {
            showMessage(`An error occurred: ${err.message}`, 'error');
        }
        updateActiveSettings(); // Reset settings display
        updateDeviceCapabilities(null); // Clear capabilities display
    }
}

/**
 * Stops the webcam feed.
 */
function stopWebcam() {
    if (currentStream) {
        // Stop all tracks in the MediaStream
        currentStream.getTracks().forEach(track => {
            track.stop();
        });
        // Clear the video element's source
        videoElement.srcObject = null;
        currentStream = null; // Clear the stream variable

        // Enable the start button and disable the stop button
        startButton.disabled = false;
        stopButton.disabled = true;
        showMessage('Webcam stopped.', 'info');
        updateActiveSettings(); // Reset settings display
        updateDeviceCapabilities(null); // Clear capabilities display
    } else {
        showMessage('Webcam is not active.', 'info');
    }
}

// Add event listeners to the buttons
startButton.addEventListener('click', startWebcam);
stopButton.addEventListener('click', stopWebcam);

// Initial state: stop button is disabled and specs are N/A
stopButton.disabled = true;
updateActiveSettings(); // Initialize with N/A
updateDeviceCapabilities(null); // Initialize with N/A