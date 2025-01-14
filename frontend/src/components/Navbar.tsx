import React, { useEffect, useState } from 'react';
import '../App.css';

export default function Navbar() {

    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <div id="navbar-container">
                <div id="navbar-left">
                    <b>Learning App</b>
                </div>
                <div id="navbar-right">
                    <div className="navbar-link">
                        <a href="/" className="navbar-link-ahref">Home</a>
                    </div>
                    <div className="navbar-link">
                        <a href="/explore" className="navbar-link-ahref">Explore</a>
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
            <div id="m-navbar-container">
                <div id="m-navbar-left">
                    <b>Learning App</b>
                </div>
                <div id="m-navbar-right">
                    <span
                        className="m-navbar-right-3-stripes"
                        onClick={toggleMenu}
                    >
                        ☰
                    </span>
                </div>
            </div>
            {isMenuOpen && (
                <div id="m-navbar-menu">
                    <a href="/">
                        <div className="m-navbar-menu-box">
                            Home
                        </div>
                    </a>
                    <a href="/explore">
                        <div className="m-navbar-menu-box">
                            Explore
                        </div>
                    </a>
                    <a href="/learn">
                        <div className="m-navbar-menu-box">
                            Learn
                        </div>
                    </a>
                    <a href="/courses/my">
                        <div className="m-navbar-menu-box">
                            My courses
                        </div>
                    </a>
                    <a href="/elements/my">
                        <div className="m-navbar-menu-box">
                            My elements
                        </div>
                    </a>
                    <a href="/profile/me">
                        <div className="m-navbar-menu-box">
                            Profile
                        </div>
                    </a>
                </div>
            )}
        </>
    )
};