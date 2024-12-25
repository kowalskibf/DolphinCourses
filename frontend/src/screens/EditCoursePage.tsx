import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL, TYPES } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/EditCoursePage.css";
import { useLocation, useNavigate } from 'react-router-dom';

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



    useEffect(() => {
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
        <div id="main-container">
            <div id="main-left">
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
                <button type="button" onClick={fetchMyElements}>Refresh</button>
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
                            className={element.type + '-element any-element element-margin'}
                            draggable
                            onDragStart={(e) => handleOnDrag(e, element)}
                        >
                            <div className={element.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                {element.name}
                            </div>
                            {element.type === 'text' ?
                                <div className="element-content-center">
                                    {element.data.content}
                                </div>
                                : ""}
                            {element.type === 'image' ?
                                <div className="element-content-center">
                                    <img
                                        className="element-media"
                                        src={MEDIA_URL + element.data.image}
                                    />
                                    <br />
                                    {element.data.description}
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
                                    {element.data.description}
                                </div>
                                : ""}
                            {element.type === 'example' ?
                                <div className="element-content-center">
                                    Question: {element.data.question}
                                    <br />
                                    Image: <img src={MEDIA_URL + element.data.image} />
                                    <br />
                                    Explanation: {element.data.explanation}
                                    <br />
                                    Explanation image: <img src={MEDIA_URL + element.data.explanation_image} />
                                </div>
                                : ""}
                            {element.type === 'assignment' ?
                                <>
                                    Question: {element.data.question}
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
                                            {answer} {element.data.correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                        </li>
                                    ))}
                                    Explanation: {element.data.explanation}
                                    <br />
                                    Explanation image:
                                    <img src={MEDIA_URL + element.data.explanation_image} />

                                </>
                                : ""}
                            {element.type === 'exam' ?
                                <>
                                    Description: {element.data.description}
                                    <br />
                                    Duration: {element.data.duration}
                                    <br />
                                    Total marks: {element.data.total_marks}
                                    <br />

                                </>
                                : ""}
                            {element.type === 'module' ?
                                <>
                                    Title: {element.data.title}
                                    <br />
                                    Description: {element.data.description}
                                    <br />
                                </>
                                : ""}
                            <a href={`/element/${element.id}/edit`} target='_blank'>Edit</a>
                        </div>
                    ))}
            </div>
            <div id="main-right">
                <button type="button" onClick={fetchCourseStructure}>Refresh</button>
                <br />
                {view == "root" ?
                    <>
                        <h1>{courseStructure.name}</h1>
                        <br />
                        {courseStructure.modules
                            .sort((a, b) => a.order - b.order)
                            .map((module, i) => (
                                <div key={i}>
                                    <div
                                        className={module.module.type + '-element any-element element-margin'}
                                    >

                                        <div className={module.module.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                            {module.module.name} {module.uses > 1 ? `(${module.uses - 1} use${module.uses > 2 ? "s" : ""} in other place${module.uses > 2 ? "s" : ""})` : ""}
                                        </div>
                                        {module.module.type == "module" ?
                                            <>
                                                Title: {module.module.data.title}
                                                <br />
                                                Description: {module.module.data.description}
                                            </>
                                            : ""}
                                        <a href={`/element/${module.module.id}/edit`} target='_blank'>Edit</a>
                                        <br />
                                    </div>
                                    <button onClick={() => handleMoveModule(module.module.id, "up")}>^</button>
                                    <br />
                                    <button onClick={() => handleMoveModule(module.module.id, "down")}>v</button>
                                    <br />
                                    <button onClick={() => handleDetachModule(module.module.id)}>Detach</button>
                                    <br />
                                    <button onClick={() => handleChangeLocationInto(module.order)}>Enter</button>
                                </div>
                            ))}
                        <br />
                        <div
                            id="drop-here-field"
                            onDrop={(e) => handleOnDrop(e, "r")}
                            onDragOver={handleDragOver}
                        >
                            Drop modules here
                        </div>
                    </>
                    :
                    <>
                        <span onClick={() => handleChangeLocationBack(-1)}>{courseStructure.name}</span>
                        {path.map((module, i) => (
                            <div key={i}>
                                {" > "}<span onClick={() => handleChangeLocationBack(i)}>{module.title}</span>
                            </div>
                        ))}
                        <h1>{view.title}</h1>
                        <br />
                        {view.elements
                            .sort((a, b) => a.order - b.order)
                            .map((element, i) => (
                                <div
                                    key={i}
                                    className={element.element_data.type + '-element any-element element-margin'}
                                >
                                    <div className={element.element_data.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                        {element.element_data.name} {element.uses > 1 ? `(used in ${element.uses - 1} other modules)` : ""}
                                    </div>
                                    {element.element_data.type == "text" && (
                                        <>
                                            Content: {element.element_data.data.content}
                                        </>
                                    )}
                                    {element.element_data.type == "image" && (
                                        <>
                                            <img src={MEDIA_URL + element.element_data.data.image} />
                                            <br />
                                            Description: {element.element_data.data.description}
                                        </>
                                    )}
                                    {element.element_data.type == "video" && (
                                        <>
                                            <video src={MEDIA_URL + element.element_data.data.video} controls />
                                            <br />
                                            Description: {element.element_data.data.description}
                                        </>
                                    )}
                                    {element.element_data.type == "example" && (
                                        <>
                                            Question: {element.element_data.data.question}
                                            <br />
                                            {element.element_data.data.image && (
                                                <img src={MEDIA_URL + element.element_data.data.image} />
                                            )}
                                            <br />
                                            Explanation: {element.element_data.data.explanation}
                                            <br />
                                            {element.element_data.data.explanation_image && (
                                                <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                            )}
                                        </>
                                    )}
                                    {element.element_data.type == "assignment" && (
                                        <>
                                            Question: {element.element_data.data.question}
                                            <br />
                                            Image: <img src={MEDIA_URL + element.element_data.data.image} />
                                            <br />
                                            {element.element_data.data.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                            <br />
                                            {element.element_data.data.hide_answers ? "Answers hidden" : "Answers visible"}
                                            <br />
                                            Answers:
                                            {element.element_data.data.answers.map((answer, i) => (
                                                <li key={i}>
                                                    {answer} {(element.element_data.data as AssignmentElementStructure).correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                                </li>
                                            ))}
                                            Explanation: {element.element_data.data.explanation}
                                            <br />
                                            Explanation image:
                                            <img src={MEDIA_URL + element.element_data.data.explanation_image} />

                                        </>
                                    )}
                                    {element.element_data.type == "exam" && (
                                        <>
                                            Description: {element.element_data.data.description}
                                            <br />
                                            Duration: {element.element_data.data.duration}
                                            <br />
                                            Total marks: {element.element_data.data.total_marks}
                                            <br />
                                            {element.element_data.data.questions.map((examQuestion, i) => (
                                                <>
                                                    <br />
                                                    Marks: {examQuestion.marks}
                                                    <br />
                                                    Question: {examQuestion.question.question}
                                                    {examQuestion.question.image && (
                                                        <img src={MEDIA_URL + examQuestion.question.image} />
                                                    )}
                                                    <br />
                                                    {examQuestion.question.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                                    <br />
                                                    {examQuestion.question.hide_answers ? "Answers hidden" : "Answers visible"}
                                                    <br />
                                                    Answers:
                                                    {examQuestion.question.answers.map((answer, i) => (
                                                        <li key={i}>
                                                            {answer} {(examQuestion.question as AssignmentElementStructure).correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                                        </li>
                                                    ))}
                                                    Explanation: {examQuestion.question.explanation}
                                                    <br />
                                                    {examQuestion.question.explanation_image && (
                                                        <img src={MEDIA_URL + examQuestion.question.explanation_image} />
                                                    )}
                                                    <a href={`/course/${id}/assignment/${examQuestion.question.id}/weights/edit`} target='_blank'>Modify weights</a>
                                                    <br />
                                                </>
                                            ))}
                                        </>
                                    )}
                                    {element.element_data.type == "module" ?
                                        <>
                                            Title: {element.element_data.data.title}
                                            <br />
                                            Description: {element.element_data.data.description}
                                        </>
                                        : ""}
                                    <a href={`/element/${element.element_data.id}/edit`} target='_blank'>Edit</a>

                                    <br />
                                    <button onClick={() => handleMoveElement(view.id, element.element_data.id, "up")}>^</button>
                                    <br />
                                    <button onClick={() => handleMoveElement(view.id, element.element_data.id, "down")}>v</button>
                                    <br />
                                    <button onClick={() => handleDetachElement(view.id, element.element_data.id)}>Detach</button>
                                    {element.element_data.type == "module" ?
                                        <>
                                            <button onClick={() => handleChangeLocationInto(element.order)}>Enter</button>
                                        </>
                                        : ""}
                                    {element.element_data.type == "assignment" && (
                                        <>
                                            <a href={`/course/${id}/assignment/${element.element_data.id}/weights/edit`} target='_blank'>Modify weights</a>
                                        </>
                                    )}
                                </div>
                            ))}
                        <br />
                        <div
                            id="drop-here-field"
                            onDrop={(e) => handleOnDrop(e, "i")}
                            onDragOver={handleDragOver}
                        >
                            Drop modules here
                        </div>
                    </>
                }
            </div>
        </div>
    )

}