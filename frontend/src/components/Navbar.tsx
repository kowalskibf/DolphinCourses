import React, { useEffect, useState } from 'react';
import '../App.css';

export default function Navbar() {
    return (
        <div id="navbar-container">
            <div id="navbar-left">
                <b>Learning App</b>
            </div>
            <div id="navbar-right">
                <div className="navbar-link">
                    <a href="/" className="navbar-link-ahref">Home</a>
                </div>
                <div className="navbar-link">
                    Explore
                </div>
                <div className="navbar-link">
                    <a href="/learn" className="navbar-link-ahref">Learn</a>
                </div>
                <div className="navbar-link">
                    <a href="/courses/my" className="navbar-link-ahref">My courses</a>
                </div>
                <div className="navbar-link">
                    <a href="/elements/my" className="navbar-link-ahref">My elements</a>
                </div>
                <div className="navbar-link">
                    <a href="/profile/me" className="navbar-link-ahref">Profile</a>
                </div>
            </div>
        </div>
    )
};