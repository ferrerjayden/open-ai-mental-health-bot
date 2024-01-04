import React, { useState } from "react";
import { Button, Container } from "@mui/material";
import { ChatBox } from "./chatbox/ChatBox";
import { ChatInput } from "./chatbox/ChatInput";
import axios from "axios";
function App() {
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    const newMessage = { text, sender: "User" };
    setMessages((messages) => [...messages, newMessage]);

    try {
      const response = await axios.post("http://localhost:8080/message", {
        message: { messages: [{ role: "user", content: text }] },
      });

      const botResponse = {
        text: response.data.result.message.content,
        sender: "Bot",
      };
      setMessages((messages) => [...messages, botResponse]);
      console.log(response);
    } catch (err) {
      console.error("ERROR: ", err);
    }
  };

  return (
    <Container maxWidth="sm">
      <ChatBox messages={messages} />
      <ChatInput sendMessage={sendMessage}></ChatInput>
    </Container>
  );
}

export default App;
