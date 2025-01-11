import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';


export default function LearnPage() {

    const [courseAccesses, setCourseAccesses] = useState<CourseAccess[]>();

    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchCourseAccesses = async () => {
        fetch(`http://127.0.0.1:8000/api/courseaccesses/my`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setCourseAccesses(data));
    };


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
        <div id="main-container">
            <h1>Learn</h1>
            <div id="header">
                <div id="header-left">
                    Search by course name
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        className="search-input"
                    />
                </div>
                <div id="header-right">
                </div>
            </div>
            <div id="courses-container">
                {courseAccesses.map((ca) => ca.course).filter((course) => course.name.includes(searchQuery) && course.is_public).map((course) => (
                    <a href={`/course/${course.id}/view/info`}>
                        <div className="course">
                            <div className="course-img-container">
                                <img
                                    className="course-img"
                                    src={MEDIA_URL + course.image}
                                />
                            </div>
                            <span className="course-name">
                                {course.name}
                            </span>
                            <br />
                            <span className="course-minor-text">
                                <img className="avatar-mini" src={MEDIA_URL + (course.author.avatar ? course.author.avatar : "/media/default_avatar.png")} />
                                {course.author.user.username} <br />
                                Language: {LANGUAGES.find(lang => lang[0] === course.language)?.[2]} {LANGUAGES.find(lang => lang[0] === course.language)?.[1]} <br />
                                Duration: {course.duration} hours <br />
                                Last updated {timeAgo(new Date(course.last_updated))} <br />

                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
};