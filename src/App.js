// App.js
import React from "react";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import "./App.css";
import SpeechToChatGPT from "./components/SpeechToChatGPT";
import PaymentDoJo from "./components/PaymentDoJo";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SpeechToChatGPT />} />
        <Route path="/payment" element={<PaymentDoJo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
