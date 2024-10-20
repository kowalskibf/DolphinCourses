import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { timeAgo } from '../functions';

export default function MyCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [account, setAccount] = useState<Account>();

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
        <>
            <h1>My courses</h1>
            {courses.map((course) => (
                <>
                    <div>
                        id: {course.id} <br />
                        author: {course.author.user.first_name} {course.author.user.last_name} {"(" + course.author.user.username + ")"} <br />
                        author img: {course.author.avatar ? "ma awatar" : "nie ma awataru"} <br />
                        name: {course.name} <br />
                        description: {course.description} <br />
                        image: {course.image ? "jest zdj" : "nie ma zdj"} <br />
                        language: {course.language} <br />
                        duration: {course.duration} <br />
                        last updated: {timeAgo(new Date(course.last_updated))} <br />
                        is public: {course.is_public ? "yes" : "no"} <br />
                        price currency: {course.price_currency} <br />
                        price: {course.price} <br />
                        promo price: {course.promo_price} <br />
                        promo expires: {course.promo_expires} <br />
                    </div>
                </>
            ))}
        </>
    )

}