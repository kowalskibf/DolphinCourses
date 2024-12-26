import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';

type Params = {
    id: string;
}

export default function EditCourseMembersPage() {

    const { id } = useParams<Params>();
    const [courseAccesses, setCourseAccesses] = useState<CourseAccess[]>();

    const [username, setUsername] = useState<string>("");
    const [expires, setExpires] = useState<Date>(() => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
    });

    const fetchCourseAccesses = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/accesses`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setCourseAccesses(data));
    };

    const handleInvite = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/access/gift`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                username: username,
                expires: formatDateToBackend(expires),
            }),
        })
            .then((response) => fetchCourseAccesses());
    }

    const handleEditExpirationDate = async (courseAccessId: number, newDate: Date) => {
        const response = await fetch(`http://127.0.0.1:8000/api/courseaccess/${courseAccessId}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                expires: formatDateToBackend(newDate),
            }),
        })
            .then((response) => fetchCourseAccesses());
    }

    const handleRevokeAccess = async (courseAccessId: number) => {
        const response = await fetch(`http://127.0.0.1:8000/api/courseaccess/${courseAccessId}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => fetchCourseAccesses());
    }



    useEffect(() => {
        fetchCourseAccesses();
    }, []);

    if (!courseAccesses) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href={`/course/${id}/edit/info`}>Back</a>
            <br />
            <h1>Grant access a new member</h1>
            Username: <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            Expires: <input type="datetime-local" value={formatDateTimeLocal(new Date(expires))} onChange={(e) => setExpires(new Date(e.target.value))} />
            <button type="button" onClick={handleInvite}>Invite</button>
            <h1>Edit course members</h1>
            {courseAccesses.map((courseAccess) => (
                <>
                    Username:
                    {" "}
                    {courseAccess.account.user.username}
                    {" "}
                    Expires:
                    {" "}
                    <input
                        type="datetime-local"
                        value={formatDateTimeLocal(new Date(courseAccess.expires))}
                        onChange={(e) => handleEditExpirationDate(courseAccess.id, new Date(e.target.value))}
                    />
                    {" "}
                    <button type="button" onClick={() => handleRevokeAccess(courseAccess.id)}>Revoke access</button>
                    <br />
                </>
            ))}

        </>
    )
};