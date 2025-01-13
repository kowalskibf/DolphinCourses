import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/EditCourseTopicsPage.css";

type Params = {
    id: string;
}

export default function EditCourseTopicsPage() {

    const { id } = useParams<Params>();
    const [topics, setTopics] = useState<CourseTopic[]>([]);
    const [topic, setTopic] = useState<string>("");

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
        <div id="edit-course-topics-main-container">
            <a href={`/course/${id}/edit/info`}>
                <button className="edit-course-topics-button">
                    Back to course info
                </button>
            </a>
            <br />
            <div className="edit-course-topics-label-box">
                Add a topic
            </div>
            <input className="edit-course-topics-input-text" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <button className="edit-course-topics-button edit-course-topics-button-small" type="button" onClick={handleCreateTopic}>Create topic</button>
            <br />
            <div className="edit-course-topics-label-box">
                Edit existing topics
            </div>
            {topics.map((topic, i) => (
                <>
                    <input className="edit-course-topics-input-text" type="text" defaultValue={topic.topic} onBlur={(e) => handleEditTopic(topic.id, e.target.value)} />
                    <button className="edit-course-topics-button edit-course-topics-button-small edit-course-topics-button-red" type="button" onClick={() => handleDeleteTopic(topic.id)}>Delete</button>
                    <br />
                </>
            ))}

        </div>
    )

}