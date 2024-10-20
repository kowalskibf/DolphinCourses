import React, { useEffect, useState } from 'react';
import '../App.css';

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
        <>
            <h1>Login page</h1>
            <form onSubmit={(e) => e.preventDefault()}>
                username:
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                password:
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={handleLogin}>Login</button>
            </form>
            {error ? error : ""}
            <a href="/register">Register</a>
        </>
    )



}