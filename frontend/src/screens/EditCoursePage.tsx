import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, sendUserBackToLoginPageIfNotLoggedIn, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL, TYPES } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/EditCoursePage.css";
import { useLocation, useNavigate } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    id: string;
}

export default function EditCoursePage() {

    const { id } = useParams<Params>();
    const [courseStructure, setCourseStructure] = useState<CourseStructure>();
    const [view, setView] = useState<ModuleElementStructure | "root">("root");
    const [path, setPath] = useState<ModuleElementStructure[]>([]);

    const [draggedModule, setDraggedModule] = useState<ModuleElement>();

    const [myElements, setMyElements] = useState<CourseElement[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterTypes, setFilterTypes] = useState<string[]>(["text", "image", "video", "example", "assignment", "exam", "module"]);

    const query = new URLSearchParams(useLocation().search);
    const viewParam = query.get("v");
    const [viewArray, setViewArray] = useState<number[]>(viewParam ? viewParam.split("/").filter(Boolean).map(Number) : []);

    const [m_ModalIsOpen, setM_ModalIsOpen] = useState<boolean>(false);
    const [m_ImportType, setM_ImportType] = useState<"m" | "e">("m");
    const [m_CourseId, setM_CourseId] = useState<number>(0);
    const [m_ModuleId, setM_ModuleId] = useState<number>(0);
    const [m_ElementId, setM_ElementId] = useState<number>(0);

    function assertModuleElementStructure(
        obj: any
    ): asserts obj is ModuleElementStructure {
        if (!obj || typeof obj !== 'object' || !('elements' in obj)) {
            throw new Error('Object is not of type ModuleElementStructure');
        }
    }

    const navigate = useNavigate();

    const handleChangeLocationBack = (i: number) => {
        if (i == -1) {
            query.delete("v");
            navigate(`${location.pathname}`);
            setViewArray([]);
            setView("root");
            setPath([]);
        } else {
            const updatedViewArray = viewArray.slice(0, i + 1);
            const updatedPath = path.slice(0, i + 1);
            const updatedViewParam = updatedViewArray.join("/");
            query.set("v", updatedViewParam);
            const newPath = `${location.pathname}?${query.toString()}`;
            navigate(newPath);
            setViewArray(updatedViewArray);
            setView(path[i]);
            setPath(updatedPath);
        }
    };

    const handleChangeLocationInto = (i: number) => {
        if (courseStructure && view) {
            if (view == "root") {
                setViewArray([i]);
                const currentModule = courseStructure.modules[i - 1].module.data;
                navigate(`${location.pathname}?v=${i}`);
                assertModuleElementStructure(currentModule);
                setPath([currentModule]);
                setView(currentModule);
            } else {
                const newModule = view.elements[i - 1].element_data.data;
                assertModuleElementStructure(newModule);
                setViewArray([...viewArray, i]);
                query.set("v", query.get("v") + `/${i}`);
                const newPath = `${location.pathname}?${query.toString()}`;
                navigate(newPath);
                setView(newModule);
                setPath([...path, newModule]);
            }
        }
    }

    const handleChangeLocationOneUp = () => {
        if (courseStructure && view && view != "root") {
            if (viewArray.length == 1) {
                query.delete("v");
                navigate(`${location.pathname}`);
                setViewArray([]);
                setView("root");
                setPath([]);
            } else {
                const updatedViewArray = viewArray.slice(0, viewArray.length - 1);
                const updatedPath = path.slice(0, path.length - 1);
                const updatedViewParam = updatedViewArray.join("/");
                query.set("v", updatedViewParam);
                const newPath = `${location.pathname}?${query.toString()}`;
                navigate(newPath);
                setViewArray(updatedViewArray);
                setView(path[path.length - 2]);
                setPath(updatedPath);
            }
        }
    }


    const handleViewArray = () => {
        if (!viewArray || viewArray === undefined || viewArray.length === 0) {
            setView("root");
            setPath([]);
        }
        else {
            const newPath: ModuleElementStructure[] = [];
            if (courseStructure) {
                let currentModule = courseStructure
                    .modules
                    .sort((a, b) => a.order - b.order)[viewArray[0] - 1]
                    .module
                    .data;
                assertModuleElementStructure(currentModule);
                newPath.push(currentModule);
                viewArray.slice(1).forEach((moduleIndex) => {
                    assertModuleElementStructure(currentModule);
                    const nextModule = currentModule
                        .elements
                        .sort((a, b) => a.order - b.order)[moduleIndex - 1]
                        .element_data
                        .data;
                    assertModuleElementStructure(nextModule);
                    newPath.push(nextModule);
                    currentModule = nextModule;
                });
            }
            setView(newPath[newPath.length - 1])
            setPath(newPath);
        };
    };

    const handleFilterToggle = (type: string) => {
        if (!filterTypes.includes(type))
            setFilterTypes([...filterTypes, type]);
        else
            setFilterTypes(filterTypes.filter(item => item !== type));
    }

    const fetchCourseStructure = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/structure`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setCourseStructure(data));
    };

    const fetchMyElements = async () => {
        fetch("http://127.0.0.1:8000/api/elements/my", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setMyElements(data));
    };

    const handleAddModule = async (module: CourseElement) => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/structure/${module.id}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                fetchCourseStructure();
            })
    }

    const handleDetachModule = async (module_id: number) => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/structure/${module_id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                fetchCourseStructure();
            });
    }

    const handleAddElement = async (element: CourseElement) => {
        assertModuleElementStructure(view);
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/module/${view.id}/structure/${element.id}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                fetchCourseStructure();
            })
    }

    const handleOnDrag = (e: React.DragEvent, element: CourseElement) => {
        e.dataTransfer.setData("element", JSON.stringify(element));
    }
    const handleOnDrop = (e: React.DragEvent, v: "r" | "i") => {
        e.preventDefault();
        const elementData = e.dataTransfer.getData("element");
        const element: CourseElement = JSON.parse(elementData);
        v === "r" ? handleAddModule(element) : handleAddElement(element);
    }
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const handleMoveModule = async (module_id: number, action: "up" | "down") => {
        const response = await fetch(`http://127.0.0.1:8000/api/course/${id}/structure/${module_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                action: action,
            }),
        })
            .then((response) => {
                fetchCourseStructure();
            })
    }

    const handleMoveElement = async (module_id: number, element_id: number, action: "up" | "down") => {
        const response = await fetch(`http://127.0.0.1:8000/api/module/${module_id}/structure/${element_id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                action: action,
            }),
        })
            .then((response) => {
                fetchCourseStructure();
            })
    }

    const handleDetachElement = async (module_id: number, element_id: number) => {
        const response = await fetch(`http://127.0.0.1:8000/api/module/${module_id}/structure/${element_id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => {
                fetchCourseStructure();
            })
    }

    const totalWeight = (weights: any) => {
        return weights.reduce((sum: any, weight: any) => sum + weight.weight, 0);
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchCourseStructure();
        fetchMyElements();
        handleViewArray();
    }, []);

    useEffect(() => {
        if (courseStructure) {
            handleViewArray();
        }
    }, [courseStructure]);


    if (courseStructure === undefined || myElements === undefined || view === undefined) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="edit-course-main-container">
            <div id="edit-course-main-left">
                <div id="edit-course-my-elements-header">
                    My elements
                </div>
                <a href="/element/new" target='_blank'>
                    <div className="edit-course-add-button">
                        <img src="/media/icon_plus.png" className="edit-course-add-button-img" />
                        <div className="edit-course-add-button-text">Create a new element</div>
                    </div>
                </a>
                <div className="edit-course-search-container">
                    Search by name
                    <input type="text" className="edit-course-search-input" placeholder="Enter the name to search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="edit-course-filter-container">
                    <div className="edit-course-filter-top">Filter by type</div>
                    <div className="edit-course-filter-grid">
                        {TYPES.map((type, i) => (
                            <div
                                key={i}
                                className={type + '-element any-element edit-course-filter-type' + (filterTypes.includes(type) ? "" : " edit-course-filter-type-disabled")}
                                onClick={() => handleFilterToggle(type)}
                            >
                                {type.toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
                <button className="edit-course-button-big" type="button" onClick={fetchMyElements}>Refresh</button>
                {myElements
                    .filter((element) =>
                        element.name.includes(searchQuery)
                        &&
                        filterTypes.includes(element.type)
                        &&
                        (view != "root" || element.type == "module")
                    )
                    .map((element) => (
                        <div
                            key={element.id}
                            className={element.type + '-element any-element element-margin edit-course-element-margin'}
                            draggable
                            onDragStart={(e) => handleOnDrag(e, element)}
                        >
                            <div className={element.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                {element.name}
                            </div>
                            <div className={element.type + '-element-border-bottom width-100 margin-bottom-10px'}>
                                {element.type === 'text' ?
                                    <div>
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
                                    <div>
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.data.question} />
                                        <br />
                                        {element.data.image && (
                                            <div className="text-align-center">
                                                <img src={MEDIA_URL + element.data.image} />
                                                <br />
                                                <br />
                                            </div>
                                        )}
                                        <span className="gray">Explanation</span>
                                        <ContentRenderer content={element.data.explanation} />
                                        <br />
                                        {element.data.explanation_image && (
                                            <div className="text-align-center">
                                                <img src={MEDIA_URL + element.data.explanation_image} />
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
                                                <img src={MEDIA_URL + element.data.image} />
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
                                        <div className="question-answer-container">
                                            {element.data.answers.map((answer, i) => (
                                                <div className={`question-answer ${(element.data as AssignmentElementStructure).correct_answer_indices.includes(i) ? "answer-correct" : "answer-wrong"}`} key={i}>
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
                                                <img src={MEDIA_URL + element.data.explanation_image} />
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
                                        <br />

                                    </>
                                    : ""}
                                {element.type === 'module' ?
                                    <>
                                        Title: {element.data.title}
                                        <br />
                                        Description: <ContentRenderer content={element.data.description} />
                                        <br />
                                    </>
                                    : ""}
                            </div>
                            <button
                                type="button"
                                className={`edit-course-button edit-course-button-border-${element.type}-element`}
                                onClick={() => (view == "root" ? handleAddModule(element) : handleAddElement(element))}
                            >Attach</button>
                            <a href={`/element/${element.id}/edit`} target='_blank'>
                                <button className={`edit-course-button edit-course-button-border-${element.type}-element`}>
                                    Edit
                                </button>
                            </a>
                        </div>
                    ))}
            </div>
            <div id="edit-course-main-right">
                <button className="edit-course-button-big" type="button" onClick={fetchCourseStructure}>Refresh</button>
                <br />
                {view == "root" ?
                    <>
                        <a href={`/course/${id}/edit/info`} target='_blank'>
                            <button className="edit-course-button-big">
                                Back to course info
                            </button>
                        </a>
                        <a href={`/course/${id}/view`} target='_blank'>
                            <button className="edit-course-button-big">
                                View as user
                            </button>
                        </a>
                        <br />
                        <h1>{courseStructure.name}</h1>
                        <br />
                        {courseStructure.modules
                            .sort((a, b) => a.order - b.order)
                            .map((module, i) => (
                                <div key={i}>
                                    <div
                                        className={module.module.type + '-element any-element element-margin edit-course-element-margin'}
                                    >

                                        <div className={module.module.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                            {module.module.name} {module.uses > 1 ? `(${module.uses - 1} use${module.uses > 2 ? "s" : ""} in other place${module.uses > 2 ? "s" : ""})` : ""}
                                        </div>
                                        {module.module.type == "module" ?
                                            <div className={module.module.type + '-element-border-bottom width-100 margin-bottom-10px'}>
                                                <div className="module-container-title">{module.module.data.title}</div>
                                                <br />
                                                <span className="gray"><ContentRenderer content={module.module.data.description} /></span>
                                            </div>
                                            : ""}
                                        <a href={`/element/${module.module.id}/edit`} target='_blank'>
                                            <button type="button" className={`edit-course-button edit-course-button-border-${module.module.type}-element`}>
                                                Edit
                                            </button>
                                        </a>
                                        {module.order > 1 && (
                                            <button className={`edit-course-button edit-course-button-border-${module.module.type}-element`} onClick={() => handleMoveModule(module.module.id, "up")}>Move up</button>
                                        )}
                                        {module.order < courseStructure.modules.length && (
                                            <button className={`edit-course-button edit-course-button-border-${module.module.type}-element`} onClick={() => handleMoveModule(module.module.id, "down")}>Move down</button>
                                        )}
                                        <button className={`edit-course-button edit-course-button-border-${module.module.type}-element`} onClick={() => handleDetachModule(module.module.id)}>Detach</button>
                                        <button className={`edit-course-button edit-course-button-border-${module.module.type}-element`} onClick={() => handleChangeLocationInto(module.order)}>Enter</button>

                                    </div>
                                </div>
                            ))}
                        <br />
                        {/* <div
                            id="drop-here-field"
                            onDrop={(e) => handleOnDrop(e, "r")}
                            onDragOver={handleDragOver}
                        >
                            Drop modules here
                        </div> */}
                    </>
                    :
                    <>
                        <a href={`/course/${id}/edit/info`} target='_blank'>
                            <button className="edit-course-button-big">
                                Back to course info
                            </button>
                        </a>
                        <a href={`/course/${id}/view?v=${viewArray.join("/")}`} target='_blank'>
                            <button className="edit-course-button-big">
                                View as user
                            </button>
                        </a>
                        <br />
                        <span className="cursor-pointer">
                            <span onClick={handleChangeLocationOneUp}>Back</span>
                            <br />
                            <span onClick={() => handleChangeLocationBack(-1)}>{courseStructure.name}</span>
                            {path.map((module, i) => (
                                <div key={i}>
                                    {" > "}<span onClick={() => handleChangeLocationBack(i)}>{module.title}</span>
                                </div>
                            ))}
                        </span>
                        <h1>{view.title}</h1>
                        <br />
                        {view.elements
                            .sort((a, b) => a.order - b.order)
                            .map((element, i) => (
                                <div
                                    key={i}
                                    className={element.element_data.type + '-element any-element element-margin edit-course-element-margin'}
                                >
                                    <div className={element.element_data.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                        {element.element_data.name} {element.uses > 1 ? `(used in ${element.uses - 1} other modules)` : ""}
                                    </div>
                                    <div className={element.element_data.type + '-element-border-bottom width-100 margin-bottom-10px'}>
                                        {element.element_data.type == "text" && (
                                            <>
                                                <ContentRenderer content={element.element_data.data.content} />
                                            </>
                                        )}
                                        {element.element_data.type == "image" && (
                                            <div className="text-align-center">
                                                <img src={MEDIA_URL + element.element_data.data.image} />
                                                <br />
                                                <ContentRenderer content={element.element_data.data.description} />
                                            </div>
                                        )}
                                        {element.element_data.type == "video" && (
                                            <div className="text-align-center">
                                                <video src={MEDIA_URL + element.element_data.data.video} controls />
                                                <br />
                                                Description: <ContentRenderer content={element.element_data.data.description} />
                                            </div>
                                        )}
                                        {element.element_data.type == "example" && (
                                            <>
                                                <span className="gray">Question</span>
                                                <ContentRenderer content={element.element_data.data.question} />
                                                <br />
                                                {element.element_data.data.image && (
                                                    <div className="text-align-center">
                                                        <img src={MEDIA_URL + element.element_data.data.image} />
                                                        <br />
                                                        <br />
                                                    </div>
                                                )}
                                                <span className="gray">Explanation</span>
                                                <ContentRenderer content={element.element_data.data.explanation} />
                                                <br />
                                                {element.element_data.data.explanation_image && (
                                                    <div className="text-align-center">
                                                        <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                                        <br />
                                                        <br />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {element.element_data.type == "assignment" && (
                                            <>
                                                <span className="gray">Question</span>
                                                <ContentRenderer content={element.element_data.data.question} />
                                                <br />
                                                {element.element_data.data.image && (
                                                    <div className="text-align-center">
                                                        <img src={MEDIA_URL + element.element_data.data.image} />
                                                        <br />
                                                        <br />
                                                    </div>

                                                )}
                                                <span className="gray">
                                                    {element.element_data.data.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                                </span>
                                                <br />
                                                <span className="gray">
                                                    {element.element_data.data.hide_answers ? "Answers hidden" : "Answers visible"}
                                                </span>
                                                <br />
                                                <br />
                                                <span className="gray">Answers</span>
                                                <br />
                                                <br />
                                                <div className="question-answer-container">
                                                    {element.element_data.data.answers.map((answer, i) => (
                                                        <div className={`question-answer ${(element.element_data.data as AssignmentElementStructure).correct_answer_indices.includes(i) ? "answer-correct" : "answer-wrong"}`} key={i}>
                                                            <ContentRenderer content={answer} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <br />
                                                <span className="gray">Explanation</span>
                                                <ContentRenderer content={element.element_data.data.explanation} />
                                                <br />
                                                {element.element_data.data.explanation_image && (
                                                    <div className="text-align-center">
                                                        <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                                        <br />
                                                        <br />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {element.element_data.type == "exam" && (
                                            <>
                                                <ContentRenderer content={element.element_data.data.description} />
                                                <br />
                                                <span className="gray">Duration: {element.element_data.data.duration} minutes</span>
                                                <br />
                                                <span className="gray">Questions: {element.element_data.data.questions.length}</span>
                                                <br />
                                                <span className="gray">Total marks: {element.element_data.data.total_marks}</span>
                                                <br />
                                                <br />
                                                {element.element_data.data.questions.map((examQuestion, i) => (
                                                    <div className="assignment-element any-element element-margin">
                                                        <span className="gray">Marks: {examQuestion.marks}</span>
                                                        <br />
                                                        <span className="gray">Question</span>
                                                        <ContentRenderer content={examQuestion.question.question} />
                                                        {examQuestion.question.image && (
                                                            <img src={MEDIA_URL + examQuestion.question.image} />
                                                        )}
                                                        <br />
                                                        <span className="gray">{examQuestion.question.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                                        <br />
                                                        <span className="gray">{examQuestion.question.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                                        <br />
                                                        <br />
                                                        <span className="gray">Answers</span>
                                                        <br />
                                                        <br />
                                                        <div className="question-answer-container">
                                                            {examQuestion.question.answers.map((answer, i) => (
                                                                <div className={`question-answer ${(examQuestion.question as AssignmentElementStructure).correct_answer_indices.includes(i) ? "answer-correct" : "answer-wrong"}`} key={i}>
                                                                    <ContentRenderer content={answer} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <br />
                                                        <span className="gray">Explanation</span>
                                                        <ContentRenderer content={examQuestion.question.explanation} />
                                                        <br />
                                                        {examQuestion.question.explanation_image && (
                                                            <div className="text-align-center">
                                                                <img src={MEDIA_URL + examQuestion.question.explanation_image} />
                                                                <br />
                                                                <br />
                                                            </div>
                                                        )}

                                                        {totalWeight(examQuestion.question.weights) == 0 ? (
                                                            <>
                                                                <span className="red">Assignment has not set any weights!</span>
                                                                <br />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="gray">Weights</span>
                                                                <br />
                                                                {examQuestion.question.weights.filter((weight) => weight.weight !== 0).map((weight, i) => (
                                                                    <>
                                                                        <span className="gray">{weight.topic.topic}</span>: {weight.weight}
                                                                        <br />
                                                                    </>
                                                                ))}
                                                            </>
                                                        )}
                                                        <a href={`/course/${id}/assignment/${examQuestion.question.id}/weights/edit`} target='_blank'>
                                                            <button type="button" className="edit-course-button edit-course-button-border-assignment-element">
                                                                Modify weights
                                                            </button>
                                                        </a>
                                                        <br />
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {element.element_data.type == "module" ?
                                            <>
                                                <div className="module-container-title">{element.element_data.data.title}</div>
                                                <br />
                                                <span className="gray"><ContentRenderer content={element.element_data.data.description} /></span>
                                            </>
                                            : ""}

                                    </div>
                                    <a href={`/element/${element.element_data.id}/edit`} target='_blank'>
                                        <button type="button" className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`}>
                                            Edit
                                        </button>
                                    </a>
                                    {
                                        element.order > 1 && (
                                            <button className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`} onClick={() => handleMoveElement(view.id, element.element_data.id, "up")}>Move up</button>
                                        )
                                    }
                                    {
                                        element.order < view.elements.length && (
                                            <button className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`} onClick={() => handleMoveElement(view.id, element.element_data.id, "down")}>Move down</button>
                                        )
                                    }

                                    <button className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`} onClick={() => handleDetachElement(view.id, element.element_data.id)}>Detach</button>
                                    {element.element_data.type == "assignment" && (
                                        <>


                                            <br />
                                            {totalWeight(element.element_data.data.weights) == 0 ? (
                                                <span className="red">
                                                    Assignment has not set any weights!<br />
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="gray">Weights</span>
                                                    <br />
                                                    {element.element_data.data.weights.filter((weight) => weight.weight !== 0).map((weight, i) => (
                                                        <>
                                                            <span className="gray">{weight.topic.topic}</span>: {weight.weight}
                                                            <br />
                                                        </>
                                                    ))}
                                                </>
                                            )}
                                            <a href={`/course/${id}/assignment/${element.element_data.id}/weights/edit`} target='_blank'>
                                                <button className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`}>
                                                    Modify weights
                                                </button>
                                            </a>
                                            <br />
                                        </>
                                    )}
                                    {element.element_data.type == "module" ?
                                        <>
                                            <button className={`edit-course-button edit-course-button-border-${element.element_data.type}-element`} onClick={() => handleChangeLocationInto(element.order)}>Enter</button>
                                        </>
                                        : ""}
                                </div>
                            ))}
                        <br />
                        {/* <div
                            id="drop-here-field"
                            onDrop={(e) => handleOnDrop(e, "i")}
                            onDragOver={handleDragOver}
                        >
                            Drop modules here
                        </div> */}
                    </>
                }
            </div >
        </div >
    )

}