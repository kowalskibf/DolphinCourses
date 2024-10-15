import React, { useEffect } from 'react';
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './screens/LandingPage';
import RegisterPage from './screens/RegisterPage';
import ProfileSetupPage from './screens/ProfileSetup';
import LogoutPage from './screens/LogoutPage';
import ProfilePage from './screens/ProfilePage';

export default function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/profile/me" element={<ProfilePage />} />
        </Routes>
      </Router>
    </div>
  )
}
