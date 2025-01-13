import React, { useEffect, useState } from 'react';
import '../App.css';
import "../styles/LandingPage.css";

export default function LandingPage() {
    return (
        <div id="landing-page-main-container">
            <div id="landing-page-header">
                Hello,<br />
                Welcome to <span className="landing-page-app-name">LearningApp</span>!
            </div>
            <div id="landing-page-sub-header">
                Try our users' courses!
                <a href="/explore">
                    <button className="landing-page-button">Explore</button>
                </a>
            </div>
            <div className="landing-page-auth">
                Already have an account?
                <br />
                <a href="/login">
                    <button className="landing-page-button">
                        Login
                    </button>
                </a>
            </div>
            <div className="landing-page-auth">
                Don't have an account?
                <br />
                <a href="/register">
                    <button className="landing-page-button">
                        Register
                    </button>
                </a>
            </div>
        </div>
    );
};