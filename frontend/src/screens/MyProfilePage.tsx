import React, { useEffect, useState } from 'react';
import '../App.css';
import '../types';
import '../functions';
import { sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { MEDIA_URL } from '../constants';
import "../styles/MyProfilePage.css";

export default function MyProfilePage() {
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
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchAccount();
    }, [])

    if (account === undefined) {
        return (
            <>Loading...</>
        );
    }

    return (
        <div id="my-profile-main-container">
            <div id="my-profile-header">
                <div className="my-profile-header-half">
                    <img className="my-profile-avatar-img" src={MEDIA_URL + (account.avatar ? account.avatar : "/media/default_avatar.png")} />
                </div>
                <div className="my-profile-header-half">
                    <span className="my-profile-header-text">
                        Hello, <span className="blue">{account.user.username}</span>
                        <br />
                        ({account.user.first_name} {account.user.last_name})
                    </span>
                    <br />
                    <div className="my-profile-upload-new-avatar-box">
                        Upload new avatar&nbsp;
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
            </div>
            <br />
            <span className="gray">{account.bio}</span>
            <br />
            <br />
            <span className="gray">Email:&nbsp;</span>{account.user.email}
            <br />
            {account.socials.facebook.length ? (
                <a href={account.socials.facebook} target='_blank'>
                    <span className="blue">
                        Facebook
                    </span>
                </a>
            ) : (
                <span className="gray">Facebook profile link not set.</span>
            )}
            <br />
            {account.socials.instagram.length ? (
                <a href={account.socials.instagram} target='_blank'>
                    <span className="blue">
                        Instagram
                    </span>
                </a>
            ) : (
                <span className="gray">Instagram profile link not set.</span>
            )}
            <br />
            {account.socials.tiktok.length ? (
                <a href={account.socials.tiktok} target='_blank'>
                    <span className="blue">
                        Tiktok
                    </span>
                </a>
            ) : (
                <span className="gray">Tiktok profile link not set.</span>
            )}
            <br />
            {account.socials.linkedin.length ? (
                <a href={account.socials.linkedin} target='_blank'>
                    <span className="blue">
                        LinkedIn
                    </span>
                </a>
            ) : (
                <span className="gray">LiniedIn profile link not set.</span>
            )}
            <br />
            <br />
            <span className="gray">You joined&nbsp;</span>{timeAgo(new Date(account.user.date_joined))}
            <br />
            <a href="/profile/setup">
                <button className="my-profile-button">
                    Edit profile information
                </button>
            </a>
            <a href={`/profile/${account.user.username}`}>
                <button className="my-profile-button">
                    View profile as a guest
                </button>
            </a>
            <a href="/logout">
                <button className="my-profile-button">
                    Logout
                </button>
            </a>
        </div>
    );
}