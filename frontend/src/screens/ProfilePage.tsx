import React, { useEffect, useState } from 'react';
import '../App.css';
import '../types';
import '../functions';
import { intToPrice, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import Stars from '../components/Stars';
import "../styles/ProfilePage.css";

type Params = {
    username: string;
}

export default function ProfilePage() {

    const { username } = useParams<Params>();
    const [account, setAccount] = useState<AccountWithCourses>();

    const fetchAccount = async () => {
        fetch(`http://127.0.0.1:8000/api/profile/${username}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.json())
            .then((data) => setAccount(data));
    };

    useEffect(() => {
        fetchAccount();
    }, [])

    if (!account) {
        return (
            <>Loading...</>
        );
    }

    return (
        <div id="my-profile-main-container">
            <div id="my-profile-header">
                <div className="my-profile-header-half">
                    <img className="my-profile-avatar-img" src={MEDIA_URL + (account.avatar ? account.avatar : "/media/default_avatar.png")} />
                </div>
                <div className="my-profile-header-half profile-page-right-half">
                    <span className="my-profile-header-text">
                        <span className="blue">{account.user.username}</span>
                        <br />
                        <span className="gray">Joined&nbsp;</span>{timeAgo(new Date(account.user.date_joined))}
                    </span>
                </div>
            </div>
            <br />
            <span className="gray">{account.bio}</span>
            <br />
            <br />
            {account.socials.facebook.length ? (
                <a href={account.socials.facebook} target='_blank'>
                    <span className="blue">
                        Facebook
                    </span>
                </a>
            ) : (
                <span className="gray">Facebook profile link not set.</span>
            )}
            <br />
            {account.socials.instagram.length ? (
                <a href={account.socials.instagram} target='_blank'>
                    <span className="blue">
                        Instagram
                    </span>
                </a>
            ) : (
                <span className="gray">Instagram profile link not set.</span>
            )}
            <br />
            {account.socials.tiktok.length ? (
                <a href={account.socials.tiktok} target='_blank'>
                    <span className="blue">
                        Tiktok
                    </span>
                </a>
            ) : (
                <span className="gray">Tiktok profile link not set.</span>
            )}
            <br />
            {account.socials.linkedin.length ? (
                <a href={account.socials.linkedin} target='_blank'>
                    <span className="blue">
                        LinkedIn
                    </span>
                </a>
            ) : (
                <span className="gray">LiniedIn profile link not set.</span>
            )}
            <br />
            <br />
            <div className="profile-page-courses-header">{account.user.username}<span className="gray">'s courses</span></div>
            {account.courses.sort((a, b) => b.average_rating - a.average_rating).map((course => (
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
            )))}
        </div>
    );
}