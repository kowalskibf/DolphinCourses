import React, { useEffect, useState } from 'react';
import '../App.css';
import '../types';
import '../functions';
import { timeAgo } from '../functions';
import { MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import Stars from '../components/Stars';

type Params = {
    username: string;
}

export default function ProfilePage() {

    const { username } = useParams<Params>();
    const [account, setAccount] = useState<AccountWithCourses>();

    const fetchAccount = async () => {
        fetch(`http://127.0.0.1:8000/api/profile/${username}`, {
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

    if (!account) {
        return (
            <>Loading...</>
        );
    }

    return (
        <>
            {account.user.username}
            <br />
            joined {account.user.date_joined}
            <img src={MEDIA_URL + (account.avatar ? account.avatar : "/media/default_avatar.png")} />
            <br />
            fb: {account.socials.facebook}<br />
            ig: {account.socials.instagram}<br />
            tt: {account.socials.tiktok}<br />
            li: {account.socials.linkedin}<br />
            <br />
            <h2>{account.user.username}'s courses</h2>
            {account.courses.sort((a, b) => b.average_rating - a.average_rating).map((course => (
                <div>
                    {course.name}
                    <br />
                    {course.average_rating.toFixed(1)} <Stars value={course.average_rating} /> ({course.reviews.length})
                    <br /><br />
                </div>
            )))}
        </>
    );
}