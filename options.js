
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('api-key');
    const saveBtn = document.getElementById('save-btn');
    const statusEl = document.getElementById('status');

    // Function to show a status message to the user.
    const showStatus = (message, isError = false) => {
        statusEl.textContent = message;
        statusEl.style.color = isError ? '#ef4444' : '#22c55e'; // Red-500 for error, Green-500 for success
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
    };

    // Load the saved API key when the options page is opened.
    chrome.storage.sync.get('apiKey', (data) => {
        if (data.apiKey) {
            apiKeyInput.value = data.apiKey;
        }
    });

    // Save the API key when the save button is clicked.
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            chrome.storage.sync.set({ apiKey: apiKey }, () => {
                showStatus('API key saved successfully!');
            });
        } else {
            showStatus('Please enter a valid API key.', true);
        }
    });
});
