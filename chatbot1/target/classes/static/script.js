let pendingSuggestion = null;
let badWordCount = 0; // Track the number of bad words
const userState = {
    awaitingQuestionSelection: false,
    possibleQuestions: []
};
const badWords = ["fuck", "bitch"]; // List of bad words
let isBlocked = false; // Track if the user is blocked
let selectedPath = null; // Store the selected path
let editingMessage = null; // Store the message being edited
 
document.getElementById('send-btn').addEventListener('click', () => {
 
    const userInput = document.getElementById('user-input').value.trim();
 
    if (userInput) {
        const filteredInput = filterBadWords(userInput);
        if (editingMessage) {
            // Update the message being edited and start a new conversation
            updateMessage(filteredInput);
            editingMessage = null; // Clear the editing state
            clearFollowingMessages(); // Clear the Credobot's previous reply
        } else {
            addMessageToHistory(filteredInput, 'user-message', 'You');
        }
 
        if (pendingSuggestion) {
            handleSuggestionResponse(userInput);
        } else if (selectedPath && userInput.toLowerCase() === 'show files') {
            showFilesInPath();
        } else {
            handleUserInput(userInput);
        }
 
        document.getElementById('user-input').value = '';
    }
});
 
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-btn').click();
    }
});
 
function filterBadWords(input) {
    const cleanInput = input.split(' ').map(word =>
        badWords.includes(word.toLowerCase()) ? '*'.repeat(word.length) : word
    ).join(' ');
    return cleanInput;
}

