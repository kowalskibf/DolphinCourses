import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { formatAmount, formatDateTimeLocal, formatDateToBackend, intToPrice, priceToInt, timeAgo } from '../functions';
import { CURRENCIES, LANGUAGES, MEDIA_URL, TYPES } from '../constants';
import { useParams } from 'react-router-dom';
import "../styles/ViewCoursePage.css";
import { useLocation, useNavigate } from 'react-router-dom';
import ContentRenderer from '../components/ContentRenderer';
import "../styles/ViewCoursePage.css";

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
    marks: number;
    correctAnswerIndices: number[];
}

type ExamContent = {
    examId: number;
    finished: boolean;
    timeLeft: number;
    totalQuestions: number;
    assignments: AssignmentAnswer[];
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
    const [examContent, setExamContent] = useState<ExamContent[]>([]);

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
        setExamContent([]);
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
        setExamContent([]);
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
        setExamContent([]);
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
        isMultipleChoice: boolean = false,
        marks: number = 0,
        correctAnswerIndices: number[] = []
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
                        marks: marks,
                        correctAnswerIndices: correctAnswerIndices
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
        marks: number = 0,
        examId: number | null = null,
        correctAnswerIndices: number[] = []
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
                        marks: marks,
                        correctAnswerIndices: correctAnswerIndices
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
        if (examId) {
            setExamContent(prevExams => {
                return prevExams.map(exam => {
                    if (exam.examId === examId) {
                        const assignment = assignmentAnswers.find(a => a.assignmentId === assignmentId);
                        if (!assignment) return exam;
                        return {
                            ...exam,
                            assignments: [
                                ...exam.assignments,
                                assignment
                            ]
                        };
                    }
                    return exam;
                });
            });
        }
        const selectedAnswerIndices = assignmentAnswers.find(a => a.assignmentId === assignmentId)?.selectedAnswerIndices ?? [];
        handleSendAnswer(assignmentId, selectedAnswerIndices);
    };

    const handleShowAnswers = (assignmentId: number, hideAnswers: boolean, isMultipleChoice: boolean, marks: number = 0, examId: number | null = null, correctAnswerIndices: number[] = []) => {
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
                        marks: marks,
                        examId: examId,
                        correctAnswerIndices: correctAnswerIndices
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

    const handleStartExam = (examId: number, duration: number, totalQuestions: number) => {
        setExamContent((prevExams) => [
            ...prevExams,
            {
                examId: examId,
                finished: false,
                timeLeft: duration * 60,
                totalQuestions: totalQuestions,
                assignments: []
            },
        ]);
        let localTimeLeft = duration * 60;
        const intervalId = setInterval(() => {
            localTimeLeft -= 1;
            setExamContent((prevExams) =>
                prevExams.map((exam) =>
                    exam.examId === examId
                        ? { ...exam, timeLeft: localTimeLeft }
                        : exam
                )
            );
            if (localTimeLeft <= 0) {
                clearInterval(intervalId);
                handleFinishExam(examId);
            }
        }, 1000);
    };

    const handleFinishExam = (examId: number, totalNumOfQuestions: number = -1) => {
        const exam = examContent.find(e => e.examId === examId);
        if (totalNumOfQuestions !== -1 && (!exam || exam.assignments.length !== totalNumOfQuestions)) {
            return;
        }
        setExamContent(p => {
            return p.map(exam =>
                exam.examId === examId
                    ? { ...exam, finished: true }
                    : exam
            );
        });
        setTimeout(() => {
            const targetElement = document.getElementById(`exam_id_${examId}`);
            if (targetElement) {
                const offsetTop = targetElement.getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    const calculateTotalMarks = (examId: number): number => {
        let totalMarks = 0;
        const exam = examContent.find(exam => exam.examId === examId);
        if (exam) {
            exam.assignments.forEach(assignment => {
                const isCorrect = JSON.stringify(assignment.selectedAnswerIndices.sort()) === JSON.stringify(assignment.correctAnswerIndices.sort());
                if (isCorrect) {
                    totalMarks += assignment.marks;
                }
            });
        }
        return totalMarks;
    };

    const calculatePercentage = (examId: number, totalMarksPossible: number): string => {
        const totalMarks = calculateTotalMarks(examId);
        const percentage = totalMarksPossible > 0
            ? Math.round((totalMarks / totalMarksPossible) * 100).toString()
            : '0';
        return percentage;
    };

    const handleSendAnswer = async (assignmentId: number, selectedAnswerIndices: number[]) => {
        fetch(`http://127.0.0.1:8000/api/course/${id}/accounttopics/assignment/${assignmentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
                selected_answer_indices: selectedAnswerIndices,
            }),
        });
    }

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
        <div id="view-course-main-container">
            <a href={`/course/${courseStructure.id}/view/info`}>
                <button className="view-course-button">
                    Back to course info
                </button>
            </a>
            {view == "root" ?
                <>
                    <h1>{courseStructure.name}</h1>
                    <br />
                    {courseStructure.modules
                        .sort((a, b) => a.order - b.order)
                        .map((module, i) => (
                            <div key={i}>
                                <div
                                    className={module.module.type + '-element any-element element-margin module-container my-elements-element-margin'}
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
                    <span className="cursor-pointer" onClick={handleChangeLocationOneUp}>Back</span>
                    <br />
                    <span className="cursor-pointer" onClick={() => handleChangeLocationBack(-1)}>{courseStructure.name}</span>
                    <br />
                    {path.map((module, i) => (
                        <div className="cursor-pointer" key={i}>
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
                                className={element.element_data.type + '-element any-element element-margin my-elements-element-margin'}
                            >
                                {element.element_data.type == "text" && (
                                    <>
                                        <ContentRenderer content={element.element_data.data.content} />
                                    </>
                                )}
                                {element.element_data.type == "image" && (
                                    <>
                                        <div className="media-container">
                                            <img className="img-max-size" src={MEDIA_URL + element.element_data.data.image} />
                                        </div>
                                        <div className="media-description">
                                            <ContentRenderer content={element.element_data.data.description} />
                                        </div>
                                    </>
                                )}
                                {element.element_data.type == "video" && (
                                    <>
                                        <div className="media-container">
                                            <video className="img-max-size" src={MEDIA_URL + element.element_data.data.video} controls />
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
                                                    <img className="img-max-size" src={MEDIA_URL + element.element_data.data.image} />
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
                                                    <img className="img-max-size" src={MEDIA_URL + element.element_data.data.explanation_image} />
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
                                                    <img className="img-max-size" src={MEDIA_URL + element.element_data.data.image} />
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
                                                                            <img className="img-max-size" src={MEDIA_URL + element.element_data.data.explanation_image} />
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
                                        <span className="gray">Questions: {element.element_data.data.questions.length}</span>
                                        <br />
                                        <span className="gray">Total marks: {element.element_data.data.total_marks}</span>
                                        <br />
                                        <span id={`exam_id_${element.element_data.id}`}></span>
                                        <br />
                                        {!examContent.some(e => e.examId === element.element_data.id) ? (
                                            <button
                                                type="button"
                                                className="button-submit-answer"
                                                onClick={() => handleStartExam(
                                                    element.element_data.id,
                                                    (element.element_data.data as ExamElementStructure).duration,
                                                    (element.element_data.data as ExamElementStructure).questions.length
                                                )}>
                                                Start
                                            </button>
                                        ) : (
                                            <>
                                                {examContent.find(e => e.examId === element.element_data.id && e.finished) && (
                                                    <>
                                                        <h2>Exam finished</h2>
                                                        You scored {calculateTotalMarks(element.element_data.id)}/{(element.element_data.data as ExamElementStructure).total_marks} marks ({calculatePercentage(element.element_data.id, (element.element_data.data as ExamElementStructure).total_marks)}%)
                                                        <br /><br />
                                                    </>
                                                )}
                                                {examContent.find(e => e.examId === element.element_data.id) && (
                                                    <>
                                                        {examContent.find(e => e.examId === element.element_data.id && !e.finished) && (
                                                            <div className="timer">
                                                                Time left:{" "}
                                                                {
                                                                    (() => {
                                                                        const timeLeft = examContent.find(e => e.examId === element.element_data.id)?.timeLeft;
                                                                        if (!timeLeft) return "00:00:00";
                                                                        const hours = Math.floor(timeLeft / 3600);
                                                                        const minutes = Math.floor((timeLeft % 3600) / 60);
                                                                        const seconds = timeLeft % 60;
                                                                        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                                                                    })()
                                                                }
                                                            </div>
                                                        )}
                                                        {element.element_data.data.questions.map((examQuestion, i) => {
                                                            const assignment = assignmentAnswers.find(
                                                                (assignment) => assignment.assignmentId === examQuestion.question.id
                                                            );

                                                            const isAnswered = assignment?.answered;
                                                            const isMultipleChoice = examQuestion.question.is_multiple_choice;
                                                            const correctAnswerIndices = (examQuestion.question as AssignmentElementStructure).correct_answer_indices;

                                                            return (
                                                                <div className="assignment-element any-element element-margin margin-top-bottom-10">
                                                                    <span className="gray">Marks: {examQuestion.marks}</span>
                                                                    <br />
                                                                    <span className="gray">Question</span>
                                                                    <ContentRenderer content={examQuestion.question.question} />
                                                                    {examQuestion.question.image && (
                                                                        <>
                                                                            <div className="media-container">
                                                                                <img className="img-max-size" src={MEDIA_URL + examQuestion.question.image} />
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
                                                                            <br />
                                                                            <br />
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
                                                                                                isMultipleChoice,
                                                                                                examQuestion.marks,
                                                                                                examQuestion.question.correct_answer_indices
                                                                                            )}
                                                                                        >
                                                                                            <ContentRenderer content={answer} />
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                            {examContent.find(e => e.examId === element.element_data.id && !e.finished) && (<button
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
                                                                                    examQuestion.question.hide_answers,
                                                                                    examQuestion.marks,
                                                                                    element.element_data.id,
                                                                                    examQuestion.question.correct_answer_indices
                                                                                )}
                                                                                disabled={isAnswered}
                                                                            >
                                                                                Submit answer
                                                                            </button>

                                                                            )}
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
                                                                                                        <img className="img-max-size" src={MEDIA_URL + examQuestion.question.explanation_image} />
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
                                                                                examQuestion.question.is_multiple_choice,
                                                                                examQuestion.marks,
                                                                                element.element_data.id,
                                                                                examQuestion.question.correct_answer_indices
                                                                            )}
                                                                        >
                                                                            Show answers
                                                                        </button>
                                                                    )}

                                                                </div>
                                                            );
                                                        })}
                                                        {examContent.find(e => e.examId === element.element_data.id && !e.finished) && (
                                                            <button
                                                                type="button"
                                                                className={`button-submit-answer${examContent.find(e => e.examId === element.element_data.id)?.assignments.length !== element.element_data.data.questions.length
                                                                    ? ' button-submit-answer-disabled'
                                                                    : ''
                                                                    }`}
                                                                onClick={() => handleFinishExam(element.element_data.id, (element.element_data.data as ExamElementStructure).questions.length)}
                                                            >
                                                                Finish exam
                                                            </button>
                                                        )}
                                                        {examContent.find(e => e.examId === element.element_data.id && e.finished) && (
                                                            <button
                                                                type="button"
                                                                className="button-submit-answer"
                                                                onClick={() => location.reload()}
                                                            >
                                                                Try again
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}
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