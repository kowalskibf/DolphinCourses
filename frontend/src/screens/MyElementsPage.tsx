import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import "../styles/MyElementsPage.css";
import { MEDIA_URL, TYPES } from '../constants';
import ContentRenderer from '../components/ContentRenderer';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';

type CourseElementWithUses = CourseElement & {
    uses: number;
};

export default function MyElementsPage() {
    const [elements, setElements] = useState<CourseElementWithUses[]>([]);

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
        <div id="my-elements-main-container">
            <div id="my-elements-main-left">
                <a href="/element/new" target='_blank'>
                    <div className="my-elements-add-button">
                        <img src="/media/icon_plus.png" className="my-elements-add-button-img" />
                        <div className="my-elements-add-button-text">Create a new element</div>
                    </div>
                </a>
                <div className="my-elements-search-container">
                    Search by name&nbsp;
                    <input type="text" className="my-elements-search-input" placeholder="Element name" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="my-elements-filter-container">
                    <div className="my-elements-filter-top">Filter by type</div>
                    <div className="my-elements-filter-grid">
                        {TYPES.map((type, i) => (
                            <div
                                key={i}
                                className={type + '-element any-element my-elements-filter-type' + (filterTypes.includes(type) ? "" : " my-elements-filter-type-disabled")}
                                onClick={() => handleFilterToggle(type)}
                            >
                                {type.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div id="my-elements-main-right">
                <button className="edit-course-button-big" type="button" onClick={fetchElements}>Refresh</button>
                {elements
                    .filter((element) =>
                        element.name.includes(searchQuery)
                        &&
                        filterTypes.includes(element.type))
                    .map((element) => (
                        <div
                            key={element.id}
                            className={element.type + '-element any-element element-margin my-elements-element-margin'}
                        >
                            <div className={element.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                {element.name}
                            </div>
                            <div className={element.type + '-element-border-bottom width-100 margin-bottom-10px'}>
                                {element.type === 'text' ?
                                    <div className="element-content-center">
                                        <ContentRenderer content={element.data.content} />
                                    </div>
                                    : ""}
                                {element.type === 'image' ?
                                    <div className="element-content-center text-align-center my-elements-element-margin">
                                        <img
                                            className="element-media img-max-size"
                                            src={MEDIA_URL + element.data.image}
                                        />
                                        <br />
                                        <ContentRenderer content={element.data.description} />
                                    </div>
                                    : ""}
                                {element.type === 'video' ?
                                    <div className="element-content-center text-align-center">
                                        <video
                                            controls
                                            src={MEDIA_URL + element.data.video}
                                            className="element-media img-max-size"
                                        />
                                        <br />
                                        <ContentRenderer content={element.data.description} />
                                    </div>
                                    : ""}
                                {element.type === 'example' ?
                                    <div className="element-content-center">
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.data.question} />
                                        <br />
                                        {element.data.image && (
                                            <div className="text-align-center">
                                                <img className="img-max-size" src={MEDIA_URL + element.data.image} />
                                                <br />
                                                <br />
                                            </div>
                                        )}
                                        <span className="gray">Explanation</span>
                                        <ContentRenderer content={element.data.explanation} />
                                        <br />
                                        {element.data.explanation_image && (
                                            <div className="text-align-center">
                                                <img className="img-max-size" src={MEDIA_URL + element.data.explanation_image} />
                                                <br />
                                                <br />
                                            </div>
                                        )}

                                    </div>
                                    : ""}
                                {element.type === 'assignment' ?
                                    <>
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.data.question} />
                                        <br />
                                        {element.data.image && (
                                            <div className="text-align-center">
                                                <img className="img-max-size" src={MEDIA_URL + element.data.image} />
                                                <br />
                                                <br />
                                            </div>
                                        )}
                                        <span className="gray">{element.data.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                        <br />
                                        <span className="gray">{element.data.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                        <br />
                                        <br />
                                        <span className="gray">Answers</span>
                                        <br />
                                        <br />
                                        <div className="edit-element-answer-container">
                                            {element.data.answers.map((answer, i) => (
                                                <div className={`edit-element-answer ${element.data.correct_answer_indices.includes(i) ? "edit-element-answer-correct" : "edit-element-answer-wrong"}`} key={i}>
                                                    <ContentRenderer content={answer} />
                                                </div>
                                            ))}
                                        </div>
                                        <br />
                                        <span className="gray">Explanation</span>
                                        <ContentRenderer content={element.data.explanation} />
                                        <br />
                                        {element.data.explanation_image && (
                                            <div className="text-align-center">
                                                <img className="img-max-size" src={MEDIA_URL + element.data.explanation_image} />
                                                <br />
                                                <br />
                                            </div>
                                        )}
                                    </>
                                    : ""}
                                {element.type === 'exam' ?
                                    <>
                                        <ContentRenderer content={element.data.description} />
                                        <br />
                                        <span className="gray">Duration: {element.data.duration}</span>
                                        <br />
                                        <span className="gray">Total marks: {element.data.total_marks}</span>
                                        <br />

                                    </>
                                    : ""}
                                {element.type === 'module' && (
                                    <>
                                        <div className="module-container-title">{element.data.title}</div>
                                        <br />
                                        <span className="gray"><ContentRenderer content={element.data.description} /></span>
                                    </>
                                )}
                            </div>
                            <a href={`/element/${element.id}/edit`} target='_blank'>
                                <button className={`edit-course-button edit-course-button-border-${element.type}-element`}>
                                    Edit
                                </button>
                            </a>
                            {['text', 'image', 'video', 'example', 'assignment'].includes(element.type) ?
                                <button className={`edit-course-button edit-course-button-border-${element.type}-element`} type="button" onClick={() => handleCopyElement(element.id)}>Copy</button>
                                : ""}
                            <button className={`edit-course-button ${element.uses ? "my-elements-button-disabled" : `edit-course-button-border-${element.type}-element`}`} type="button" onClick={() => handleDeleteElement(element.id)}>Delete</button>
                        </div>
                    ))}
            </div>

        </div>
    )

}