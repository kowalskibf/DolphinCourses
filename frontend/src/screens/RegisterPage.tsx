import React, { useEffect, useState } from 'react';
import '../App.css';
import { API_URL } from '../constants';
import "../styles/RegisterPage.css";

export default function RegisterPage() {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password1, setPassword1] = useState<string>("");
    const [password2, setPassword2] = useState<string>("");
    const [errorUsername, setErrorUsername] = useState<string | null>(null);
    const [errorEmail, setErrorEmail] = useState<string | null>(null);
    const [errorPassword1, setErrorPassword1] = useState<string | null>(null);
    const [errorPassword2, setErrorPassword2] = useState<string | null>(null);
    const [errorGlobal, setErrorGlobal] = useState<string | null>(null);
    const validUsername = new RegExp("^([a-z0-9]{1,25})$");
    const validEmail = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    const validPassword = new RegExp("^[A-Za-z0-9!@#$%^&*()_+=-]{8,25}$");

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
                        .then(() => window.location.replace("/profile/setup"));
                } else {
                    setErrorGlobal("User successfully registered, but something went wrong with logging in.");
                }
            });
    };

    const handleRegister = async () => {
        setErrorUsername(null);
        setErrorEmail(null);
        setErrorPassword1(null);
        setErrorPassword2(null);
        setErrorGlobal(null);
        if (username.length == 0) {
            setErrorUsername("Username cannot be empty");
        } else if (username.length > 25) {
            setErrorUsername("Username must be at most 25 characters long");
        } else if (!validUsername.test(username)) {
            setErrorUsername("Invalid username format");
        } else if (email.length == 0) {
            setErrorEmail("Email cannot be empty");
        } else if (!validEmail.test(email)) {
            setErrorEmail("Invalid email format");
        } /* password regex */ else if (password1 != password2) {
            setErrorPassword2("Passwords do not match");
        } else {
            const response = await fetch("http://127.0.0.1:8000/api/register", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: password1,
                    email: email,
                }),
            })
                .then((response) => {
                    console.log(response);
                    if (response.ok) {
                        login(username, password1);
                    } else {
                        return response.json().then((data) => {
                            if (data.error == "Invalid request body.") {
                                setErrorGlobal(data.error);
                            } else if (data.error == "Username required.") {
                                setErrorUsername(data.error);
                            } else if (data.error == "Username must be at most 25 characters long.") {
                                setErrorUsername(data.error);
                            } else if (data.error == "Email required.") {
                                setErrorEmail(data.error);
                            } else if (data.error == "Password required.") {
                                setErrorPassword1(data.error);
                            } else if (data.error == "Username already taken.") {
                                setErrorUsername(data.error);
                            } else if (data.error == "Email already used.") {
                                setErrorEmail(data.error);
                            } else {
                                setErrorGlobal("Internal server error");
                            }
                        })
                    }
                });
        }
    }

    return (
        <div id="create-course-main" className="text-align-center">
            <h1>Register</h1>
            <div className="create-course-label-box">
                Username
            </div>
            <input className="create-course-input-text" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            {errorUsername && (
                <span className="red">
                    <br />
                    {errorUsername}
                </span>
            )}
            <div className="create-course-label-box">
                Email
            </div>
            <input className="create-course-input-text" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {errorEmail && (
                <span className="red">
                    <br />
                    {errorEmail}
                </span>
            )}
            <div className="create-course-label-box">
                Password
            </div>
            <input className="create-course-input-text" type="password" value={password1} onChange={(e) => setPassword1(e.target.value)} />
            {errorPassword1 && (
                <span className="red">
                    <br />
                    {errorPassword1}
                </span>
            )}
            <div className="create-course-label-box">
                Repeat password
            </div>
            <input className="create-course-input-text" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            {errorPassword2 && (
                <span className="red">
                    <br />
                    {errorPassword2}
                </span>
            )}
            <br />
            {errorGlobal && (
                <span className="red">
                    <br />
                    {errorGlobal}
                </span>
            )}
            <button className="create-course-step-button" type="button" onClick={handleRegister}>Register</button>
            <a href="/login">
                <button className="create-course-step-button">
                    Login
                </button>
            </a>
        </div>
    );
};