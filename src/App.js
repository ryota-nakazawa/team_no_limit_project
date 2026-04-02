import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import SpeechToChatGPT from "./components/SpeechToChatGPT";
import PaymentDoJo from "./components/PaymentDoJo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpeechToChatGPT />} />
        <Route path="/payment" element={<PaymentDoJo />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
