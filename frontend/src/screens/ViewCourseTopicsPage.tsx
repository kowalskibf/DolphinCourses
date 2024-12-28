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
            {accountTopics.map((topic, i) => (
                <>
                    {topic.course_topic.topic} {topic.value.toFixed(2)}
                    <ProgressBar value={topic.value} />
                    <br />
                </>
            ))}

        </>
    )

}