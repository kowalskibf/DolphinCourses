import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    id: string;
}

export default function ViewCourseAccessPage() {

    const { id } = useParams<Params>();
    const [courseAccess, setCourseAccess] = useState<CourseAccess>();

    const [hasAccess, setHasAccess] = useState<boolean>(false);

    const [expires, setExpires] = useState<Date>(() => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 7);
        return newDate;
    });

    const fetchCourseAccess = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/access`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    setHasAccess(true);
                    return response.json();
                } else {
                    setHasAccess(false);
                    return { "access": false };
                }
            })
            .then((data) => setCourseAccess(data));
    };

    const handleExtendAccess = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/access`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                expires: formatDateToBackend(expires),
            })
        })
            .then((response) => fetchCourseAccess());
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchCourseAccess();
    }, []);

    if (!courseAccess) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href={`/course/${id}/view/info`}>Back to course info</a>
            <br />
            {hasAccess ? (
                <>
                    You have access till {new Date(courseAccess.expires).toLocaleString()}
                    <br />
                    Extend access till:
                </>
            ) : (
                <>
                    You do not have access.
                    <br />
                    Buy course till:
                </>
            )}
            <input type="datetime-local" value={formatDateTimeLocal(new Date(expires))} onChange={(e) => setExpires(new Date(e.target.value))} />
            <button type="button" onClick={handleExtendAccess}>Extend</button>

        </>
    )
};