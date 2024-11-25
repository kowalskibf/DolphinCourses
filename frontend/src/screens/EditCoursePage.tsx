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
    const viewArray: number[] = viewParam ? JSON.parse(viewParam) : [];

    const navigate = useNavigate();
    const handleChangeURL = (url: string) => {
        navigate(url);
    }

    function assertModuleElementStructure(
        obj: any
    ): asserts obj is ModuleElementStructure {
        if (!obj || typeof obj !== 'object' || !('elements' in obj)) {
            throw new Error('Object is not of type ModuleElementStructure');
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
                        </div>
                    ))}
            </div>
            <div id="main-right">
                {view == "root" ?
                    <>
                        <h1>{courseStructure.name}</h1>
                        <br />
                        {courseStructure.modules
                            .sort((a, b) => a.order - b.order)
                            .map((module, i) => (
                                <div
                                    key={i}
                                    className={module.module.type + '-element any-element element-margin'}
                                >

                                    <div className={module.module.type + '-element-border-bottom width-100 text-align-center margin-bottom-10px'}>
                                        {module.module.name}
                                    </div>
                                    {module.module.type == "module" ?
                                        <>
                                            Title: {module.module.data.title}
                                            <br />
                                            Description: {module.module.data.description}
                                        </>
                                        : ""}

                                    <br />
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
                        {path.map((module, i) => (
                            <div key={i}>
                                {" > "}{module.title}
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
                                        {element.element_data.name}
                                    </div>
                                    {element.element_data.type == "module" ?
                                        <>
                                            Title: {element.element_data.data.title}
                                            <br />
                                            Description: {element.element_data.data.description}
                                        </>
                                        : ""}

                                    <br />
                                    <br />
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