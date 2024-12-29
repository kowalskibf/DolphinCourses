import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import Stars from '../components/Stars';

export default function ExplorePage() {
    const [courses, setCourses] = useState<CourseWithReviews[]>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortMethod, setSortMethod] = useState<string>("highestRating");

    const fetchCourses = async () => {
        fetch(`http://127.0.0.1:8000/api/courses/all`, {
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
        fetchCourses();
    }, []);

    const sortCourses = (courses: CourseWithReviews[]) => {
        switch (sortMethod) {
            case "highestRating":
                return [...courses].sort((a, b) => b.average_rating - a.average_rating);
            case "lastUpdated":
                return [...courses].sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
            case "alphabetical":
                return [...courses].sort((a, b) => a.name.localeCompare(b.name));
            case "alphabeticalDescending":
                return [...courses].sort((a, b) => b.name.localeCompare(a.name));
            case "priceAscending":
                return [...courses].sort((a, b) => {
                    const priceA = new Date(a.promo_expires) > new Date() ? a.promo_price : a.price;
                    const priceB = new Date(b.promo_expires) > new Date() ? b.promo_price : b.price;
                    return priceA - priceB;
                });
            case "priceDescending":
                return [...courses].sort((a, b) => {
                    const priceA = new Date(a.promo_expires) > new Date() ? a.promo_price : a.price;
                    const priceB = new Date(b.promo_expires) > new Date() ? b.promo_price : b.price;
                    return priceB - priceA;
                });
            default:
                return courses;
        }
    };


    if (!courses) {
        return <>Loading...</>;
    }

    return (
        <div id="main-container">
            <h1>Explore</h1>
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
                    <select
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value)}
                        className="sort-select"
                    >
                        <option value="highestRating">Highest Rating</option>
                        <option value="lastUpdated">Last Updated</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="alphabeticalDescending">Alphabetical (Descending)</option>
                        <option value="priceAscending">Price (Ascending)</option>
                        <option value="priceDescending">Price (Descending)</option>
                    </select>
                </div>
            </div>
            <div id="courses-container">
                {sortCourses(courses.filter((course) => course.name.includes(searchQuery) && course.is_public)).map((course) => (
                    <a href={`/course/${course.id}/view/info`} key={course.id}>
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
                                {course.average_rating.toFixed(1)} <Stars value={course.average_rating} /> ({course.reviews.length})
                                <br />
                                <br />
                                {CURRENCIES.find(curr => curr[0] === course.price_currency)?.[1]} {course.price_currency}{" "}
                                {new Date(course.promo_expires) > new Date() ? (
                                    <>
                                        <span style={{ textDecoration: "line-through", color: "gray" }}>
                                            {intToPrice(course.price)}
                                        </span>{" "}
                                        {intToPrice(course.promo_price)}
                                    </>
                                ) : (
                                    intToPrice(course.price)
                                )}


                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