// Function to filter files based on user input
async function showFilesInPath(path) {
    if (path) {
        addMessageToHistory("Fetching files...", 'bot-message', 'Credobot');

        // Remove existing file list containers completely
        const existingFileContainers = document.querySelectorAll('.file-list-container');
        if (existingFileContainers.length > 0) {
            existingFileContainers.forEach(el => {
                el.remove();  // Fully remove the container instead of just clearing its content
            });
        }

        try {
            const encodedPath = encodeURIComponent(path);
            const response = await fetch(`/api/files?path=${encodedPath}`);
            if (!response.ok) throw new Error('Network response was not ok.');
            const files = await response.json();

            if (files.length > 0) {
                const fileTableRows = files.map(file => {
                    const fileName = file.split('/').pop(); // Extract file name
                    const fileFormat = fileName.split('.').pop().toUpperCase(); // Extract file format

                    return `
                        <tr class="file-item">
                            <td class="file-name">
                                <div class="scrollable-file-name" title="${fileName}">${fileName}</div>
                            </td>
                            <td class="file-format" title="${fileFormat}">${fileFormat}</td>
                            <td><a href="${path.replace(/\\/g, '/')}/${file}" target="_blank">Open</a></td>
                        </tr>
                    `;
                }).join('');

                // Create the file table HTML
                const fileTable = `
                    <div class="file-list-container">
                        <div class="filter-container">
                            <input type="text" id="filter-input" class="file-filer-input" placeholder="Filter by alphanumeric or by format" oninput="filterFiles('${path}')">
                        </div>
                        <div class="table-wrapper">
                            <table id="file-table">
                                <thead>
                                    <tr>
                                        <th>File Name</th>
                                        <th>Format</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                     ${fileTableRows}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;

                simulateTyping(fileTable, 'bot-message', 'Credobot');
            } else {
                simulateTyping("No files found in the selected path.", 'bot-message', 'Credobot');
            }
        } catch (error) {
            console.log('Error fetching files:', error);
            simulateTyping("There was an error fetching the files. Please try again later.", 'bot-message', 'Credobot');
        }
    } else {
        simulateTyping("No path selected. Please select a path first.", 'bot-message', 'Credobot');
    }
}

function filterFiles(path) {
    const filterValue = document.getElementById('filter-input').value.toLowerCase();
    const fileItems = document.querySelectorAll('.file-item');
    let hasVisibleFiles = false;

    fileItems.forEach(item => {
        const fileName = item.querySelector('.file-name').textContent.toLowerCase();
        const fileFormat = item.querySelector('.file-format').textContent.toLowerCase();
        
        if (fileName.includes(filterValue) || fileFormat.includes(filterValue)) {
            item.style.display = '';
            hasVisibleFiles = true;
        } else {
            item.style.display = 'none';
        }
    });

    // Remove the previous 'no match' message if it exists
    let noMatchMessage = document.getElementById('no-file-match-message');
    if (noMatchMessage) {
        noMatchMessage.remove();
    }

    if (!hasVisibleFiles) {
        // Display a message when no files match the filter
        noMatchMessage = document.createElement('p');
        noMatchMessage.id = 'no-file-match-message';
        noMatchMessage.textContent = 'No Matched filters found for the filename or file format';
        noMatchMessage.style.color = 'red';
        noMatchMessage.style.padding = '10px';
        document.querySelector('.file-list-container').appendChild(noMatchMessage);
    }
}


// Function to display the welcome message with time-based greetings when the chatbot starts
function displayWelcomeMessage() {
    const currentHour = new Date().getHours();
    let greeting;

    if (currentHour >= 0 && currentHour < 12) {
        greeting = "Good Morning Chief, how can I assist you today?";
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = "Good Afternoon Chief, how can I assist you today?";
    } else {
        greeting = "Good Evening Chief, how can I assist you today?";
    }

    simulateTyping(greeting, 'bot-message', 'Credobot');
}

// Call the welcome message function when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    displayWelcomeMessage();
});


//clean input by removing special characters
function sanitizeInput(input) {
    return input.replace(/[^a-zA-Z0-9\s]/g, ''); // Allows only alphanumeric characters and spaces
}
 
async function handleUserInput(userInput) {
    const cleanInput = sanitizeInput(userInput.trim().toLowerCase());
 
    // Check for greetings
    const greetings = ["hi", "hey", "hello"];
    if (greetings.some(greet => cleanInput.includes(greet))) {
        simulateTyping("Hey Chief, how can I help you?", 'bot-message', 'Credobot');
        return;
    }
 
    // Check for greetings
    const greetingsTime = ["good morning"];
    if (greetingsTime.some(greet1 => cleanInput.includes(greet1))) {
        simulateTyping("Hey Chief,Good Morning how can I help you?", 'bot-message', 'Credobot');
        return;
    }
    // Check for greetings
    const greetingsTime2 = ["good afternoon"];
    if (greetingsTime2.some(greet2 => cleanInput.includes(greet2))) {
        simulateTyping("Hey Chief,Good Afternoon how can I help you?", 'bot-message', 'Credobot');
        return;
    }
    // Check for greetings
    const greetingsTime3 = ["good evening"];
    if (greetingsTime3.some(greet3 => cleanInput.includes(greet3))) {
        simulateTyping("Hey Chief,Good Evening how can I help you?", 'bot-message', 'Credobot');
        return;
    }
 
    // Check for positive responses
    const positiveResponses = ["good", "nice", "wow", "okay", "ok", "done"];
    if (positiveResponses.some(resp => cleanInput.includes(resp))) {
        simulateTyping("Glad to hear from you!", 'bot-message', 'Credobot');
        return;
    }
 
    // Check for positive responses
    const negativeResponses = ["sorry"];
    if (negativeResponses.some(resp2 => cleanInput.includes(resp2))) {
        simulateTyping("It's Okay, Feel Free to ask anything", 'bot-message', 'Credobot');
        return;
    }
 
    // Check for positive responses
    const positiveResponses2 = ["thanks", "nice job", "good work", "good job", "nice work"];
    if (positiveResponses2.some(resp3 => cleanInput.includes(resp3))) {
        simulateTyping("That's Nice to hear from you!", 'bot-message', 'Credobot');
        return;
    }
 
    // Check for positive responses
    const positiveResponses3 = ["haha", "hahaha", "ha ha", "ha ha ha"];
    if (positiveResponses3.some(resp4 => cleanInput.includes(resp4))) {
        simulateTyping("It's good to see your laugh today!!", 'bot-message', 'Credobot');
        return;
    }
 
 
    // Check for bad words
    if (badWords.some(badWord => cleanInput.includes(badWord))) {
        badWordCount++;
        handleBadWordUsage();
        return;
    }
 
    // Save the question or update the message being edited
    if (editingMessage) {
        updateMessage(cleanInput); // Update the message being edited
    } else {
        // Save the question and inform the user
        try {
            await saveQuestion(cleanInput); // Save cleaned question to the database
        } catch (error) {
            console.log('Error saving question:', error);
            simulateTyping("There was an error saving your question. Please try again later.", 'bot-message', 'Credobot');
        }
    }
    
    // Fetch answers from backend
    if (userState.awaitingQuestionSelection) {
        // User is selecting from multiple questions
        const selectedNumber = parseInt(userInput.trim(), 10);
        if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > userState.possibleQuestions.length) {
            simulateTyping("Invalid selection. Please select a valid option.", 'bot-message', 'Credobot');
            return;
        }
 
        const selectedQuestion = userState.possibleQuestions[selectedNumber - 1];
        await handleSelectedQuestion(selectedQuestion);
        userState.awaitingQuestionSelection = false;
        userState.possibleQuestions = [];
        return;
    }

    try {
    	        // Remove the previous question filter if it exists
        removeQuestionFilter();
    
        const response = await fetch(`/api/get-answer?input=${encodeURIComponent(userInput)}`);
        if (!response.ok) throw new Error('Network response was not ok.');
        const data = await response.json();

        if (Array.isArray(data)) {
            if (data.length === 1 && data[0].answer) {
                const answer = data[0].answer.trim();
                const label = data[0].label;
                
                let formattedAnswer;
                if (/^[a-zA-Z]:[\\/]/.test(answer) || /^[\\/]/.test(answer)) {
                    const formattedPath = answer.replace(/\\/g, '/');
                    formattedAnswer = `<a href="#" onclick="showFilesInPath('${formattedPath}')">${formattedPath}</a>`;
                } else {
                    const urlPattern = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g;
                    // Only include URLs in the answer if no label is provided
                    formattedAnswer = !label ? answer.replace(urlPattern, url => {
                        const formattedUrl = url.startsWith('http') ? url : `http://${url}`;
                        return `<a href="${formattedUrl}" target="_blank">${url}</a>`;
                    }) : '';
                }
                
                // Add label as clickable link if provided
                const labelLink = label ? `<a href="${answer}" target="_blank">${label}</a>` : '';
                simulateTyping(`${labelLink} ${formattedAnswer}`, 'bot-message', 'Credobot');
	        } else if (data.length > 1) {
	            userState.possibleQuestions = data;
	            userState.awaitingQuestionSelection = true;
	
                let responseMessage = `
                    <div class="message-container">
                        I found multiple questions for this keyword. Please select one option to continue:
                    </div>
                    <div class="scrollable-question-list">
                `;

                // Add filter input field
                responseMessage += `
					<input type="text" id="question-filter-input" class="question-filter-input" placeholder="Filter by AlphaNumeric.." oninput="filterQuestions()">
                `;

                data.forEach((item, index) => {
                    responseMessage += `<p class="question-item">${index + 1}. ${item.question}</p>`;
                });

	            
	            responseMessage += '</div>';
	
	            simulateTyping(responseMessage, 'bot-message', 'Credobot');
	        } else {
                simulateTyping("No answer found. Try asking in a different way.", 'bot-message', 'Credobot');
            }
        } else {
            simulateTyping(answerWithLinks(data), 'bot-message', 'Credobot');
        }
    } catch (error) {
        simulateTyping("Your question will be updated soon. Please try again later.", 'bot-message', 'Credobot');
        console.log('Error fetching answer:', error);
    }
}

