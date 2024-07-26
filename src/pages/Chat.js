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
  const [loading, setLoading] = useState(false);

  const handleUserInput = (value) => {
    setUserInput(value);
  };

  const genAI = new GoogleGenerativeAI("AIzaSyAvtn3iiv_jbb8hGaebF7W9TH3BFuMe4-U");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const sendMessage = async (messageText) => {
    if (messageText.trim() === "") return;

    setChatHistory((prev) => [
      ...prev,
      { type: "user", message: messageText },
    ]);
    setUserInput("");
    setLoading(true);

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

      let text = "No response text available.";

      text = response.text();

      console.log("Response text:", text);

      setChatHistory((prev) => [
        ...prev,
        { type: "bot", message: text },
      ]);
    } catch (e) {
      console.error("Error occurred while fetching", e);
    } finally {
      setLoading(false);
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
                  message: elt.message ? elt.message.toString() : "Invalid message",
                  sender: elt.type,
                  sentTime: "just now",
                  direction: elt.type === "user" ? "outgoing" : "incoming",
                }}
              />
            ))}
            {loading && (
              <Message
                model={{
                  message: "Loading...",
                  sender: "bot",
                  sentTime: "just now",
                  direction: "incoming",
                }}
              />
            )}
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
