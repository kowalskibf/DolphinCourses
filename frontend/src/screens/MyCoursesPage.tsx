import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import "../styles/MyCoursesPage.css";
import { formatAmount, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { LANGUAGES, MEDIA_URL } from '../constants';

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [account, setAccount] = useState<Account>();

    const [searchQuery, setSearchQuery] = useState<string>("");

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

    const fetchCourses = async () => {
        fetch("http://127.0.0.1:8000/api/courses/my", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setCourses(data));
    };

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchAccount();
        fetchCourses();
    }, []);

    if (!account || !courses) {
        return (
            <>
                Loading...
            </>
        )
    }

    if (courses.length === 0) {
        return (
            <>
                You have no courses yet. <a href="/course/new">Create a new course!</a>
            </>
        )
    }

    return (
        <div id="main-container">
            <h1>My courses</h1>
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
                    <a href="/course/new">
                        <button type="button" className="create-new-button">+ Create a new course</button>
                    </a>
                </div>
            </div>
            <div id="courses-container">
                {courses.filter((c) => c.name.includes(searchQuery)).map((course) => (
                    <a href={`/course/${course.id}/edit/info`}>
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
                                Language: {LANGUAGES.find(lang => lang[0] === course.language)?.[2]} {LANGUAGES.find(lang => lang[0] === course.language)?.[1]} <br />
                                Duration: {course.duration} hours <br />
                                Last updated {timeAgo(new Date(course.last_updated))} <br />
                                {course.is_public ? "Public" : "Private"} <br />
                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )

}