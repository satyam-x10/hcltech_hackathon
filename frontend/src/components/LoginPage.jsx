// frontend: React (metahuman_avatar_frontend.jsx) - Updated to integrate webcam login

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import UserProfileCard from './UserProfile';
const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user"
};

const MetaHumanBankTeller = () => {
  const webcamRef = useRef(null);
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [avatarResponse, setAvatarResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [idNumber, setIdNumber] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const captureImage = () => {
    const image = webcamRef.current.getScreenshot();
    setImageSrc(image);
  };

  const handleLoginSubmit = async () => {
    if (!imageSrc || !idNumber) {
      setMessage("Please provide both ID and photo.");
      return;
    }

    const res = await fetch('http://localhost:8000/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_number: idNumber, image_data: imageSrc })
    });  

    const result = await res.json();

    if (result.success) {
      setUser(result.user);
      setMessage("Login successful!");
    } else {
      setMessage("User not found. Registering...");
      const reg = await fetch('http://localhost:8000/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: idNumber, id_number: idNumber, image_data: imageSrc })
      });
      const regRes = await reg.json();
      if (regRes.success) {
        setUser(regRes.user);
        setMessage("Registered and logged in!");
      } else {
        setMessage(regRes.message);
      }
    }
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setChatHistory((prev) => [...prev, { from: "user", text: userInput }]);

    try {
      const res = await fetch("http://localhost:8000/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput })
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
    <div style={{ maxWidth: 700, margin: "auto", padding: 20 }}>
      <h2>💬 MetaHuman Bank Teller</h2>
      {!user ? (
        <div>
          <input
            placeholder="Enter your ID"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
          />
          <Webcam
            audio={false}
            height={240}
            screenshotFormat="image/jpeg"
            width={320}
            ref={webcamRef}
            videoConstraints={videoConstraints}
          />
          <button onClick={captureImage}>📸 Capture Photo</button>
          <button onClick={handleLoginSubmit}>🚀 Submit</button>
          {imageSrc && <img src={imageSrc} alt="Captured" style={{ marginTop: 10 }} />}
          <p>{message}</p>
        </div>
      ) : (
        <>
         <UserProfileCard user={user} />
        </>
      )}
    </div>
  );
};

export default MetaHumanBankTeller;
