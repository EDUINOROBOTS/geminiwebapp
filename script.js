let API_KEY = localStorage.getItem("gemini_api_key") || "YOUR_API_KEY_HERE";
let API_URL =
  localStorage.getItem("gemini_api_url") ||
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const typingForm = document.querySelector(".typing-form");
const chat = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleTheme = document.querySelector("#theme-toogle-button");
const deleteChat = document.querySelector("#delete-chat-button");
const stopButton = document.querySelector("#stop-response-button");
const menuToggle = document.querySelector(".menu-toggle");
const sideMenu = document.querySelector("#sideMenu");
const saveSettingsBtn = document.querySelector("#saveSettingsBtn");

let userMessage = null;
let apiResponse = false;
let typingInterval = null;

const loadData = () => {
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  document.body.classList.toggle("light_mode", isLightMode);
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";
  chat.innerHTML = "";
};

toggleTheme.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";
});

const createMessage = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const typingEffect = (text, textElement, messageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  typingInterval = setInterval(() => {
    if (currentWordIndex < words.length) {
      textElement.innerText +=
        (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
      messageDiv.querySelector(".icon").classList.add("hide");
    } else {
      clearInterval(typingInterval);
      typingInterval = null;
      apiResponse = false;
      messageDiv.querySelector(".icon").classList.remove("hide");
    }
    chat.scrollTo(0, chat.scrollHeight);
  }, 100);
};

const generateResponse = async (messageDiv) => {
  const textElement = messageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message || "Invalid API key");

    const apiData = data?.candidates[0]?.content?.parts[0]?.text || "No response.";
    const cleanText = apiData.replace(/(?<=```[a-z]*)([\s\S]*?)(?=```)/g, "$1").replace(/```[a-z]*|```/g, "");
    typingEffect(cleanText, textElement, messageDiv);
  } catch (error) {
    apiResponse = false;
    textElement.innerText = error.message;
    messageDiv.classList.add("error");
  } finally {
    messageDiv.classList.remove("loading");
  }
};

const loadingAnimation = () => {
  const tag = `<div class="message-content">
                 <img class="avatar" src="images/user.png" alt="Gemini logo">
                 <p class="text"></p>
                 <div class="loading-indicator">
                   <div class="loading-bar"></div>
                   <div class="loading-bar"></div>
                   <div class="loading-bar"></div>
                 </div>
               </div>
               <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const messageDiv = createMessage(tag, "incoming", "loading");
  chat.appendChild(messageDiv);
  chat.scrollTo(0, chat.scrollHeight);
  generateResponse(messageDiv);
};

const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

const sendMessage = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || apiResponse) return;
  apiResponse = true;

  const tag = `<div class="message-content">
                 <img class="avatar" src="images/gemini.svg" alt="user profile photo">
                 <p class="text"></p>
               </div>`;
  const sendMessageDiv = createMessage(tag, "outgoing");
  sendMessageDiv.querySelector(".text").innerText = userMessage;
  chat.appendChild(sendMessageDiv);

  typingForm.reset();
  document.body.classList.add("hide-header");
  chat.scrollTo(0, chat.scrollHeight);
  setTimeout(loadingAnimation, 500);
};

suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    sendMessage();
  });
});

deleteChat.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats")) {
    chat.innerHTML = "";
    document.body.classList.remove("hide-header");
  }
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

stopButton.addEventListener("click", () => {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
    apiResponse = false;

    const lastMessage = chat.querySelector(".message.incoming .text");
    if (lastMessage) {
      lastMessage.parentElement.querySelector(".icon").classList.remove("hide");
    }
  }
});

menuToggle.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

saveSettingsBtn.addEventListener("click", () => {
  const apiKey = document.querySelector("#apiKeyInput").value.trim();
  const apiUrl = document.querySelector("#apiUrlInput").value.trim();

  if (apiKey) {
    localStorage.setItem("gemini_api_key", apiKey);
    API_KEY = apiKey;

    const fullUrl = apiUrl || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    localStorage.setItem("gemini_api_url", fullUrl);
    API_URL = fullUrl;

    alert("Settings saved!");
    sideMenu.classList.remove("open");
  } else {
    alert("Please enter a valid API key.");
  }
});

loadData();
