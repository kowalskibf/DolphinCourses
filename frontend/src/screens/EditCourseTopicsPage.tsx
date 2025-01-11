import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';

type Params = {
    id: string;
}

export default function EditCourseTopicsPage() {

    const { id } = useParams<Params>();
    const [topics, setTopics] = useState<CourseTopic[]>([]);
    const [topic, setTopic] = useState<string>("");

    const [editedTopic, setEditedTopic] = useState<string>("");

    const handleEditTopicValue = (value: string) => {

    }

    const fetchTopics = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/topics`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setTopics(data));
    };

    const handleCreateTopic = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/topic`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                topic: topic,
            }),
        }).then(() => {
            fetchTopics();
            setTopic("");
        });
    }

    const handleDeleteTopic = async (topic_id: number) => {
        const response = await fetch(`http://127.0.0.1:8000/api/coursetopic/${topic_id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        }).then(() => {
            fetchTopics();
        });
    }

    const handleEditTopic = async (topic_id: number, new_topic: string) => {
        const response = await fetch(`http://127.0.0.1:8000/api/coursetopic/${topic_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                topic: new_topic,
            }),
        }).then(() => {
            fetchTopics();
        });
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchTopics();
    }, []);

    if (topics === undefined) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <a href={`/course/${id}/edit/info`}>Back</a>
            <br />
            new topic: <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <button type="button" onClick={handleCreateTopic}>Create topic</button>
            <br />
            {topics.map((topic, i) => (
                <>
                    <input type="text" defaultValue={topic.topic} onBlur={(e) => handleEditTopic(topic.id, e.target.value)} /> <button type="button" onClick={() => handleDeleteTopic(topic.id)}>Delete</button>
                    <br />
                </>
            ))}

        </>
    )

}