import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, isUserLoggedIn, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';
import StarsInput from '../components/StarsInput';
import Stars from '../components/Stars';

type Params = {
    id: string;
}

export default function ViewCourseInfoPage() {

    const { id } = useParams<Params>();
    const [courseAccess, setCourseAccess] = useState<CourseAccess>();
    const [course, setCourse] = useState<Course>();

    const [hasAccess, setHasAccess] = useState<boolean>(false);

    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState<string>("");

    const [reviewed, setReviewed] = useState<boolean>(false);

    const [allReviews, setAllReviews] = useState<Review[]>([]);

    const [loggedIn, setLoggedIn] = useState<boolean>(false);

    const fetchCourse = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => setCourse(data));
    };

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

    const fetchMyReview = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/review`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                if (response.ok) {
                    setReviewed(true);
                    return response.json();
                } else {
                    setReviewed(false);
                    return null;
                }
            })
            .then((data) => {
                if (data) {
                    setReviewRating(data.rating);
                    setReviewComment(data.comment);
                }
            });
    };

    const fetchAllReviews = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/reviews`, {
            method: "GET",
        })
            .then((response) => response.json())
            .then((data) => setAllReviews(data));
    }

    const handlePostPutReview = async (method: "POST" | "PUT") => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/review`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                rating: reviewRating,
                comment: reviewComment,
            }),
        })
            .then((response) => {
                fetchMyReview();
                fetchAllReviews();
            });
    }

    const handleDeleteReview = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/review`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                fetchMyReview();
                fetchAllReviews();
            });
    }

    useEffect(() => {
        fetchCourse();
        fetchCourseAccess();
        fetchMyReview();
        fetchAllReviews();
    }, []);

    if (!course || !courseAccess) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            {hasAccess && (
                <>
                    <a href="/learn">Back to Learn</a>
                    <br />
                </>
            )}
            <a href="/explore">Back to Explore</a>
            <br />
            {hasAccess ? (
                <>
                    You have access till {new Date(courseAccess.expires).toLocaleString()}
                    <br />
                    <a href={`/course/${id}/view`}>View course content</a>
                    <br />
                    <a href={`/course/${id}/view/topics`}>View my topics</a>
                    <br />
                    <a href={`/course/${id}/view/access`}>Manage access</a>
                    <br />
                </>
            ) : (
                <>
                    You do not have access, go to
                    {" "}<a href={`/course/${id}/view/access`}>Manage access</a>
                    <br />
                </>
            )}
            <h1>Course information</h1>
            Name: {course.name} <br />
            Description: <ContentRenderer content={course.description} /> <br />
            Image: <img src={MEDIA_URL + course.image} id="course-image" /> <br />
            Language: {(() => {
                const languageEntry = LANGUAGES.find(([code]) => code === course.language);
                if (languageEntry) {
                    const [code, name, flag] = languageEntry;
                    return (
                        <>
                            {flag}&nbsp;{name}
                        </>
                    );
                } else {
                    return "Unknown Language";
                }
            })()} <br />
            Duration: {course.duration} hours <br />
            Currency: {(() => {
                const currencyEntry = CURRENCIES.find(([code]) => code === course.price_currency);
                if (currencyEntry) {
                    const [code, flag] = currencyEntry;
                    return (
                        <>
                            {flag}&nbsp;{code}
                        </>
                    );
                } else {
                    return "Unknown Currency";
                }
            })()}
            {new Date(course.promo_expires) > new Date ? (
                <>
                    <s>{course.price}</s>
                    {course.promo_price}
                    <br />
                    Promo expires {formatDateTimeLocal(new Date(course.promo_expires))}
                </>
            ) : (
                <>
                    {course.price}
                </>
            )} <br />
            <a href={`/profile/${course.author.user.username}`} target='_blank'>
                <img className="avatar-mini" src={MEDIA_URL + (course.author.avatar ? course.author.avatar : "/media/default_avatar.png")} />
                {course.author.user.username}
            </a>
            <br />
            <h2>Reviews</h2>
            {hasAccess && (
                <>
                    <h3>My review</h3>
                    <StarsInput onRatingChange={setReviewRating} initialRating={reviewed ? reviewRating : 5.0} />
                    Comment
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    <button type="button" onClick={() => handlePostPutReview(reviewed ? "PUT" : "POST")}>{reviewed ? "Change my review" : "Review"}</button>
                    {reviewed && (
                        <button type="button" onClick={handleDeleteReview} >Delete my review</button>
                    )}
                </>
            )}
            <h3>All reviews</h3>
            {allReviews.map((review) => (
                <>
                    <Stars value={review.rating} />
                    <span className="gray">{review.author.user.first_name}</span>&nbsp;
                    {timeAgo(new Date(review.date))}
                    <br />
                    {review.comment} <br />
                </>
            ))}


        </>
    )
};