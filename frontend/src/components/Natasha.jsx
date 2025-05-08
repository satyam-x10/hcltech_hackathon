import React, { useEffect, useRef, useState } from "react";
import { Avatar, Button, Spin } from "antd";
import { RobotOutlined } from "@ant-design/icons";

const Natasha = ({ setNatasha, user }) => {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const debounceTimer = useRef(null);

  const [audioTranscript, setAudioTranscript] = useState("");
  const [responses, setResponses] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState("user");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    }).catch(console.error);

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const sendToAPI = async (transcript) => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setCurrentSpeaker("natasha");

    try {
      const res = await fetch(`http://localhost:8000/user/${user?.id ?? 121}/natasha`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript }),
      });
      const data = await res.json();
      const message = data?.data?.advice || "Sorry, I didn't understand that.";

      setResponses(prev => [...prev, { text: message, timestamp: new Date().toISOString() }]);
      speakResponse(message);
    } catch (err) {
      console.error("API error:", err);
      setResponses(prev => [...prev, { text: "API error occurred.", timestamp: new Date().toISOString() }]);
      setCurrentSpeaker("user");
    } finally {
      setIsProcessing(false);
      setAudioTranscript("");
    }
  };

  const speakResponse = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.voice = voices.find(v => v.lang === "en-US") || voices[2];

    utter.onend = () => setCurrentSpeaker("user");
    utter.onerror = () => setCurrentSpeaker("user");

    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return console.warn("Speech Recognition unsupported");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const finalTranscript = Array.from(event.results)
        .filter(r => r.isFinal)
        .map(r => r[0].transcript)
        .join(" ");

      if (finalTranscript) {
        setAudioTranscript(finalTranscript);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => sendToAPI(finalTranscript), 1000);
      }
    };

    recognition.onerror = e => console.error("Speech recognition error:", e.error);

    recognition.start();

    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
      clearTimeout(debounceTimer.current);
    };
  }, []);

  return (
    <div style={{ textAlign: "center", padding: 20, maxWidth: 500, margin: "0 auto", color: "#000" }}>
      <h2>Hello, {user?.name || "User"}</h2>

      <div style={{ margin: "20px 0", height: 100 }}>
        {currentSpeaker === "user" ? (
          <img src="/silent.png" alt="User speaking" style={{ height: 100, objectFit: "contain" }} />
        ) : (
          <img src="/speak.gif" alt="Natasha speaking" style={{ height: 100, objectFit: "contain" }} />
        )}
      </div>

      <video ref={videoRef} autoPlay muted style={{ width: 300, borderRadius: 12 }} />

      <div style={{ marginTop: 20 }}>
        <h3>What you're saying:</h3>
        <div style={{
          padding: 10,
          backgroundColor: "#fff",
          color: "#000",
          borderRadius: 8,
          minHeight: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #d9d9d9"
        }}>
          {isProcessing ? <Spin /> : audioTranscript.trim() || "(waiting for input...)"}
        </div>
      </div>

      <div style={{ marginTop: 20, textAlign: "left" }}>
        <h3>Conversation:</h3>
        <div style={{
          maxHeight: 300,
          overflowY: "auto",
          border: "1px solid #d9d9d9",
          borderRadius: 8,
          padding: 10,
          background: "#fafafa"
        }}>
          {responses.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888" }}>No conversation yet</p>
          ) : (
            responses.map((res, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <Avatar size="small" icon={<RobotOutlined />} style={{ backgroundColor: "#1890ff" }} />
                  <div style={{
                    backgroundColor: "#e6f7ff",
                    color: "#000",
                    padding: 10,
                    borderRadius: 8,
                    maxWidth: "80%"
                  }}>{res.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Button type="primary" danger onClick={() => setNatasha(false)} style={{ marginTop: 20 }}>
        Exit Natasha
      </Button>
    </div>
  );
};

export default Natasha;