// Function to remove the question filter input field
function removeQuestionFilter() {
    const existingFilter = document.getElementById('question-filter-input');
    if (existingFilter) {
        existingFilter.parentElement.innerHTML = `
            <p>Filtering option and listed questions were removed for the reason of Chat Length</p>
        `; 
    }
}


// Adding the filter functionality for multiple questions
function filterQuestions() {
    const filterValue = document.getElementById('question-filter-input').value.toLowerCase();
    const questionItems = document.querySelectorAll('.question-item');
    let hasVisibleQuestions = false;

    questionItems.forEach(item => {
        const questionText = item.textContent.toLowerCase();
        if (questionText.includes(filterValue)) {
            item.style.display = '';
            hasVisibleQuestions = true;
        } else {
            item.style.display = 'none';
        }
    });

    // Show message if no questions match the filter
    const noMatchMessage = document.getElementById('no-match-message'); 	
    if (noMatchMessage) {
        noMatchMessage.remove(); // Remove any existing no match message
    }

    if (!hasVisibleQuestions) {
        const message = document.createElement('p');
        message.id = 'no-match-message';
        message.textContent = 'No Matched filters found for this question';
        message.style.color = 'red'; // Optional: style for the message
        document.querySelector('.scrollable-question-list').appendChild(message);
    }
}

async function handleSelectedQuestion(selectedQuestion) {
    const answer = selectedQuestion.answer.trim();
    const label = selectedQuestion.label;

    let formattedAnswer;
    if (/^[a-zA-Z]:[\\/]/.test(answer) || /^[\\/]/.test(answer)) {
        const formattedPath = answer.replace(/\\/g, '/');
        formattedAnswer = `<a href="#" onclick="showFilesInPath('${formattedPath}')">${formattedPath}</a>`;
    } else {
        const urlPattern = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g;
        // Only include URLs in the answer if no label is provided
        formattedAnswer = !label ? answer.replace(urlPattern, url => {
            const formattedUrl = url.startsWith('http') ? url : `http://${url}`;
            return `<a href="${formattedUrl}" target="_blank">${url}</a>`;
        }) : '';
    }

    // Add label as clickable link if provided
    const labelLink = label ? `<a href="${answer}" target="_blank">${label}</a>` : '';
    simulateTyping(`${labelLink} ${formattedAnswer}`, 'bot-message', 'Credobot');
}

