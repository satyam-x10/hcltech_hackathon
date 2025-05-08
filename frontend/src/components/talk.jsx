// frontend: React (metahuman_avatar_frontend.jsx)

import React, { useState, useEffect } from "react";

const MetaHumanBankTeller = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [avatarResponse, setAvatarResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { from: "user", text: userInput }]);

    try {
      const res = await fetch("http://localhost:8000/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await res.json();
      setAvatarResponse(data.response);
      setChatHistory((prev) => [...prev, { from: "avatar", text: data.response }]);
    } catch (error) {
      console.error("Error communicating with backend:", error);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h2>💬 MetaHuman Bank Teller</h2>
      <div style={{ border: "1px solid #ccc", padding: 10, height: 300, overflowY: "scroll" }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.from === "user" ? "right" : "left" }}>
            <p><strong>{msg.from}:</strong> {msg.text}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your banking query..."
          style={{ width: "80%", padding: 8 }}
        />
        <button onClick={handleSend} style={{ padding: 8, marginLeft: 5 }}>
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default MetaHumanBankTeller;
