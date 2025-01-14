import React, { useEffect, useState } from 'react';
import '../App.css';
import "../styles/LoginPage.css";

export default function LoginPage() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const login = async (username: string, password: string) => {
        const response = await fetch("http://127.0.0.1:8000/api/token/login/", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                password: password
            }),
        })
            .then((response) => {
                if (response.ok) {
                    response
                        .json()
                        .then((data) => {
                            localStorage.setItem("token", data.token);
                        })
                        .then(() => window.location.replace("/profile/me"));
                } else {
                    setError("Invalid credentials.");
                }
            });
    };

    const handleLogin = async () => {
        setError(null);
        login(username, password);
    };

    return (
        <div id="create-course-main" className="text-align-center">
            <h1>Login</h1>
            <div className="create-course-label-box">
                Username
            </div>
            <input className="create-course-input-text" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            <div className="create-course-label-box">
                Password
            </div>
            <input className="create-course-input-text" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <br />
            {error && (
                <span className="red">
                    {error}
                    <br />
                </span>
            )}
            <button className="create-course-step-button" type="button" onClick={handleLogin}>Login</button>
            <a href="/register">
                <button className="create-course-step-button">
                    Register
                </button>
            </a>
        </div>
    )



}