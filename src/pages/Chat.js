import React, { useState } from "react";
import styles from "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
} from "@chatscope/chat-ui-kit-react";
import './App.css'; // Impor file CSS di sini
import { GoogleGenerativeAI } from "@google/generative-ai"; // Sesuaikan dengan nama package yang benar

function Chat() {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleUserInput = (value) => {
    setUserInput(value);
  };

  const genAI = new GoogleGenerativeAI("AIzaSyAvtn3iiv_jbb8hGaebF7W9TH3BFuMe4-U");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const sendMessage = async (messageText) => {
    if (messageText.trim() === "") return;

    console.log("Sending message:", messageText);

    try {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "Pretend you're a snowman and stay in character for each response." }],
          },
          {
            role: "model",
            parts: [{ text: "Hello! It's cold! Isn't that great?" }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 100,
        },
      });

      console.log("Chat object created:", chat);

      const result = await chat.sendMessage(messageText);
      console.log("Received result:", result);

      const response = result.response;
      console.log("Response:", response);

      const text = response.candidates && response.candidates.length > 0
        ? response.candidates[0].text
        : "No response text available.";

      console.log("Response text:", text);

      setChatHistory((prev) => [
        ...prev,
        { type: "user", message: messageText },
        { type: "bot", message: text },
      ]);
      setUserInput("");
    } catch (e) {
      console.error("Error occurred while fetching", e);
    }
  };

  return (
    <div style={{ position: "relative", height: "500px" }}>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            {chatHistory.map((elt, i) => (
              <Message
                key={i}
                model={{
                  message: elt.message.toString(),
                  sender: elt.type,
                  sentTime: "just now",
                  direction: elt.type === "user" ? "outgoing" : "incoming",
                }}
              />
            ))}
          </MessageList>
          <MessageInput
            placeholder="Type message here"
            value={userInput}
            onChange={(value) => handleUserInput(value)}
            onSend={() => sendMessage(userInput)}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
}

export default Chat;
