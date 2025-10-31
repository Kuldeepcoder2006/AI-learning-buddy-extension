
// --- Context Menu Setup ---

// Create the context menu item upon installation.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explain-with-ai-buddy",
    title: "Explain with AI Buddy",
    contexts: ["selection"] // This makes the menu item appear only when text is selected
  });
});

// --- Main Logic ---

// Listen for clicks on the context menu item.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explain-with-ai-buddy" && info.selectionText) {
    // Check if an API key is stored.
    chrome.storage.sync.get(['apiKey'], (result) => {
      if (result.apiKey) {
        // A key exists, proceed to explain the text.
        explainText(info.selectionText, result.apiKey);
      } else {
        // No API key found, open the options page for the user to set it.
        // This is a user-friendly way to prompt for configuration.
        chrome.runtime.openOptionsPage();
      }
    });
  }
});

// Function to call the Gemini API and handle the response.
async function explainText(selectedText, apiKey) {
  // Construct the API URL with the user-provided key.
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // First, open the popup window in a loading state.
  await createPopupWithInitialState(selectedText);

  try {
    // Construct the prompt for the Gemini API.
    const prompt = `Explain the following text in simple, clear terms, as if you were explaining it to a 15-year-old. Focus on the core concepts and avoid jargon.

Text to explain:
---
"${selectedText}"
---

Simplified Explanation:`;

    // Make the API call using fetch.
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
       // If the API key is invalid, the user often gets a 400 error.
       // We provide a helpful message pointing them to the options page.
      if (response.status === 400) {
           throw new Error(`API Error: ${response.status}. Your API key might be invalid. Please check it in the extension options.`);
      }
      const errorBody = await response.json();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody.error.message}`);
    }

    const data = await response.json();
    
    // Extract the explanation text from the API response.
    const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get an explanation. Please try again.";

    // Save the final explanation to storage. The popup will automatically update.
    chrome.storage.local.set({ 
      explanation: explanation, 
      isLoading: false 
    });

  } catch (error) {
    console.error("AI Learning Buddy Error:", error);
    // Save the error message to storage to display it in the popup.
    chrome.storage.local.set({
      explanation: `An error occurred: ${error.message}`,
      isLoading: false
    });
  }
}

// --- Popup Window Management ---

let windowId = null;

// Creates a new popup window or focuses an existing one.
async function createPopupWithInitialState(originalText) {
  // Clear any previous results before starting a new request.
  await chrome.storage.local.set({
    originalText: originalText,
    explanation: "",
    isLoading: true
  });

  const popupOptions = {
    url: 'popup.html',
    type: 'popup',
    width: 450,
    height: 500,
  };

  if (windowId !== null) {
    // If a window is already open, try to focus it.
    chrome.windows.get(windowId, {}, (win) => {
      if (chrome.runtime.lastError) {
        // The window doesn't exist anymore, create a new one.
        chrome.windows.create(popupOptions, (win) => {
          if (win) windowId = win.id;
        });
      } else {
        // Window exists, update and focus it.
        chrome.windows.update(windowId, { focused: true });
      }
    });
  } else {
    // No window open, create a new one.
    chrome.windows.create(popupOptions, (win) => {
      if (win) windowId = win.id;
    });
  }
}

// Listen for when the popup window is closed and reset the windowId.
chrome.windows.onRemoved.addListener((closedWindowId) => {
  if (closedWindowId === windowId) {
    windowId = null;
    // Clean up storage when the popup is closed.
    chrome.storage.local.remove(['originalText', 'explanation', 'isLoading']);
  }
});
