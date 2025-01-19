import React, { useEffect, useState } from 'react';
import '../App.css';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';
import "../styles/ProfileSetup.css";

export default function ProfileSetupPage() {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    const [facebook, setFacebook] = useState<string>("");
    const [instagram, setInstagram] = useState<string>("");
    const [tiktok, setTiktok] = useState<string>("");
    const [linkedin, setLinkedin] = useState<string>("");

    const [account, setAccount] = useState<Account>();

    const fetchAccount = async () => {
        const response = await fetch("http://127.0.0.1:8000/api/profile/me", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setFirstName(data.user.first_name);
                setLastName(data.user.last_name);
                setBio(data.bio);
                setFacebook(data.socials.facebook);
                setInstagram(data.socials.instagram);
                setTiktok(data.socials.tiktok);
                setLinkedin(data.socials.linkedin);
                setAccount(data);
            });
    }

    const handleSetup = async () => {
        const response = await fetch("http://127.0.0.1:8000/api/profile/setup", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                firstName: firstName,
                lastName: lastName,
                bio: bio,
                facebook: facebook,
                instagram: instagram,
                tiktok: tiktok,
                linkedin: linkedin,
            }),
        })
            .then((response) => {
                if (response.ok) {
                    window.location.replace("/profile/me");
                }
            });
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchAccount();
    }, []);

    if (!account) {
        return (
            <>Loading...</>
        );
    };

    return (
        <div id="create-course-main" className="text-align-center margin-bottom-20">
            <h1>Hello, <span className="blue">{account.user.username}</span></h1>
            <br />
            <div className="create-course-label-box">
                First name
            </div>
            <input className="create-course-input-text" placeholder="First name" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <div className="create-course-label-box">
                Last name
            </div>
            <input className="create-course-input-text" placeholder="Last name" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <div className="create-course-label-box">
                Bio
            </div>
            <input className="create-course-input-text" placeholder="Bio" type="text" value={bio} onChange={(e) => setBio(e.target.value)} />
            <div className="create-course-label-box">
                Facebook full link
            </div>
            <input className="create-course-input-text" placeholder="Facebook link" type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            <div className="create-course-label-box">
                Instagram full link
            </div>
            <input className="create-course-input-text" placeholder="Instagram link" type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <div className="create-course-label-box">
                Tiktok full link
            </div>
            <input className="create-course-input-text" placeholder="Tiktok link" type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
            <div className="create-course-label-box">
                LinkedIn full link
            </div>
            <input className="create-course-input-text" placeholder="LinkedIn link" type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            <br />
            <button className="create-course-step-button" type="button" onClick={handleSetup}>Save</button>
            <a href="/profile/me">
                <button className="create-course-step-button">
                    Skip for now
                </button>
            </a>
        </div>
    );
}
