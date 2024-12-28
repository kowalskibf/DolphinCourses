import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL, TYPES } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/ViewCoursePage.css";
import { useLocation, useNavigate } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    id: string;
}

type AssignmentAnswer = {
    assignmentId: number;
    selectedAnswerIndices: number[];
    answered: boolean;
    hideAnswers: boolean;
    explanationShown: boolean;
    isMultipleChoice: boolean;
}

export default function ViewCoursePage() {

    const { id } = useParams<Params>();
    const [courseStructure, setCourseStructure] = useState<CourseStructure>();
    const [view, setView] = useState<ModuleElementStructure | "root">("root");
    const [path, setPath] = useState<ModuleElementStructure[]>([]);

    const query = new URLSearchParams(useLocation().search);
    const viewParam = query.get("v");
    const [viewArray, setViewArray] = useState<number[]>(viewParam ? viewParam.split("/").filter(Boolean).map(Number) : []);

    const [assignmentAnswers, setAssignmentAnswers] = useState<AssignmentAnswer[]>([]);

    function assertModuleElementStructure(
        obj: any
    ): asserts obj is ModuleElementStructure {
        if (!obj || typeof obj !== 'object' || !('elements' in obj)) {
            throw new Error('Object is not of type ModuleElementStructure');
        }
    }

    const navigate = useNavigate();

    const handleChangeLocationBack = (i: number) => {
        setAssignmentAnswers([]);
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
        setAssignmentAnswers([]);
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
        setAssignmentAnswers([]);
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

    const handleSelectAnswer = (
        assignmentId: number,
        answerIndex: number,
        hideAnswers: boolean,
        isMultipleChoice: boolean = false
    ) => {
        setAssignmentAnswers((prev) => {
            const existingAssignment = prev.find((a) => a.assignmentId === assignmentId);

            if (!existingAssignment) {
                return [
                    ...prev,
                    {
                        assignmentId: assignmentId,
                        selectedAnswerIndices: [answerIndex],
                        answered: false,
                        hideAnswers: hideAnswers,
                        explanationShown: false,
                        isMultipleChoice: isMultipleChoice,
                    },
                ];
            } else {
                if (existingAssignment.answered) {
                    return prev;
                }

                const updatedAssignments = prev.map((assignment) => {
                    if (assignment.assignmentId === assignmentId) {
                        if (isMultipleChoice) {
                            const isSelected = assignment.selectedAnswerIndices.includes(answerIndex);
                            return {
                                ...assignment,
                                selectedAnswerIndices: isSelected
                                    ? assignment.selectedAnswerIndices.filter((i) => i !== answerIndex)
                                    : [...assignment.selectedAnswerIndices, answerIndex],
                            };
                        } else {
                            const isSameAnswer = assignment.selectedAnswerIndices[0] === answerIndex;
                            return {
                                ...assignment,
                                selectedAnswerIndices: isSameAnswer ? [] : [answerIndex],
                            };
                        }
                    }
                    return assignment;
                });

                return updatedAssignments;
            }
        });
    }


    const handleSubmitAnswer = (
        assignmentId: number,
        isMultipleChoice: boolean,
        hideAnswers: boolean,
    ) => {
        setAssignmentAnswers(prevAnswers => {
            if (!prevAnswers.some(assignment => assignment.assignmentId === assignmentId) && isMultipleChoice)
                return [
                    ...prevAnswers,
                    {
                        assignmentId: assignmentId,
                        selectedAnswerIndices: [],
                        answered: true,
                        hideAnswers: hideAnswers,
                        explanationShown: false,
                        isMultipleChoice: isMultipleChoice,
                    }
                ]
            return prevAnswers.map(assignment => {
                if (assignment.assignmentId === assignmentId) {
                    if (assignment.answered) {
                        return assignment;
                    }

                    if (assignment.isMultipleChoice) {
                        return { ...assignment, answered: true };
                    } else if (assignment.selectedAnswerIndices.length === 1) {
                        return { ...assignment, answered: true };
                    } else {
                        return assignment;
                    }
                }
                return assignment;
            });
        });
    };

    const handleShowAnswers = (assignmentId: number, hideAnswers: boolean, isMultipleChoice: boolean) => {
        setAssignmentAnswers(prevAnswers => {
            if (!hideAnswers) return prevAnswers;
            if (!assignmentAnswers.some(assignment => assignment.assignmentId === assignmentId)) {
                return [
                    ...prevAnswers,
                    {
                        assignmentId: assignmentId,
                        selectedAnswerIndices: [],
                        answered: false,
                        hideAnswers: false,
                        explanationShown: false,
                        isMultipleChoice: isMultipleChoice,
                    }
                ];
            }
            return prevAnswers;
        })
    }

    const handleToggleExplanation = (assignmentId: number) => {
        setAssignmentAnswers(prevAnswers =>
            prevAnswers.map(assignment =>
                assignment.assignmentId === assignmentId
                    ? { ...assignment, explanationShown: !assignment.explanationShown }
                    : assignment
            )
        );
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

    useEffect(() => { console.log(assignmentAnswers); }, [assignmentAnswers]);
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
                                    className={module.module.type + '-element any-element element-margin module-container'}
                                    onClick={() => handleChangeLocationInto(module.order)}
                                >
                                    {module.module.type == "module" &&
                                        <>
                                            <div className="module-container-title">{module.module.data.title}</div>
                                            <br />
                                            <span className="gray"><ContentRenderer content={module.module.data.description} /></span>
                                        </>
                                    }
                                </div>
                            </div>
                        ))}
                    <br />
                </>
                :
                <>
                    <span onClick={handleChangeLocationOneUp}>Back</span>
                    <br />
                    <span onClick={() => handleChangeLocationBack(-1)}>{courseStructure.name}</span>
                    <br />
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
                                {element.element_data.type == "text" && (
                                    <>
                                        <ContentRenderer content={element.element_data.data.content} />
                                    </>
                                )}
                                {element.element_data.type == "image" && (
                                    <>
                                        <div className="media-container">
                                            <img src={MEDIA_URL + element.element_data.data.image} />
                                        </div>
                                        <div className="media-description">
                                            <ContentRenderer content={element.element_data.data.description} />
                                        </div>
                                    </>
                                )}
                                {element.element_data.type == "video" && (
                                    <>
                                        <div className="media-container">
                                            <video src={MEDIA_URL + element.element_data.data.video} controls />
                                        </div>
                                        <div className="media-description">
                                            <ContentRenderer content={element.element_data.data.description} />
                                        </div>
                                    </>
                                )}
                                {element.element_data.type == "example" && (
                                    <>
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.element_data.data.question} />
                                        {element.element_data.data.image && (
                                            <>
                                                <br />
                                                <div className="media-container">
                                                    <img src={MEDIA_URL + element.element_data.data.image} />
                                                </div>
                                                <br />
                                            </>
                                        )}
                                        <br />
                                        <span className="gray">Explanation</span>
                                        <ContentRenderer content={element.element_data.data.explanation} />
                                        {element.element_data.data.explanation_image && (
                                            <>
                                                <br />
                                                <div className="media-container">
                                                    <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                {element.element_data.type == "assignment" && (
                                    <>
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.element_data.data.question} />
                                        <br />
                                        {element.element_data.data.image && (
                                            <>
                                                <br />
                                                <div className="media-container">
                                                    <img src={MEDIA_URL + element.element_data.data.image} />
                                                </div>
                                                <br />
                                            </>
                                        )}
                                        <span className="gray">{element.element_data.data.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                        <br />
                                        <span className="gray">{element.element_data.data.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                        <br />
                                        <br />
                                        {!element.element_data.data.hide_answers || assignmentAnswers.some((a) => a.assignmentId === element.element_data.id && !a.hideAnswers) ? (
                                            <>
                                                <span className="gray">Answers</span>
                                                <br />
                                                <div className="question-answer-container">
                                                    {element.element_data.data.answers.map((answer, i) => {
                                                        const assignmentElement = element.element_data.data as AssignmentElementStructure;

                                                        const assignment = assignmentAnswers.find(
                                                            (assignment) => assignment.assignmentId === element.element_data.id
                                                        );

                                                        const isSelected = assignment?.selectedAnswerIndices.includes(i);
                                                        const isCorrect = assignment?.answered && assignmentElement.correct_answer_indices.includes(i);
                                                        const isWrong = assignment?.answered && !assignmentElement.correct_answer_indices.includes(i) && isSelected;

                                                        return (
                                                            <div
                                                                className={`question-answer${isSelected ? ' answer-selected' : ''}${isCorrect ? ' answer-correct' : ''}${isWrong ? ' answer-wrong' : ''}`}
                                                                key={i}
                                                                onClick={() => handleSelectAnswer(
                                                                    element.element_data.id,
                                                                    i,
                                                                    assignmentElement.hide_answers,
                                                                    assignmentElement.is_multiple_choice
                                                                )}
                                                            >
                                                                <ContentRenderer content={answer} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`button-submit-answer${element.element_data.data.is_multiple_choice ? '' :
                                                        (!assignmentAnswers.some(assignment =>
                                                            assignment.assignmentId === element.element_data.id &&
                                                            assignment.selectedAnswerIndices.length > 0
                                                        ) || !assignmentAnswers.some(assignment =>
                                                            assignment.assignmentId === element.element_data.id
                                                        ) || assignmentAnswers.some(assignment =>
                                                            assignment.assignmentId === element.element_data.id && assignment.answered
                                                        ) ? ' button-submit-answer-disabled' : '')}`}
                                                    onClick={() => handleSubmitAnswer(
                                                        element.element_data.id,
                                                        (element.element_data.data as AssignmentElementStructure).is_multiple_choice,
                                                        (element.element_data.data as AssignmentElementStructure).hide_answers
                                                    )}
                                                >
                                                    Submit answer
                                                </button>


                                                <br />

                                                {assignmentAnswers.some(assignment => assignment.assignmentId === element.element_data.id && assignment.answered) && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="button-submit-answer "
                                                            onClick={() => handleToggleExplanation(element.element_data.id)}
                                                        >
                                                            {assignmentAnswers.find(assignment => assignment.assignmentId === element.element_data.id)?.explanationShown
                                                                ? 'Hide explanation'
                                                                : 'Show explanation'}
                                                        </button>
                                                        {assignmentAnswers.find(assignment => assignment.assignmentId === element.element_data.id)?.explanationShown && (
                                                            <div>
                                                                <span className="gray">Explanation</span>
                                                                <br />
                                                                <ContentRenderer content={element.element_data.data.explanation} />
                                                                {element.element_data.data.explanation_image && (
                                                                    <>
                                                                        <br />
                                                                        <div className="media-container">
                                                                            <img src={MEDIA_URL + element.element_data.data.explanation_image} />
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="button-submit-answer"
                                                onClick={() => handleShowAnswers(
                                                    element.element_data.id,
                                                    (element.element_data.data as AssignmentElementStructure).hide_answers,
                                                    (element.element_data.data as AssignmentElementStructure).is_multiple_choice
                                                )}
                                            >
                                                Show answers
                                            </button>
                                        )}




                                    </>
                                )}
                                {element.element_data.type === "exam" && (
                                    <>
                                        <ContentRenderer content={element.element_data.data.description} />
                                        <br />
                                        <span className="gray">Duration: {element.element_data.data.duration} minutes</span>
                                        <br />
                                        <span className="gray">Total marks: {element.element_data.data.total_marks}</span>
                                        <br /><br />

                                        {element.element_data.data.questions.map((examQuestion, i) => {
                                            const assignment = assignmentAnswers.find(
                                                (assignment) => assignment.assignmentId === examQuestion.question.id
                                            );

                                            const isAnswered = assignment?.answered;
                                            const isMultipleChoice = examQuestion.question.is_multiple_choice;
                                            const correctAnswerIndices = (examQuestion.question as AssignmentElementStructure).correct_answer_indices;

                                            return (
                                                <div className="assignment-element any-element element-margin">
                                                    <span className="gray">Marks: {examQuestion.marks}</span>
                                                    <br />
                                                    <span className="gray">Question</span>
                                                    <ContentRenderer content={examQuestion.question.question} />
                                                    {examQuestion.question.image && (
                                                        <>
                                                            <div className="media-container">
                                                                <img src={MEDIA_URL + examQuestion.question.image} />
                                                            </div>
                                                        </>
                                                    )}
                                                    <br />
                                                    <span className="gray">{examQuestion.question.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                                    <br />
                                                    <span className="gray">{examQuestion.question.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                                    <br /><br />
                                                    {!examQuestion.question.hide_answers || assignmentAnswers.some((a) => a.assignmentId === examQuestion.question.id && !a.hideAnswers) ? (
                                                        <>
                                                            <span className="gray">Answers</span>
                                                            <div className="question-answer-container">
                                                                {examQuestion.question.answers.map((answer, j) => {
                                                                    const isSelected = assignment?.selectedAnswerIndices.includes(j);
                                                                    const isCorrect = isAnswered && correctAnswerIndices.includes(j);
                                                                    const isWrong = isAnswered && !correctAnswerIndices.includes(j) && isSelected;

                                                                    return (
                                                                        <div
                                                                            className={`question-answer${isSelected ? ' answer-selected' : ''}${isCorrect ? ' answer-correct' : ''}${isWrong ? ' answer-wrong' : ''}`}
                                                                            key={j}
                                                                            onClick={() => handleSelectAnswer(
                                                                                examQuestion.question.id,
                                                                                j,
                                                                                examQuestion.question.hide_answers,
                                                                                isMultipleChoice
                                                                            )}
                                                                        >
                                                                            <ContentRenderer content={answer} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className={`button-submit-answer${assignmentAnswers.some(
                                                                    assignment => assignment.assignmentId === examQuestion.question.id && assignment.answered
                                                                )
                                                                    ? ' button-submit-answer-disabled'
                                                                    : (
                                                                        isMultipleChoice ||
                                                                        assignmentAnswers.some(
                                                                            assignment => assignment.assignmentId === examQuestion.question.id && assignment.selectedAnswerIndices.length > 0
                                                                        )
                                                                    )
                                                                        ? ''
                                                                        : ' button-submit-answer-disabled'
                                                                    }`}

                                                                onClick={() => handleSubmitAnswer(
                                                                    examQuestion.question.id,
                                                                    examQuestion.question.is_multiple_choice,
                                                                    examQuestion.question.hide_answers
                                                                )}
                                                                disabled={isAnswered}
                                                            >
                                                                Submit answer
                                                            </button>

                                                            <br />

                                                            {isAnswered && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="button-submit-answer"
                                                                        onClick={() => handleToggleExplanation(examQuestion.question.id)}
                                                                    >
                                                                        {assignment?.explanationShown ? 'Hide explanation' : 'Show explanation'}
                                                                    </button>
                                                                    {assignment?.explanationShown && (
                                                                        <div>
                                                                            <span className="gray">Explanation</span>
                                                                            <br />
                                                                            <ContentRenderer content={examQuestion.question.explanation} />
                                                                            {examQuestion.question.explanation_image && (
                                                                                <>
                                                                                    <br />
                                                                                    <div className="media-container">
                                                                                        <img src={MEDIA_URL + examQuestion.question.explanation_image} />
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="button-submit-answer"
                                                            onClick={() => handleShowAnswers(
                                                                examQuestion.question.id,
                                                                examQuestion.question.hide_answers,
                                                                examQuestion.question.is_multiple_choice
                                                            )}
                                                        >
                                                            Show answers
                                                        </button>
                                                    )}

                                                </div>
                                            );
                                        })}
                                    </>
                                )}

                                {element.element_data.type == "module" ?
                                    <>
                                        <div
                                            className={'module-container'}
                                            onClick={() => handleChangeLocationInto(element.order)}
                                        >
                                            <div className="module-container-title">{element.element_data.data.title}</div>
                                            <br />
                                            <span className="gray"><ContentRenderer content={element.element_data.data.description} /></span>
                                        </div>
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