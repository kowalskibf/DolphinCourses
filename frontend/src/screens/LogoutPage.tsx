// import React from "react";
import React, { useEffect, useState } from "react";

export default function LogoutPage() {

    const logout = () => {
        let url = "http://127.0.0.1:8000/api/token/logout/";
        fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        }).then((response) => {
            if (response.ok) {
                localStorage.clear();
                console.log("Logout successful");
            } else {
                console.log("invalid data");
            }
        });
    };

    const handleLogout = () => {
        logout();
        localStorage.clear();
        window.location.replace("/login");
    };

    useEffect(() => {
        handleLogout();
    }, []);

    return (
        <></>
    );
};