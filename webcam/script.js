// Get references to the HTML elements
        const videoElement = document.getElementById('webcam');
        const startButton = document.getElementById('startButton');
        const stopButton = document.getElementById('stopButton');
        const statusElement = document.getElementById('status');
        const fpsDisplay = document.getElementById('fpsDisplay');

        // This will hold the stream from the webcam
        let stream = null;
        
        // --- FPS Calculation variables ---
        let frameCount = 0;
        let lastTime = performance.now();
        let animationFrameId = null;

        /**
         * Calculates and updates the FPS display.
         * This function is called recursively via requestAnimationFrame.
         */
        function updateFPS() {
            // Increment the frame count
            frameCount++;
            const now = performance.now();
            const delta = now - lastTime;

            // Update the FPS display every second
            if (delta >= 1000) {
                const fps = (frameCount / delta) * 1000;
                fpsDisplay.textContent = Math.round(fps);
                frameCount = 0;
                lastTime = now;
            }
            
            // Continue the loop
            animationFrameId = requestAnimationFrame(updateFPS);
        }

        // --- Event Listeners ---

        // Add a click event listener to the start button
        startButton.addEventListener('click', async () => {
            // Clear any previous error messages
            statusElement.textContent = '';
            try {
                // Request access to the user's webcam.
                stream = await navigator.mediaDevices.getUserMedia({ video: true });

                // If successful, set the video element's source to the stream
                videoElement.srcObject = stream;
                
                // Update button states
                startButton.disabled = true;
                stopButton.disabled = false;

                // Start the FPS counter loop
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                }
                animationFrameId = requestAnimationFrame(updateFPS);

            } catch (error) {
                // Handle errors
                console.error("Error accessing webcam:", error);
                let errorMessage = "Something went wrong accessing the webcam.";
                if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
                    errorMessage = "Permission to access the webcam was denied. Please allow access in your browser settings.";
                } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
                    errorMessage = "No webcam was found on your device.";
                }
                statusElement.textContent = errorMessage;
            }
        });

        // Add a click event listener to the stop button
        stopButton.addEventListener('click', () => {
            if (stream) {
                // Stop the FPS counter loop
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
                fpsDisplay.textContent = '0'; // Reset display

                // Get all tracks from the stream and stop them
                stream.getTracks().forEach(track => track.stop());

                // Clear the video source and reset the stream
                videoElement.srcObject = null;
                stream = null;

                // Update button states
                startButton.disabled = false;
                stopButton.disabled = true;
            }
        });