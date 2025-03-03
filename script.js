                let currentBot = '';
                let chatHistory = {
                    gemini: [],
                    textToImage: []
                };

                function capitalizeFirstLetter(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                }

                function switchBot(bot) {
                    if (!bot) return;

                    currentBot = bot;
                    console.log('Current bot selected:', currentBot);

                    document.querySelectorAll('.bot-btn').forEach(btn => {
                        btn.style.opacity = '0.7';
                    });
                    event.target.style.opacity = '1';

                    document.querySelectorAll('.bot-history').forEach(div => {
                        div.style.display = 'none';
                    });
                    document.getElementById(`${bot}-history`).style.display = 'block';

                    if (bot === 'textToImage') {
                        document.getElementById('messages').innerHTML = ` 
                            <div style="text-align: center; color: #ffffff;">
                                <h3>Chatting with Text to Image</h3>
                                <p>Type your description for the image you want to generate.</p>
                            </div>
                        `;
                    } else {
                        document.getElementById('messages').innerHTML = ` 
                            <div style="text-align: center; color: #ffffff;">
                                <h3>Chatting with ${capitalizeFirstLetter(bot)}</h3>
                            </div>
                        `;
                    }
                }

                function loadChatHistory() {
                    const savedHistory = localStorage.getItem('chatHistory');
                    if (savedHistory) {
                        chatHistory = JSON.parse(savedHistory);
                        updateHistory();

                        const lastActiveBot = localStorage.getItem('lastActiveBot');
                        if (lastActiveBot) {
                            switchBot(lastActiveBot);
                            const currentConversation = chatHistory[lastActiveBot].find(conv => conv.isCurrent);
                            if (currentConversation) {
                                loadConversation(currentConversation);
                            }
                        }
                    } else {
                        createNewChat();
                    }
                }

                function updateHistory() {
                    const historyDiv = document.getElementById(`${currentBot}-history`);
                    historyDiv.innerHTML = '';

                    chatHistory[currentBot].forEach((conv, index) => {
                        const historyItem = document.createElement('div');
                        historyItem.className = 'history-item';
                        historyItem.style.marginBottom = '8px';
                        historyItem.style.cursor = 'pointer';

                        historyItem.innerText = `${conv.title} (${conv.time.toLocaleTimeString()}) ${conv.isCurrent ? '(Current)' : ''}`;

                        const deleteButton = document.createElement('button');
                        deleteButton.innerText = 'Delete';
                        deleteButton.style.marginLeft = '10px';
                        deleteButton.style.backgroundColor = '#000000';
                        deleteButton.style.color = '#FFFFFF';
                        deleteButton.style.border = 'none';
                        deleteButton.style.borderRadius = '5px';
                        deleteButton.style.cursor = 'pointer';

                        deleteButton.onclick = (e) => {
                            e.stopPropagation();
                            deleteConversation(index);
                        };

                        historyItem.appendChild(deleteButton);

                        historyItem.onclick = () => loadConversation(conv);

                        historyDiv.appendChild(historyItem);
                    });
                }


                function addMessage(sender, text) {
                    const messagesDiv = document.getElementById('messages');
                
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message'; // Đảm bảo lớp đúng
                    messageDiv.innerHTML = text;
                
                    // Đặt màu nền và vị trí dựa trên người gửi
                    if (sender === 'user') {
                        messageDiv.classList.add('user-message');
                        messageDiv.style.alignSelf = 'flex-end'; // Tin nhắn người dùng bên phải
                    } else {
                        messageDiv.classList.add('bot-message');
                        messageDiv.style.alignSelf = 'flex-start'; // Tin nhắn bot bên trái
                    }
                
                    messagesDiv.appendChild(messageDiv);
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                
                    anime({
                        targets: messageDiv,
                        translateY: [20, 0],
                        opacity: [0, 1],
                        duration: 500,
                        easing: 'easeOutCubic'
                    });
                }
                async function sendMessage() {
                    if (!currentBot) {
                        alert('Please select a chatbot first!');
                        return;
                    }

                    const userInput = document.getElementById('userInput').value;
                    if (!userInput.trim()) return;

                    addMessage('user', userInput);
                    document.getElementById('userInput').value = '';

                    let response = '';
                    if (currentBot === 'texttoimage') {
                        response = await queryImage(userInput);
                    } else {
                        response = await getBotResponse(currentBot, userInput);
                    }

                    addMessage('bot', response);

                    const currentConversation = chatHistory[currentBot].find(conv => conv.isCurrent);

                    if (currentConversation) {
                        currentConversation.messages.push({
                            sender: 'user',
                            text: userInput
                        }, {
                            sender: 'bot',
                            text: response
                        });
                    } else {
                        const conversationTitle = `Chat with ${capitalizeFirstLetter(currentBot)}`;
                        chatHistory[currentBot].push({
                            title: conversationTitle,
                            time: new Date(),
                            messages: [{
                                sender: 'user',
                                text: userInput
                            }, {
                                sender: 'bot',
                                text: response
                            }],
                            isCurrent: true
                        });
                    }
                    updateHistory();
                    saveChatHistory();
                }



                function deleteConversation(index) {
                    const conversation = chatHistory[currentBot][index];

                    const messageDivs = document.querySelectorAll('.message');
                    messageDivs.forEach(div => {
                        const image = div.querySelector('img');
                        if (image) {
                            div.removeChild(image);
                        }
                    });

                    chatHistory[currentBot].splice(index, 1);
                    saveChatHistory();
                    updateHistory();
                    if (conversation.isCurrent) {
                        document.getElementById('messages').innerHTML = `
                            <div style="text-align: center; color: #ffffff;">
                                <h3>Chat with ${capitalizeFirstLetter(currentBot)}</h3>
                                <p>Type your message to begin a new conversation.</p>
                            </div>
                        `;
                    }
                }


                function loadConversation(conversation) {
                    document.getElementById('messages').innerHTML = '';

                    chatHistory[currentBot].forEach(conv => {
                        conv.isCurrent = false;
                    });
                    conversation.isCurrent = true;

                    const conversationTitle = document.createElement('div');
                    conversationTitle.style.textAlign = 'center';
                    conversationTitle.style.margin = '20px';
                    conversationTitle.style.color = '#ffffff';
                    conversationTitle.innerHTML = `<h3>${conversation.title}</h3>`;
                    document.getElementById('messages').appendChild(conversationTitle);


                    conversation.messages.forEach(msg => {
                        const msgDiv = document.createElement('div');
                        msgDiv.style.margin = '10px';
                        msgDiv.style.padding = '10px 15px';
                        msgDiv.style.borderRadius = '8px';
                        msgDiv.style.maxWidth = '75%';
                        msgDiv.style.wordWrap = 'break-word';
                        msgDiv.style.whiteSpace = 'pre-wrap';

                        if (msg.sender === 'user') {
                            msgDiv.style.background = '#1f1f1f';
                            msgDiv.style.color = '#ffffff';
                            msgDiv.style.alignSelf = 'flex-end';
                        } else {
                            msgDiv.style.background = '#2d2d2d';
                            msgDiv.style.color = '#ffffff';
                            msgDiv.style.alignSelf = 'flex-start';
                        }

                        msgDiv.innerHTML = msg.text;
                        document.getElementById('messages').appendChild(msgDiv);
                    });

                    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;

                    updateHistory();
                }

                function createNewChat() {
                    if (!currentBot) {
                        alert('Please select a chatbot first!');
                        return;

                    }

                    chatHistory[currentBot].push({
                        title: `Chat with ${capitalizeFirstLetter(currentBot)}`,
                        time: new Date(),
                        messages: [],
                        isCurrent: true
                    });

                    document.getElementById('messages').innerHTML = '';
                    const conversationTitle = document.createElement('div');
                    conversationTitle.style.textAlign = 'center';
                    conversationTitle.style.margin = '20px';
                    conversationTitle.style.color = '#ffffff';
                    conversationTitle.innerHTML = `<h3>Chatting with ${capitalizeFirstLetter(currentBot)}</h3>
                                                   <p>Type your message to begin a new conversation.</p>`;
                    document.getElementById('messages').appendChild(conversationTitle);

                    updateHistory();
                    saveChatHistory();
                }

                function saveChatHistory() {
                    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
                    localStorage.setItem('lastActiveBot', currentBot);
                }

                async function getBotResponse(bot, input) {
                    const endpoints = {
                        gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                        textToImage: 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-3.5-large'
                    };

                    try {
                        switch (bot) {
                            case 'gemini':
                                try {
                                    const geminiResponse = await fetch(`${endpoints.gemini}?key=AIzaSyD8t4-eT6YTEpJfAKnYTtLa4wPRX8vkO5U`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            contents: [{ parts: [{ text: input }] }]
                                        })
                                    });

                                    const geminiData = await geminiResponse.json();
                                    console.log(geminiData);

                                    if (geminiData.candidates && geminiData.candidates[0].content && geminiData.candidates[0].content.parts[0].text) {
                                        return geminiData.candidates[0].content.parts[0].text;
                                    } else {
                                        return "Sorry, there was an issue with Gemini's response.";
                                    }

                                } catch (error) {
                                    console.error('Error:', error);
                                    return "Sorry, there was an error processing your request.";
                                }

                            case 'textToImage':
                                try {
                                    const response = await fetch(endpoints.textToImage, {
                                        method: 'POST',
                                        headers: {
                                            'Authorization': `Bearer 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`,
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ inputs: input })
                                    });

                                    if (!response.ok) {
                                        const errorData = await response.json();
                                        console.error('Hugging Face API Error:', errorData);
                                        return "Sorry, there was an error generating the image.";
                                    }

                                    const result = await response.blob();
                                    const imageUrl = URL.createObjectURL(result);
                                    console.log('Generated Image URL:', imageUrl);

                                    return `<img src="${imageUrl}" alt="Generated Image" style="max-width: 100%; height: auto;" />`;

                                } catch (error) {
                                    console.error('Error:', error);
                                    return "Sorry, there was an error generating the image.";
                                }

                            default:
                                return "Sorry, the bot you selected is not available.";
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        return "Sorry, there was an error processing your request.";
                    }
                }

                document.getElementById('userInput').addEventListener('keypress', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });