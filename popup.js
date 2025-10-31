
document.addEventListener('DOMContentLoaded', () => {
    // Get references to the HTML elements that will display content.
    const originalTextElement = document.getElementById('original-text');
    const explanationElement = document.getElementById('explanation');
    const loaderElement = document.getElementById('loader');
    
    // Function to update the UI with the latest data from storage.
    const updateUI = (data) => {
        // Update the original text if it exists.
        if (data.originalText) {
            originalTextElement.textContent = data.originalText;
        }

        // Handle the loading state.
        if (data.isLoading) {
            loaderElement.classList.remove('hidden');
            explanationElement.classList.add('hidden');
        } else {
            loaderElement.classList.add('hidden');
            explanationElement.classList.remove('hidden');
        }
        
        // Update the explanation text.
        // We use innerHTML to render basic formatting like newlines from the AI.
        // Note: In a real-world app with untrusted input, this would be a security risk.
        // Here, we trust the output from the Gemini API. For enhanced security,
        // you would sanitize this HTML.
        if (data.explanation) {
            explanationElement.innerHTML = data.explanation.replace(/\n/g, '<br>');
        }
    };

    // --- Initial Load ---
    // Immediately try to load any existing data from storage when the popup opens.
    // This is useful if the API call finishes before the popup is fully rendered.
    chrome.storage.local.get(['originalText', 'explanation', 'isLoading'], (result) => {
        if (result) {
            updateUI(result);
        }
    });

    // --- Real-time Updates ---
    // Listen for changes in chrome.storage.local.
    // This allows the background script to update the popup's content in real-time
    // after the API call is complete.
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            const updatedData = {};
            // Reconstruct the state from the changes object.
            for (let [key, { newValue }] of Object.entries(changes)) {
                updatedData[key] = newValue;
            }
            
            // Fetch the full current state to ensure we have all data.
            chrome.storage.local.get(['originalText', 'explanation', 'isLoading'], (currentState) => {
                updateUI({ ...currentState, ...updatedData });
            });
        }
    });
});
