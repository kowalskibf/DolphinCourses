import React, { useEffect, useState } from 'react';
import '../App.css';

export default function ProfileSetupPage() {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [bio, setBio] = useState<string>("");
    const [facebook, setFacebook] = useState<string>("");
    const [instagram, setInstagram] = useState<string>("");
    const [tiktok, setTiktok] = useState<string>("");
    const [linkedin, setLinkedin] = useState<string>("");

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

    return (
        <>
            hello, setup your profile
            <br />
            <form onSubmit={(e) => e.preventDefault()}>
                <br />
                first name:
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <br />
                last name:
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                <br />
                bio:
                <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} />
                <br />
                fb:
                <input type="text" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                <br />
                ig:
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                <br />
                tt:
                <input type="text" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
                <br />
                li:
                <input type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                <br />
                <button type="button" onClick={handleSetup}>Save</button>
            </form>
            <br />
            <a href="/profile/me">Skip for now</a>
        </>
    );
}
