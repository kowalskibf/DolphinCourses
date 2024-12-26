import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL, TYPES } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/EditCoursePage.css";
import { useLocation, useNavigate } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    id: string;
}

export default function ViewCoursePage() {

    const { id } = useParams<Params>();
    const [courseStructure, setCourseStructure] = useState<CourseStructure>();
    const [view, setView] = useState<ModuleElementStructure | "root">("root");
    const [path, setPath] = useState<ModuleElementStructure[]>([]);

    const query = new URLSearchParams(useLocation().search);
    const viewParam = query.get("v");
    const [viewArray, setViewArray] = useState<number[]>(viewParam ? viewParam.split("/").filter(Boolean).map(Number) : []);

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


    useEffect(() => {
        fetchCourseStructure();
        handleViewArray();
    }, []);

    useEffect(() => {
        if (courseStructure) {
            handleViewArray();
        }
    }, [courseStructure]);


    if (!courseStructure || !view) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="main-container">
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
                                            Description: <ContentRenderer content={module.module.data.description} />
                                        </>
                                        : ""}
                                    <a href={`/element/${module.module.id}/edit`} target='_blank'>Edit</a>
                                    <br />
                                </div>
                            </div>
                        ))}
                    <br />
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
                                        <ContentRenderer content={element.element_data.data.content} />
                                    </>
                                )}
                                {element.element_data.type == "image" && (
                                    <>
                                        <img src={MEDIA_URL + element.element_data.data.image} />
                                        <br />
                                        Description: <ContentRenderer content={element.element_data.data.description} />
                                    </>
                                )}
                                {element.element_data.type == "video" && (
                                    <>
                                        <video src={MEDIA_URL + element.element_data.data.video} controls />
                                        <br />
                                        Description: <ContentRenderer content={element.element_data.data.description} />
                                    </>
                                )}
                                {element.element_data.type == "example" && (
                                    <>
                                        Question: <ContentRenderer content={element.element_data.data.question} />
                                        <br />
                                        {element.element_data.data.image && (
                                            <img src={MEDIA_URL + element.element_data.data.image} />
                                        )}
                                        <br />
                                        Explanation: <ContentRenderer content={element.element_data.data.explanation} />
                                        <br />
                                        {element.element_data.data.explanation_image && (
                                            <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                        )}
                                    </>
                                )}
                                {element.element_data.type == "assignment" && (
                                    <>
                                        Question: <ContentRenderer content={element.element_data.data.question} />
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
                                                <ContentRenderer content={answer} /> {(element.element_data.data as AssignmentElementStructure).correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                            </li>
                                        ))}
                                        Explanation: <ContentRenderer content={element.element_data.data.explanation} />
                                        <br />
                                        Explanation image:
                                        <img src={MEDIA_URL + element.element_data.data.explanation_image} />

                                    </>
                                )}
                                {element.element_data.type == "exam" && (
                                    <>
                                        Description: <ContentRenderer content={element.element_data.data.description} />
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
                                                Question: <ContentRenderer content={examQuestion.question.question} />
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
                                                        <ContentRenderer content={answer} /> {(examQuestion.question as AssignmentElementStructure).correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                                    </li>
                                                ))}
                                                Explanation: <ContentRenderer content={examQuestion.question.explanation} />
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
                                        Description: <ContentRenderer content={element.element_data.data.description} />
                                    </>
                                    : ""}
                                <br />
                                {element.element_data.type == "module" ?
                                    <>
                                        <button onClick={() => handleChangeLocationInto(element.order)}>Enter</button>
                                    </>
                                    : ""}
                            </div>
                        ))}
                    <br />
                </>
            }
        </div>
    )

}