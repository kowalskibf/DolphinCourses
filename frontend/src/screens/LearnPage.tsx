import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/LearnPage.css";


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
        <div id="learn-main-container">
            <div id="learn-header">
                <h1>Learn</h1>
                <br />
                Search by course name
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="learn-search-input"
                />
            </div>
            <div id="learn-courses-container">
                {courseAccesses.map((ca) => ca.course).filter((course) => course.name.includes(searchQuery) && course.is_public).map((course) => (
                    <a href={`/course/${course.id}/view/info`}>
                        <div className="learn-course">
                            <div className="learn-course-img-container">
                                {course.image ? (
                                    <img
                                        className="learn-course-img"
                                        src={MEDIA_URL + course.image}
                                    />
                                ) : (
                                    <div className="learn-img-alt">
                                        No image
                                    </div>
                                )}
                            </div>
                            <span className="learn-course-name">
                                {course.name}
                            </span>
                            <br />
                            <span className="learn-minor-text">
                                <div className="learn-author">
                                    <img className="learn-avatar-mini" src={MEDIA_URL + (course.author.avatar ? course.author.avatar : "/media/default_avatar.png")} />
                                    <div className="learn-course-author-username">{course.author.user.username}</div>
                                </div>
                                Language: {LANGUAGES.find(lang => lang[0] === course.language)?.[2]} {LANGUAGES.find(lang => lang[0] === course.language)?.[1]} <br />
                                Duration: {course.duration} hours <br />
                                {/* Last updated {timeAgo(new Date(course.last_updated))} <br /> */}

                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
};