async function saveQuestion(question) {
    await fetch('/api/save-question', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
    });
}
 
 
function handleBadWordUsage() {
    if (badWordCount < 3) {
        simulateTyping("Warning: Please refrain from using inappropriate language.", 'bot-message', 'Credobot');
    } else {
        isBlocked = true; // Block the user
        document.getElementById('send-btn').disabled = true; // Disable button
        showBlockingMessage();
    }
}
 
function showBlockingMessage() {
    simulateTyping("You have been blocked from the chat usage due to inappropriate language.", 'bot-message', 'Credobot');
    startUnblockCountdown();
}
 
function startUnblockCountdown() {
    let seconds = 10;
    simulateTyping(`You will be unblocked in ${seconds} seconds...`, 'bot-message', 'Credobot');
 
    const interval = setInterval(() => {
        seconds--;
        document.querySelector('.chat-history').lastElementChild.textContent = `You will be unblocked in ${seconds} seconds...`;
        if (seconds === 0) {
            clearInterval(interval);
            isBlocked = false; // Unblock the user
            document.getElementById('send-btn').disabled = false; // Enable button
            simulateTyping("You have been unblocked. Please adhere to the chat rules.", 'bot-message', 'Credobot');
        }
    }, 1000);
}
 
function addMessageToHistory(message, className, sender) {
    const chatHistory = document.getElementById('chat-history');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${className}`;
    messageElement.innerHTML = `<span class="message-sender" style="font-style:italic; color:dark;">${sender}: </span>${message}`;
    chatHistory.appendChild(messageElement);
    chatHistory.scrollTop = chatHistory.scrollHeight;
 
    // Check if the message should be editable by the user
    if (className === 'user-message') {
        const editIcon = document.createElement('span');
        editIcon.className = 'edit-icon';
        editIcon.textContent = '✏️';
        editIcon.onclick = () => {
            startEditingMessage(messageElement, message);
        };
        messageElement.appendChild(editIcon);
    }
}
 
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('file-link')) {
        event.preventDefault();
        selectedPath = event.target.textContent.trim();
        showFilesInPath();
    }
});
 
function simulateTyping(message, className, sender) {
    const chatHistory = document.getElementById('chat-history');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot-message';
    typingIndicator.textContent = 'Credobot Typing......';
    chatHistory.appendChild(typingIndicator);
    chatHistory.scrollTop = chatHistory.scrollHeight;
 
    setTimeout(() => {
        typingIndicator.remove();
        addMessageToHistory(message, className, sender);
    }, 1000);
}
 
function startEditingMessage(messageElement, originalMessage) {
    const userInput = document.getElementById('user-input');
    userInput.value = originalMessage;
    userInput.focus();
 
    // Highlight the message being edited
    const chatMessages = document.querySelectorAll('.chat-message');
    chatMessages.forEach(msg => msg.classList.remove('editing'));
    messageElement.classList.add('editing');
 
    // Store the message being edited
    editingMessage = messageElement;
}
 
function updateMessage(newMessage) {
    // Clear following messages after updating
    clearFollowingMessages();
    if (editingMessage) {
        const messageSender = editingMessage.querySelector('.message-sender').textContent;
        editingMessage.innerHTML = `<span class="message-sender" style="font-style:italic; color:dark;">${messageSender}</span>${newMessage}`;
 
        // Re-add the edit icon
        const editIcon = document.createElement('span');
        editIcon.className = 'edit-icon';
        editIcon.textContent = '✏️';
        editIcon.onclick = () => {
            startEditingMessage(editingMessage, newMessage);
        };
        editingMessage.appendChild(editIcon);
 
        editingMessage.classList.remove('editing');
        editingMessage = null; // Clear the editing state  
    }
}
 
function clearFollowingMessages() {
    const chatHistory = document.getElementById('chat-history');
    const messages = chatHistory.querySelectorAll('.chat-message');
    let clear = false;
 
    messages.forEach(msg => {
        if (msg.classList.contains('editing')) {
            clear = true;
        } else if (clear) {
            msg.remove();
        }
    });
}
 
// Check connectivity on page load
window.addEventListener('load', () => {
    if (!navigator.onLine) {
        addMessageToHistory("You are not connected to the internet. Please check your connection.", 'bot-message', 'Credobot');
        document.getElementById('send-btn').disabled = true;
    }
});
 
// Monitor connectivity changes
window.addEventListener('online', () => {
    addMessageToHistory("You are back online. You can now use the Credobot.", 'bot-message', 'Credobot');
    document.getElementById('send-btn').disabled = false;
});
 
window.addEventListener('offline', () => {
    addMessageToHistory("You are offline. Please check your internet connection.", 'bot-message', 'Credobot');
    document.getElementById('send-btn').disabled = true;
});