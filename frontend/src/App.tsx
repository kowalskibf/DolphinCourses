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
import LoginPage from './screens/LoginPage';
import MyCoursesPage from './screens/MyCoursesPage';
import CreateCoursePage from './screens/CreateCoursePage';
import MyElementsPage from './screens/MyElementsPage';
import NewElementPage from './screens/NewElementPage';
import Navbar from './components/Navbar';
import EditCourseInfoPage from './screens/EditCourseInfoPage';
import EditCourseTopicsPage from './screens/EditCourseTopicsPage';
import EditCoursePage from './screens/EditCoursePage';
import EditElementPage from './screens/EditElementPage';
import EditWeightsPage from './screens/EditWeightsPage';
import EditCourseMembersPage from './screens/EditCourseMembersPage';
import LearnPage from './screens/LearnPage';
import ViewCourseInfoPage from './screens/ViewCourseInfoPage';
import ViewCourseAccessPage from './screens/ViewCourseAccessPage';

export default function App() {
  return (
    <div className="App">
      <Navbar />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/setup" element={<ProfileSetupPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/profile/me" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/courses/my" element={<MyCoursesPage />} />
          <Route path="/course/new" element={<CreateCoursePage />} />
          <Route path="/elements/my" element={<MyElementsPage />} />
          <Route path="/element/new" element={<NewElementPage />} />
          <Route path="/course/:id/edit/info" element={<EditCourseInfoPage />} />
          <Route path="/course/:id/edit/topics" element={<EditCourseTopicsPage />} />
          <Route path="/course/:id/edit" element={<EditCoursePage />} />
          <Route path="/element/:id/edit" element={<EditElementPage />} />
          <Route path="/course/:course_id/assignment/:assignment_id/weights/edit" element={<EditWeightsPage />} />
          <Route path="/course/:id/edit/members" element={<EditCourseMembersPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/course/:id/view/info" element={<ViewCourseInfoPage />} />
          <Route path="/course/:id/view/access" element={<ViewCourseAccessPage />} />
        </Routes>
      </Router>
    </div>
  )
}
