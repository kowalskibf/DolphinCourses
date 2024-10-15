import React, { useEffect, useState } from 'react';
import '../App.css';
import '../types';
import '../functions';
import { timeAgo } from '../functions';

export default function ProfilePage() {
    const [account, setAccount] = useState<Account>();

    const fetchAccount = async () => {
        fetch("http://127.0.0.1:8000/api/profile/me", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setAccount(data));
    };

    useEffect(() => {
        fetchAccount();
    }, [])

    if (account === undefined) {
        return (
            <>Loading...</>
        );
    }

    return (
        <>
            hello, {account.user.username}
            <br />
            or
            <br />
            {account.user.first_name} {account.user.last_name}
            <br />
            your email
            {account.user.email}
            <br />
            tt:
            {account.socials.tiktok}
            <br />
            you joined {timeAgo(new Date(account.user.date_joined))}

        </>
    );
}