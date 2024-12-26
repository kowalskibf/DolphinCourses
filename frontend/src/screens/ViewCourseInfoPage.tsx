import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    id: string;
}

export default function ViewCourseInfoPage() {

    const { id } = useParams<Params>();
    const [courseAccess, setCourseAccess] = useState<CourseAccess>();
    const [course, setCourse] = useState<Course>();

    const [hasAccess, setHasAccess] = useState<boolean>(false);

    const fetchCourse = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setCourse(data))
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

    useEffect(() => {
        fetchCourse();
        fetchCourseAccess();
    }, []);

    if (!course || !courseAccess) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href="/learn">Back to Learn</a>
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
                    <a href={`/course/${id}/view/access`}>Manage access</a>
                    <br />
                </>
            )}
            <h1>Edit course information</h1>
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


        </>
    )
};