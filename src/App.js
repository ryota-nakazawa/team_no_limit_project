// App.js
import React from "react";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import "./App.css";
import SpeechToChatGPT from "./components/SpeechToChatGPT";
import PaymentDoJo from "./components/PaymentDoJo";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpeechToChatGPT />} />
        <Route path="/payment" element={<PaymentDoJo />} />
        {/* URL直接入力時に"/"にリダイレクト */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
