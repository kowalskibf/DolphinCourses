import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import Stars from '../components/Stars';
import "../styles/ExplorePage.css";

export default function ExplorePage() {
    const [courses, setCourses] = useState<CourseWithReviews[]>();
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortMethod, setSortMethod] = useState<string>("highestRating");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("any");

    const fetchCourses = async () => {
        fetch(`http://127.0.0.1:8000/api/courses/all`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
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
        <div id="explore-main-container">
            <h1>Explore</h1>
            <div id="explore-header">
                <div id="explore-header-left">
                    Search course by name
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search"
                        className="explore-search-input"
                    />
                </div>
                <div id="explore-header-right">
                    <select
                        value={sortMethod}
                        onChange={(e) => setSortMethod(e.target.value)}
                        className="explore-select"
                    >
                        <option value="highestRating">Highest Rating</option>
                        <option value="lastUpdated">Last Updated</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="alphabeticalDescending">Alphabetical (Descending)</option>
                        <option value="priceAscending">Price (Ascending)</option>
                        <option value="priceDescending">Price (Descending)</option>
                    </select>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="explore-select"
                    >
                        <option value="any">Any language</option>
                        {LANGUAGES.map(([code, name, flag]) => (
                            <option key={code} value={code}>
                                {flag}&nbsp;{name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div id="explore-courses-container">
                {sortCourses(courses.filter((course) => course.name.includes(searchQuery) && (selectedLanguage == "any" || course.language == selectedLanguage) && course.is_public)).map((course) => (
                    <a href={`/course/${course.id}/view/info`} key={course.id}>
                        <div className="explore-course">
                            <div className="explore-course-img-container">
                                {course.image ? (
                                    <img
                                        className="explore-course-img"
                                        src={MEDIA_URL + course.image}
                                    />
                                ) : (
                                    <div className="explore-img-alt">
                                        No image
                                    </div>
                                )}
                            </div>
                            <div className="explore-course-name">
                                {course.name}
                            </div>
                            <br />
                            <span className="explore-course-minor-text">
                                <div className="explore-author">
                                    <img className="explore-avatar-mini" src={MEDIA_URL + (course.author.avatar ? course.author.avatar : "/media/default_avatar.png")} />
                                    <div className="explore-course-author-username">{course.author.user.username}</div>
                                </div>
                                Language: {LANGUAGES.find(lang => lang[0] === course.language)?.[2]} {LANGUAGES.find(lang => lang[0] === course.language)?.[1]} <br />
                                Duration: {course.duration} hours <br />
                                {/* Last updated {timeAgo(new Date(course.last_updated))} <br /> */}
                                <div className="explore-rating-box">
                                    {course.average_rating.toFixed(1)}&nbsp;
                                    <Stars value={course.average_rating} />
                                    &nbsp;({course.reviews.length})
                                </div>
                                {course.price == 0 ? (
                                    <span className="red">Free</span>
                                ) : (
                                    <>
                                        {CURRENCIES.find(curr => curr[0] === course.price_currency)?.[1]} {course.price_currency}{" "}
                                        {new Date(course.promo_expires) > new Date() ? (
                                            <>
                                                <span style={{ textDecoration: "line-through", color: "gray" }}>
                                                    {intToPrice(course.price)}
                                                </span>{" "}
                                                <span className="red">{intToPrice(course.promo_price)}</span>
                                            </>
                                        ) : (
                                            intToPrice(course.price)
                                        )}
                                    </>
                                )}


                            </span>
                        </div>
                    </a>
                ))}
            </div>
        </div >
    );
}
