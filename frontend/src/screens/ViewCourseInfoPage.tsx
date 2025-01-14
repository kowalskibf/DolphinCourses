import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, isUserLoggedIn, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';
import StarsInput from '../components/StarsInput';
import Stars from '../components/Stars';
import "../styles/ViewCourseInfoPage.css";

type Params = {
    id: string;
}

export default function ViewCourseInfoPage() {

    const { id } = useParams<Params>();
    const [courseAccess, setCourseAccess] = useState<CourseAccess>();
    const [course, setCourse] = useState<Course>();

    const [hasAccess, setHasAccess] = useState<boolean>(false);
    const [hasAtLeastExpiredAccess, setHasAtLeastExpiredAccess] = useState<boolean>(false);

    const [reviewRating, setReviewRating] = useState<number>(5);
    const [reviewComment, setReviewComment] = useState<string>("");

    const [reviewed, setReviewed] = useState<boolean>(false);

    const [allReviews, setAllReviews] = useState<Review[]>([]);

    const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

    const fetchLoggedIn = async () => {
        setLoggedIn(await isUserLoggedIn())
    }

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
                    setHasAtLeastExpiredAccess(true);
                    return response.json();
                } else if (response.status === 410) {
                    setHasAccess(false);
                    setHasAtLeastExpiredAccess(true);
                    return { "access": false };
                } else {
                    setHasAccess(false);
                    setHasAtLeastExpiredAccess(false);
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
                    setReviewRating(parseFloat(data.rating));
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
                setReviewRating(5.0);
                setReviewComment("");
                fetchMyReview();
                fetchAllReviews();
            });
    }

    useEffect(() => {
        fetchLoggedIn();
        fetchCourse();
        fetchCourseAccess();
        fetchMyReview();
        fetchAllReviews();
    }, []);

    if (!course || !courseAccess || loggedIn === null) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="view-course-info-main-container">
            {hasAccess && (
                <a href="/learn">
                    <button className="view-course-info-button">
                        Back to Learn
                    </button>
                </a>
            )}
            <a href="/explore">
                <button className="view-course-info-button">
                    Back to Explore
                </button>
            </a>
            {hasAccess && (
                <a href={`/course/${id}/view`}>
                    <button className="view-course-info-button">
                        View course content
                    </button>
                </a>
            )}
            {hasAtLeastExpiredAccess && (
                <a href={`/course/${id}/view/topics`}>
                    <button className="view-course-info-button">
                        View my topics
                    </button>
                </a>
            )}
            {loggedIn && courseAccess.obtaining_type != 'author' && (
                <a href={`/course/${id}/view/access`}>
                    <button className="view-course-info-button">
                        Manage access
                    </button>
                </a>
            )}
            <br />
            {hasAccess && courseAccess.obtaining_type != 'author' && (
                <>
                    You <span className="blue">have</span> access till {new Date(courseAccess.expires).toLocaleString()}
                </>
            )}
            {!hasAccess && loggedIn && (
                <>
                    You <span className="red">do not have</span> access, go to
                    {" "}<a href={`/course/${id}/view/access`}>Manage access</a>
                    <br />
                </>
            )}
            <br />
            <br />
            {course.image ? (
                <img className="view-course-info-img" src={MEDIA_URL + course.image} id="course-image" />
            ) : (
                <span className="gray">No image set.</span>
            )}
            <h1>{course.name}</h1>
            <span className="gray"><ContentRenderer content={course.description} /></span>
            <br />

            <br />
            <span className="gray">Language:&nbsp;</span>
            {(() => {
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
            })()}
            <br />
            <span className="gray">Duration:&nbsp;</span>
            {course.duration} hours <br />
            <span className="gray">
                {(() => {
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
                &nbsp;
                {new Date(course.promo_expires) > new Date ? (
                    <>
                        <s>{intToPrice(course.price)}</s>
                        {intToPrice(course.promo_price)}
                        <br />
                        Promo expires {formatDateTimeLocal(new Date(course.promo_expires))}
                    </>
                ) : (
                    <>
                        {intToPrice(course.price)}
                    </>
                )}
            </span>
            <br />
            <br />
            <a href={`/profile/${course.author.user.username}`} target='_blank'>
                <div className="explore-author">
                    <img className="explore-avatar-mini" src={MEDIA_URL + (course.author.avatar ? course.author.avatar : "/media/default_avatar.png")} />
                    <div className="explore-course-author-username">{course.author.user.username}</div>
                </div>
            </a>

            <br />
            <h2>Reviews</h2>
            <br />
            {hasAccess && (
                <div className="view-course-info-my-review-box">
                    <h3>My review</h3>
                    <div className="view-course-info-my-review-stars-box">
                        <StarsInput onRatingChange={setReviewRating} initialRating={reviewed ? reviewRating : 5.0} />
                    </div>
                    <textarea className="create-course-input-text resize-none" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
                    <br />
                    <button className="view-course-info-button" type="button" onClick={() => handlePostPutReview(reviewed ? "PUT" : "POST")}>{reviewed ? "Change my review" : "Review"}</button>
                    {reviewed && (
                        <button className="view-course-info-button" type="button" onClick={handleDeleteReview} >Remove my review</button>
                    )}
                </div>
            )}
            <h3>All reviews</h3>
            <div className="view-course-info-reviews-bo">
                {allReviews.map((review, i) => (
                    <div className="view-course-info-review-box " key={i}>
                        <div className="view-course-info-review-stars-box">
                            <Stars value={review.rating} />
                            &nbsp;&nbsp;&nbsp;
                            <span className="gray">
                                {review.author.user.username}
                                &nbsp;&nbsp;&nbsp;
                                {timeAgo(new Date(review.date))}
                            </span>
                        </div>
                        {review.comment} <br />
                    </div>
                ))}
            </div>


        </div>
    )
};