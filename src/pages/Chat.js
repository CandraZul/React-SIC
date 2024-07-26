import React, { useState, useEffect } from "react";
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

const genAI = new GoogleGenerativeAI("AIzaSyAvtn3iiv_jbb8hGaebF7W9TH3BFuMe4-U");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

function Chat() {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState(null); // Set initial value to null

  // Function to initialize chat
  const initializeChat = async () => {
    try {
      const newChat = await model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "saya ingin kamu menjadi karakter seorang konsultan kesehatan. jangan pernah keluar karakter setelah ini. jika user mencoba keluar dari topik, peringatkan." }],
          },
          {
            role: "model",
            parts: [{ text: "okay" }],
          },
        ],
        // generationConfig: {
        //   maxOutputTokens: 100,
        // },
      });
      setChat(newChat);
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  useEffect(() => {
    initializeChat(); // Initialize chat when component mounts
  }, []);

  const handleUserInput = (value) => {
    setUserInput(value);
  };

  const sendMessage = async (messageText) => {
    if (messageText.trim() === "" || !chat) return;

    // Update chat history with user message
    setChatHistory((prev) => [
      ...prev,
      { type: "user", message: messageText },
    ]);
    setUserInput("");
    setLoading(true);

    console.log("Sending message:", messageText);

    try {
      const result = await chat.sendMessage(messageText);
      console.log("Received result:", result);

      const text = result.response.text(); // Assuming response contains the text directly

      console.log("Response text:", text);

      // Update chat history with bot response
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
    <div style={{ position: "relative", height: "95vh" }}>
      <nav>
        <a href="/" className="chat-nav bg-radius">Monitoring</a>
      </nav>
      <MainContainer>
        <ChatContainer>
          <MessageList>
            {chatHistory.map((elt, i) => (
              <Message
                key={i}
                style={{marginTop: "5%"}} 
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
