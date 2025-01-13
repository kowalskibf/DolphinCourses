import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import "../styles/MyElementsPage.css";
import { MEDIA_URL, TYPES } from '../constants';
import ContentRenderer from '../components/ContentRenderer';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';



export default function MyElementsPage() {
    const [elements, setElements] = useState<CourseElement[]>([]);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterTypes, setFilterTypes] = useState<string[]>(["text", "image", "video", "example", "assignment", "exam", "module"]);

    const handleFilterToggle = (type: string) => {
        if (!filterTypes.includes(type))
            setFilterTypes([...filterTypes, type]);
        else
            setFilterTypes(filterTypes.filter(item => item !== type));
        console.log(filterTypes);
    }

    const fetchElements = async () => {
        fetch("http://127.0.0.1:8000/api/elements/my", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setElements(data));
    };

    const handleCopyElement = async (element_id: number) => {
        fetch(`http://127.0.0.1:8000/api/element/${element_id}/copy`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => fetchElements());
    }

    const handleDeleteElement = async (element_id: number) => {
        fetch(`http://127.0.0.1:8000/api/element/${element_id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => fetchElements());
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchElements();
    }, []);

    if (!elements) {
        return (
            <>
                Loading...
            </>
        )
    }

    if (elements.length === 0) {
        return (
            <>
                You have no elements. <a href="/element/new">Create a new element!</a>
            </>
        )
    }

    return (
        <div id="main-container">
            <div id="main-left">
                <a href="/element/new" target='_blank'>
                    <div className="add-button">
                        <img src="/media/icon_plus.png" className="add-button-img" />
                        <div className="add-button-text">Create a new element</div>
                    </div>
                </a>
                <div className="search-container">
                    Search by name
                    <input type="text" className="search-input" placeholder="Enter the name to search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="filter-container">
                    <div className="filter-top">Filter by type</div>
                    <div className="filter-grid">
                        {TYPES.map((type, i) => (
                            <div
                                key={i}
                                className={type + '-element any-element filter-type' + (filterTypes.includes(type) ? "" : " filter-type-disabled")}
                                onClick={() => handleFilterToggle(type)}
                            >
                                {type.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div id="main-right">
                <button type="button" onClick={fetchElements}>Refresh</button>
                {elements
                    .filter((element) =>
                        element.name.includes(searchQuery)
                        &&
                        filterTypes.includes(element.type))
                    .map((element) => (
                        <div
                            key={element.id}
                            className={element.type + '-element any-element element-margin'}
                        >
                            <div className={element.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                {element.name}
                            </div>
                            {element.type === 'text' ?
                                <div className="element-content-center">
                                    <ContentRenderer content={element.data.content} />
                                </div>
                                : ""}
                            {element.type === 'image' ?
                                <div className="element-content-center">
                                    <img
                                        className="element-media"
                                        src={MEDIA_URL + element.data.image}
                                    />
                                    <br />
                                    <ContentRenderer content={element.data.description} />
                                </div>
                                : ""}
                            {element.type === 'video' ?
                                <div className="element-content-center">
                                    <video
                                        controls
                                        src={MEDIA_URL + element.data.video}
                                        className="element-media"
                                    />
                                    <br />
                                    <ContentRenderer content={element.data.description} />
                                </div>
                                : ""}
                            {element.type === 'example' ?
                                <div className="element-content-center">
                                    Question: <ContentRenderer content={element.data.question} />
                                    <br />
                                    Image: <img src={MEDIA_URL + element.data.image} />
                                    <br />
                                    Explanation: <ContentRenderer content={element.data.explanation} />
                                    <br />
                                    Explanation image: <img src={MEDIA_URL + element.data.explanation_image} />
                                </div>
                                : ""}
                            {element.type === 'assignment' ?
                                <>
                                    Question: <ContentRenderer content={element.data.question} />
                                    <br />
                                    Image: <img src={MEDIA_URL + element.data.image} />
                                    <br />
                                    {element.data.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                    <br />
                                    {element.data.hide_answers ? "Answers hidden" : "Answers visible"}
                                    <br />
                                    Answers:
                                    {element.data.answers.map((answer, i) => (
                                        <li key={i}>
                                            <ContentRenderer content={answer} /> {element.data.correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                        </li>
                                    ))}
                                    Explanation: <ContentRenderer content={element.data.explanation} />
                                    <br />
                                    Explanation image:
                                    <img src={MEDIA_URL + element.data.explanation_image} />

                                </>
                                : ""}
                            {element.type === 'exam' ?
                                <>
                                    Description: <ContentRenderer content={element.data.description} />
                                    <br />
                                    Duration: {element.data.duration}
                                    <br />
                                    Total marks: {element.data.total_marks}
                                    <br />

                                </>
                                : ""}
                            {element.type === 'module' && (
                                <>
                                    Title: {element.data.title}
                                    <br />
                                    Description: <ContentRenderer content={element.data.description} />
                                    <br />
                                </>
                            )}
                            <a href={`/element/${element.id}/edit`}>Edit</a>
                            {['text', 'image', 'video', 'example', 'assignment'].includes(element.type) ?
                                <button type="button" onClick={() => handleCopyElement(element.id)}>Copy</button>
                                : ""}
                            <button type="button" onClick={() => handleDeleteElement(element.id)}>Delete</button>
                        </div>
                    ))}
            </div>

        </div>
    )

}