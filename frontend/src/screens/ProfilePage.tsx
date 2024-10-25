import React, { useEffect, useState } from 'react';
import '../App.css';
import '../types';
import '../functions';
import { timeAgo } from '../functions';
import { MEDIA_URL } from '../constants';

export default function ProfilePage() {
    const [account, setAccount] = useState<Account>();
    const [newAvatar, setNewAvatar] = useState<File | null>(null);

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewAvatar(e.target.files[0]);
            let fr = new FileReader();
            fr.onload = function () {
                const imageElement = document.getElementById("uploaded-image") as HTMLImageElement;
                if (imageElement) {
                    imageElement.src = fr.result as string;
                }
            }
            fr.readAsDataURL(e.target.files[0]);
        }
    }

    const handleSetNewAvatar = async () => {
        const formData = new FormData();
        if (newAvatar)
            formData.append("avatar", newAvatar);
        const response = await fetch("http://127.0.0.1:8000/api/profile/avatar", {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formData,
        })
            .then((r) => {
                if (r.ok) {
                    fetchAccount();
                } else {
                    console.log("Some error occured");
                }
            })

    }

    useEffect(() => {
        if (newAvatar) {
            handleSetNewAvatar();
        }
    }, [newAvatar]);

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
            <a href="/courses/my">My courses</a>
            <a href="/elements/my">My elements</a>
            <img src={MEDIA_URL + (account.avatar ? account.avatar : "/media/default_avatar.png")} />
            hello, {account.user.username}
            <br />
            or
            <br />
            {account.user.first_name} {account.user.last_name}
            <br />
            your email
            <br />
            {account.user.email}
            <br />
            tt:
            {account.socials.tiktok}
            <br />
            you joined {timeAgo(new Date(account.user.date_joined))}
            <br />
            <a href="/logout">Logout</a>
            <h3>Change avatar:</h3>
            <img id="uploaded-image"></img>
            Upload new avatar
            <input type="file" accept="image/*" onChange={handleFileChange} />
        </>
    );
}