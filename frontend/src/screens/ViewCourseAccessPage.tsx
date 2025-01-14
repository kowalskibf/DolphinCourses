import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';
import "../styles/ViewCourseAccessPage.css";

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

    useEffect(() => console.log(hasAccess), [hasAccess]);

    if (!courseAccess) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="create-course-main" className="text-align-center">
            <div className="create-course-label-box">
                <h2>
                    <span className="gray">
                        Status of Your access to
                        {hasAccess ? (
                            <>&nbsp;</>
                        ) : (
                            <> the course</>
                        )}
                    </span>
                    {courseAccess.course && (
                        <>{courseAccess.course.name}</>
                    )}
                </h2>
            </div>
            {hasAccess ? (
                <>
                    You <span className="blue">have</span> access till {new Date(courseAccess.expires).toLocaleString()}
                    <br />
                    <br />
                    Extend access till:
                </>
            ) : (
                <>
                    You <span className="red">do not have</span> access.
                    <br />
                    <br />
                    Buy course till:
                </>
            )}
            <br />
            <br />
            <input type="datetime-local" value={formatDateTimeLocal(new Date(expires))} onChange={(e) => setExpires(new Date(e.target.value))} />
            <br />
            <br />
            <button className="create-course-step-button" type="button" onClick={handleExtendAccess}>Extend</button>
            <a href={`/course/${id}/view/info`}>
                <button className="create-course-step-button">
                    Back to course info
                </button>
            </a>

        </div>
    )
};