import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';
import "../styles/ViewCourseTopicsPage.css";

type Params = {
    id: string;
}

export default function ViewCourseTopicsPage() {

    const { id } = useParams<Params>();
    const [accountTopics, setAccountTopics] = useState<AccountTopic[]>([]);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortMethod, setSortMethod] = useState<string>("default");

    const sortTopics = (topics: AccountTopic[]) => {
        switch (sortMethod) {
            case "default":
                return topics;
            case "highestRating":
                return [...topics].sort((a, b) => b.value - a.value);
            case "lowestRating":
                return [...topics].sort((a, b) => a.value - b.value);
            case "alphabetical":
                return [...topics].sort((a, b) => a.course_topic.topic.localeCompare(b.course_topic.topic));
            case "alphabeticalDescending":
                return [...topics].sort((a, b) => b.course_topic.topic.localeCompare(a.course_topic.topic));
            default:
                return topics;
        }
    };

    const fetchAccountTopics = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/accounttopics`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setAccountTopics(data));
    };

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchAccountTopics();
    }, []);

    if (!accountTopics) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="view-course-topics-main-container">
            <a href={`/course/${id}/view/info`}>
                <button className="view-course-topics-button">
                    Back to course info
                </button>
            </a>
            <div className="view-course-topics-label-box">
                Search by topic name:&nbsp;
                <input
                    type="text"
                    className="view-course-topics-input-text "
                    placeholder="Topic name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="view-course-topics-label-box">
                Sort topics by:&nbsp;
                <select
                    value={sortMethod}
                    className="view-course-topics-select"
                    onChange={(e) => setSortMethod(e.target.value)}
                >
                    <option value="default">Default</option>
                    <option value="highestRating">Highest rating</option>
                    <option value="lowestRating">Lowest rating</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="alphabeticalDescending">Alphabetical (Descending)</option>
                </select>
            </div>
            <br />
            {sortTopics(accountTopics.filter(accountTopic => accountTopic.course_topic.topic.includes(searchQuery))).map((topic, i) => (
                <>
                    <span className="gray">{topic.course_topic.topic}</span> {topic.value.toFixed(2)}
                    <ProgressBar value={topic.value} />
                    <br />
                </>
            ))}

        </div>
    )

}