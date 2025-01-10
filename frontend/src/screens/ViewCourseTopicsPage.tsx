import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

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
        fetchAccountTopics();
    }, []);

    if (!accountTopics) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href={`/course/${id}/view/info`}>Back</a>
            <br />
            Search:
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <br />
            <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
            >
                <option value="default">Default</option>
                <option value="highestRating">Highest rating</option>
                <option value="lowestRating">Lowest rating</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="alphabeticalDescending">Alphabetical (Descending)</option>
            </select>
            <br />
            {sortTopics(accountTopics.filter(accountTopic => accountTopic.course_topic.topic.includes(searchQuery))).map((topic, i) => (
                <>
                    {topic.course_topic.topic} {topic.value.toFixed(2)}
                    <ProgressBar value={topic.value} />
                    <br />
                </>
            ))}

        </>
    )

}