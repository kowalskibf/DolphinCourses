import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/EditCourseMembersPage.css";

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
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchCourseAccesses();
    }, []);

    if (!courseAccesses) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="edit-course-members-main">
            <a href={`/course/${id}/edit/info`}>
                <button className="edit-course-members-button">
                    Back to edit course
                </button>
            </a>
            <div className="edit-course-members-header">Invite a new member</div>
            <div className="edit-course-members-label-box">
                Username:&nbsp;<input className="edit-course-members-input-text" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="edit-course-members-label-box">
                Expires:&nbsp;<input type="datetime-local" value={formatDateTimeLocal(new Date(expires))} onChange={(e) => setExpires(new Date(e.target.value))} />
            </div>
            <button className="edit-course-members-button" type="button" onClick={handleInvite}>Invite</button>
            <div className="edit-course-members-header">Invited members</div>
            {courseAccesses.map((courseAccess) => (
                <div className="edit-course-members-member-container">
                    <div className="edit-course-members-member-container-left">
                        <img className="edit-course-members-avatar" src={MEDIA_URL + (courseAccess.account.avatar ? courseAccess.account.avatar : "/media/default_avatar.png")} />
                    </div>
                    <div className="edit-course-members-member-container-right">
                        <div className="edit-course-members-member-container-right-half">
                            &nbsp;{courseAccess.account.user.username}
                        </div>
                        <div className="edit-course-members-member-container-right-half">
                            &nbsp;Expires:&nbsp;
                            <input
                                type="datetime-local"
                                value={formatDateTimeLocal(new Date(courseAccess.expires))}
                                onChange={(e) => handleEditExpirationDate(courseAccess.id, new Date(e.target.value))}
                            />
                            <div className="edit-course-members-revoke-container">
                                <button className="edit-course-members-button-mini" type="button" onClick={() => handleRevokeAccess(courseAccess.id)}>Revoke access</button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

        </div>
    )
};