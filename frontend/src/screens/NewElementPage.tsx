import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import TextEditor from '../components/TextEditor';
import ContentRenderer from '../components/ContentRenderer';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';
import { MEDIA_URL } from '../constants';

export default function NewElementPage() {
    const [elementType, setElementType] = useState<string>("text");
    const [name, setName] = useState<string>("");

    const [textElementContent, setTextElementContent] = useState<string>("");

    const [imageElementImage, setImageElementImage] = useState<File | null>(null);
    const [imageElementDescription, setImageElementDescription] = useState<string>("");

    const [videoElementVideo, setVideoElementVideo] = useState<File | null>(null);
    const [videoElementDescription, setVideoElementDescription] = useState<string>("");

    const [exampleElementQuestion, setExampleElementQuestion] = useState<string>("");
    const [exampleElementImage, setExampleElementImage] = useState<File | null>(null);
    const [exampleElementExplanation, setExampleElementExplanation] = useState<string>("");
    const [exampleElementExplanationImage, setExampleElementExplanationImage] = useState<File | null>(null);

    const [assignmentElementQuestion, setAssignmentElementQuestion] = useState<string>("");
    const [assignmentElementImage, setAssignmentElementImage] = useState<File | null>(null);
    const [assignmentElementAnswers, setAssignmentElementAnswers] = useState<string[]>([]);
    const [assignmentElementCorrectAnswerIndices, setAssignmentElementCorrectAnswerIndices] = useState<number[]>([]);
    const [assignmentElementIsMultipleChoice, setAssignmentElementIsMultipleChoice] = useState<boolean>(false);
    const [assignmentElementHideAnswers, setAssignmentElementHideAnswers] = useState<boolean>(false);
    const [assignmentElementExplanation, setAssignmentElementExplanation] = useState<string>("");
    const [assignmentElementExplanationImage, setAssignmentElementExplanationImage] = useState<File | null>(null);
    const [assignmentElementNewAnswer, setAssignmentElementNewAnswer] = useState<string>("");

    const [examElementDescription, setExamElementDescription] = useState<string>("");
    const [examElementDuration, setExamElementDuration] = useState<number>(60);
    const [examElementTotalMarks, setExamElementTotalMarks] = useState<number>(0);

    const [moduleElementTitle, setModuleElementTitle] = useState<string>("");
    const [moduleElementDescription, setModuleElementDescription] = useState<string>("");
    const [moduleElementImage, setModuleElementImage] = useState<File | null>(null);

    const [allElements, setAllElements] = useState<CourseElement[]>([]);

    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchAllElements = async () => {
        fetch("http://127.0.0.1:8000/api/elements/my", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setAllElements(data));
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        imageType: "main" | "explanation" = "main"
    ) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (elementType === "image") {
                    const imageElement = document.getElementById("uploaded-image") as HTMLImageElement;
                    if (imageElement && fileReader.result) {
                        imageElement.src = fileReader.result as string;
                    }
                    setImageElementImage(file);
                } else if (elementType === "video") {
                    const videoElement = document.getElementById("uploaded-video") as HTMLVideoElement;
                    if (videoElement && fileReader.result) {
                        videoElement.src = fileReader.result as string;
                    }
                    setVideoElementVideo(file);
                } else if (elementType === "example") {
                    if (imageType === "main") {
                        const exampleImageElement = document.getElementById("uploaded-example-image") as HTMLImageElement;
                        if (exampleImageElement && fileReader.result) {
                            exampleImageElement.src = fileReader.result as string;
                        }
                        setExampleElementImage(file);
                    } else if (imageType === "explanation") {
                        const exampleExplanationImageElement = document.getElementById("uploaded-example-explanation-image") as HTMLImageElement;
                        if (exampleExplanationImageElement && fileReader.result) {
                            exampleExplanationImageElement.src = fileReader.result as string;
                        }
                        setExampleElementExplanationImage(file);
                    }
                } else if (elementType === "assignment") {
                    if (imageType === "main") {
                        const assignmentImageElement = document.getElementById("uploaded-assignment-image") as HTMLImageElement;
                        if (assignmentImageElement && fileReader.result) {
                            assignmentImageElement.src = fileReader.result as string;
                        }
                        setAssignmentElementImage(file);
                    } else if (imageType === "explanation") {
                        const assignmentExplanationImageElement = document.getElementById("uploaded-assignment-explanation-image") as HTMLImageElement;
                        if (assignmentExplanationImageElement && fileReader.result) {
                            assignmentExplanationImageElement.src = fileReader.result as string;
                        }
                        setAssignmentElementExplanationImage(file);
                    }
                } else if (elementType === "module") {
                    const imageElement = document.getElementById("uploaded-module-image") as HTMLImageElement;
                    if (imageElement && fileReader.result) {
                        imageElement.src = fileReader.result as string;
                    }
                    setModuleElementImage(file);
                }
            };

            fileReader.readAsDataURL(file);
        }
    };


    const handleAssignmentElementAddAnswer = () => {
        if (assignmentElementNewAnswer.trim() !== "") {
            setAssignmentElementAnswers([...assignmentElementAnswers, assignmentElementNewAnswer.trim()]);
            setAssignmentElementNewAnswer("");
        }
    };

    const handleAssignmentElementRemoveAnswer = (index: number) => {
        setAssignmentElementAnswers(assignmentElementAnswers.filter((_, i) => i !== index));
        setAssignmentElementCorrectAnswerIndices((p) =>
            p
                .filter((i) => i !== index)
                .map((i) => (i > index ? i - 1 : i))
        );
    };

    const handleAssignmentElementCorrectAnswerToggle = (index: number) => {
        if (assignmentElementCorrectAnswerIndices.includes(index))
            setAssignmentElementCorrectAnswerIndices(assignmentElementCorrectAnswerIndices.filter((i) => i !== index));
        else if (assignmentElementIsMultipleChoice || assignmentElementCorrectAnswerIndices.length == 0)
            setAssignmentElementCorrectAnswerIndices([...assignmentElementCorrectAnswerIndices, index]);
    };

    type ExamAssignmentElement = AssignmentElement & {
        marks: number;
        order: number;
    }
    const [examElementAssignments, setExamElementAssignments] = useState<ExamAssignmentElement[]>([]);
    const handleOnDrag = (e: React.DragEvent, assignment: ExamAssignmentElement) => {
        e.dataTransfer.setData("assignment", JSON.stringify(assignment));
    }
    const handleOnDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const assignmentData = e.dataTransfer.getData("assignment");
        const assignment: ExamAssignmentElement = JSON.parse(assignmentData);
        console.log(assignment);
        setExamElementAssignments([...examElementAssignments, assignment]);
    }
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const handleMarksChange = (index: number, newMarks: number) => {
        setExamElementAssignments((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], marks: newMarks };
            return updated;
        });
    };

    const countTotalMarks = (examQuestions: any) => {
        return examQuestions.reduce((sum: number, question: any) => sum + (question.marks || 0), 0);
    }

    const reorderQuestions = (examQuestions: any) => {
        const reorderedQuestions = examQuestions
            .sort((a: any, b: any) => a.order - b.order)
            .map((question: any, index: number) => ({
                ...question,
                order: index + 1,
            }));
        return reorderedQuestions;
    }

    const handleSwapOrder = (order1: number, order2: number) => {
        setExamElementAssignments((prev) => {
            if (!prev) return prev;
            const updated = prev.map((q: any) => {
                if (q.order === order1) {
                    return { ...q, order: order2 };
                }
                if (q.order === order2) {
                    return { ...q, order: order1 };
                }
                return q;
            })
            return updated;
        })
    }

    const handleRemoveAssignmentFromExam = (order: number) => {
        setExamElementAssignments((prev) => {
            if (!prev) return prev;
            const updated = prev.filter((q: any) => q.order !== order);
            const reorderedQuestions = reorderQuestions(updated);
            return reorderedQuestions;
        })
        setExamElementTotalMarks(countTotalMarks(examElementAssignments));
    }

    const reorderElements = (elements: any) => {
        const reorderedElements = elements
            .sort((a: any, b: any) => a.order - b.order)
            .map((element: any, index: number) => ({
                ...element,
                order: index + 1,
            }));
        return reorderedElements;
    }

    const handleSwapElementsOrder = (order1: number, order2: number) => {
        setModuleElementElements((prev) => {
            if (!prev) return prev;
            const updated = prev.map((e: any) => {
                if (e.order === order1) {
                    return { ...e, order: order2 };
                }
                if (e.order === order2) {
                    return { ...e, order: order1 };
                }
                return e;
            })
            return updated;
        })
    }

    const handleRemoveElementFromModule = (order: number) => {
        setModuleElementElements((prev) => {
            if (!prev) return prev;
            const updated = prev.filter((e: any) => e.order !== order);
            const reorderedElements = reorderElements(updated);
            return reorderedElements;
        })
    }





    type ModuleCourseElement = CourseElement & {
        order: number;
    }
    const [moduleElementElements, setModuleElementElements] = useState<ModuleCourseElement[]>([]);
    const handleOnDrag_m = (e: React.DragEvent, element: ModuleCourseElement) => {
        e.dataTransfer.setData("element", JSON.stringify(element));
    }
    const handleOnDrop_m = (e: React.DragEvent) => {
        e.preventDefault();
        const elementData = e.dataTransfer.getData("element");
        const element: ModuleCourseElement = JSON.parse(elementData);
        console.log(element);
        setModuleElementElements([...moduleElementElements, element]);
    }
    const handleDragOver_m = (e: React.DragEvent) => {
        e.preventDefault();
    }



    const handleCreateElement = async () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("type", elementType);
        if (elementType == "text") {
            formData.append("content", textElementContent);
        }
        if (elementType == "image") {
            if (!imageElementImage) return 1;
            formData.append("image", imageElementImage);
            formData.append("description", imageElementDescription);
        }
        if (elementType == "video") {
            if (!videoElementVideo) return 1;
            formData.append("video", videoElementVideo);
            formData.append("description", videoElementDescription);
        }
        if (elementType == "example") {
            if (exampleElementImage)
                formData.append("image", exampleElementImage);
            if (exampleElementExplanationImage)
                formData.append("explanation_image", exampleElementExplanationImage);
            //if (!exampleElementImage || !exampleElementExplanationImage) return 1;
            formData.append("question", exampleElementQuestion);
            //formData.append("image", exampleElementImage);
            formData.append("explanation", exampleElementExplanation);
            //formData.append("explanation_image", exampleElementExplanationImage);
        }
        if (elementType == "assignment") {
            formData.append("question", assignmentElementQuestion);
            if (assignmentElementImage)
                formData.append("image", assignmentElementImage);
            formData.append("answers", JSON.stringify(assignmentElementAnswers));
            formData.append("correct_answer_indices", JSON.stringify(assignmentElementCorrectAnswerIndices));
            formData.append("is_multiple_choice", assignmentElementIsMultipleChoice ? "true" : "false");
            formData.append("hide_answers", assignmentElementHideAnswers ? "true" : "false");
            formData.append("explanation", assignmentElementExplanation);
            if (assignmentElementExplanationImage)
                formData.append("explanation_image", assignmentElementExplanationImage);
        }
        if (elementType == "exam") {
            formData.append("description", examElementDescription);
            formData.append("duration", examElementDuration.toString());
            formData.append("total_marks", examElementTotalMarks.toString());
            formData.append("exam_assignments", JSON.stringify(examElementAssignments));
        }
        if (elementType == "module") {
            formData.append("title", moduleElementTitle);
            formData.append("description", moduleElementDescription);
            if (moduleElementImage)
                formData.append("image", moduleElementImage);
            formData.append("module_elements", JSON.stringify(moduleElementElements));

        }
        const response = await fetch("http://127.0.0.1:8000/api/element", {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formData,
        })
            .then((response) => {
                console.log(response);
            })
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchAllElements();
    }, []);

    useEffect(() => {
        const totalMarks = examElementAssignments.reduce((acc, assignment) => acc + assignment.marks, 0);
        setExamElementTotalMarks(totalMarks);
    }, [examElementAssignments]);

    return (
        <div id="edit-element-main-container">
            <a href="/elements/my">
                <button className="edit-element-button">
                    Back to my elements
                </button>
            </a>
            <button className="edit-element-button" type="button" onClick={handleCreateElement}>Save</button>
            <br />
            <div className="edit-element-label-box">
                Element name:&nbsp;<input className="edit-element-input-text" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <br />
            Element type:&nbsp;
            <select className="create-course-select" value={elementType} onChange={(e) => setElementType(e.target.value)}>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="example">Example</option>
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="module">Module</option>
            </select>
            <br />
            {elementType == "text" ?
                <>
                    <div className="edit-element-label-box">
                        Content:&nbsp;
                    </div>
                    <TextEditor value={textElementContent} onChange={(value) => setTextElementContent(value)} />
                </>
                : ""}
            {elementType == "image" ?
                <>
                    <div className="edit-element-label-box">
                        Image:&nbsp;
                    </div>
                    <img className="edit-element-img" id="uploaded-image"></img>
                    <br />
                    Upload image:&nbsp;
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor value={imageElementDescription} onChange={(value) => setImageElementDescription(value)} />
                </>
                : ""}
            {elementType == "video" ?
                <>
                    <div className="edit-element-label-box">
                        Video:&nbsp;
                    </div>
                    <video controls id="uploaded-video" />
                    <br />
                    Upload video:&nbsp;
                    <input className="edit-element-img" type="file" accept="video/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor value={videoElementDescription} onChange={(value) => setVideoElementDescription(value)} />
                </>
                : ""}
            {elementType === "example" ?
                <>
                    <div className="edit-element-label-box">
                        Question:&nbsp;
                    </div>
                    <TextEditor value={exampleElementQuestion} onChange={(value) => setExampleElementQuestion(value)} />
                    <div className="edit-element-label-box">
                        Question image:&nbsp;
                    </div>
                    <img className="edit-element-img" id="uploaded-example-image" />
                    <br />
                    Upload question image:&nbsp;
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <div className="edit-element-label-box">
                        Explanation:&nbsp;
                    </div>
                    <TextEditor value={exampleElementExplanation} onChange={(value) => setExampleElementExplanation(value)} />
                    <div className="edit-element-label-box">
                        Explanation image:&nbsp;
                    </div>
                    <img className="edit-element-img" id="uploaded-example-explanation-image" />
                    <br />
                    Upload explanation Image:&nbsp;
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "explanation")} />
                </>
                : ""}
            {elementType === "assignment" ?
                <>
                    <div className="edit-element-label-box">
                        Question:&nbsp;
                    </div>
                    <TextEditor value={assignmentElementQuestion} onChange={(value) => setAssignmentElementQuestion(value)} />
                    <div className="edit-element-label-box">
                        Question image:&nbsp;
                    </div>
                    <img id="uploaded-assignment-image" />
                    <br />
                    Upload question image:&nbsp;
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Multiple choice&nbsp;
                        <input
                            type="checkbox"
                            className="edit-element-checkbox"
                            checked={assignmentElementIsMultipleChoice}
                            onChange={() => setAssignmentElementIsMultipleChoice(!assignmentElementIsMultipleChoice)}
                        />
                    </div>
                    <div className="edit-element-label-box">
                        Hide answers&nbsp;
                        <input
                            type="checkbox"
                            className="edit-element-checkbox"
                            checked={assignmentElementHideAnswers}
                            onChange={() => setAssignmentElementHideAnswers(!assignmentElementHideAnswers)}
                        />
                    </div>
                    <br />
                    <div className="edit-element-label-box">
                        Answers
                    </div>
                    <div className="edit-element-answer-container">
                        {assignmentElementAnswers.map((answer, index) => (
                            <div className={`edit-element-answer ${assignmentElementCorrectAnswerIndices.includes(index) ? "edit-element-answer-correct" : "edit-element-answer-wrong"}`} key={index}>
                                <ContentRenderer content={answer} />
                                <input
                                    type="checkbox"
                                    checked={assignmentElementCorrectAnswerIndices.includes(index)}
                                    onChange={() => handleAssignmentElementCorrectAnswerToggle(index)}
                                />
                                <button className="edit-element-button edit-element-button-small edit-element-button-red" type="button" onClick={(e) => handleAssignmentElementRemoveAnswer(index)}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <br />
                    <div className="edit-element-label-box">
                        Add new answer:&nbsp;
                    </div>
                    <TextEditor value={assignmentElementNewAnswer} onChange={(value) => setAssignmentElementNewAnswer(value)} />
                    <button className="edit-element-button edit-element-button-small" type="button" onClick={handleAssignmentElementAddAnswer}>Add answer</button>
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Explanation:&nbsp;
                    </div>
                    <TextEditor value={assignmentElementExplanation} onChange={(value) => setAssignmentElementExplanation(value)} />
                    <br />
                    <div className="edit-element-label-box">
                        Explanation image:&nbsp;
                        <br />
                        <img id="uploaded-assignment-explanation-image" />
                    </div>
                    Upload explanation Image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "explanation")} />
                    <br />
                </>
                : ""}
            {elementType == "exam" ?
                <>
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor value={examElementDescription} onChange={(value) => setExamElementDescription(value)} />
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Duration:&nbsp;
                        <input className="edit-element-input-number" type="number" min={1} value={examElementDuration} onChange={(e) => setExamElementDuration(parseInt(e.target.value))} />
                        &nbsp;minutes
                    </div>
                    <div className="edit-element-label-box">
                        Total marks: {examElementTotalMarks}
                    </div>
                    <br />
                    <div className="edit-element-bottom-main-container">
                        <div className="edit-element-bottom-left">
                            <div className="edit-element-search-container">
                                Search:&nbsp;
                                <input
                                    type="text"
                                    className="edit-element-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="edit-element-button edit-element-button-wide" type="button" onClick={fetchAllElements}>Refresh</button>
                            <br />
                            {allElements.filter((e) => e.name.includes(searchQuery)).filter((element) => element.type == "assignment").map((element) => (
                                <div
                                    draggable
                                    className={element.type + '-element any-element element-margin my-elements-element-margin'}
                                    key={element.id}
                                    onDragStart={(e) => handleOnDrag(e, { ...element, marks: 1, order: examElementAssignments.length + 1 })}
                                >
                                    <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                        {element.name}
                                    </div>
                                    <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                        <span className="gray">Question</span>
                                        <ContentRenderer content={element.data.question} />
                                        <br />
                                        {element.data.image ?
                                            <>
                                                <img src={MEDIA_URL + element.data.image} />
                                                <br />
                                                <br />
                                            </>
                                            : ""}
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
                                        {element.data.explanation_image ?
                                            <>
                                                <img src={MEDIA_URL + element.data.explanation_image} />
                                                <br />
                                                <br />
                                            </>
                                            : ""}
                                    </div>
                                    <a href={`/element/${element.id}/edit`} target='_blank'>
                                        <button className="edit-course-button edit-course-button-border-assignment-element">
                                            Edit
                                        </button>
                                    </a>
                                    <button
                                        className="edit-course-button edit-course-button-border-assignment-element"
                                        onClick={() => {
                                            setExamElementAssignments([...examElementAssignments, { ...(element as ExamAssignmentElement), marks: 1, order: examElementAssignments.length + 1 }]);
                                        }}>
                                        Attach
                                    </button>
                                </div>
                            ))}
                            {/* <button type="button" onClick={() => console.log(examElementAssignments)}>debug</button>
                            <div
                                className='drop-zone'
                                onDrop={handleOnDrop}
                                onDragOver={handleDragOver}
                            >
                            </div> */}
                        </div>
                        <div className="edit-element-bottom-right">
                            {examElementAssignments
                                .sort((a, b) => a.order - b.order)
                                .map((assignment, i) => (
                                    <div
                                        className={assignment.type + '-element any-element element-margin my-elements-element-margin'}
                                        key={i}
                                    >
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            {assignment.name}
                                        </div>
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            Marks:
                                            <input
                                                type="number"
                                                className="edit-element-input-number edit-element-input-number-small"
                                                min={1}
                                                value={assignment.marks}
                                                onChange={(e) => handleMarksChange(i, parseInt(e.target.value) || 0)}
                                            />
                                            <br />
                                            <span className="gray">Question</span>
                                            <ContentRenderer content={assignment.data.question} />
                                            <br />
                                            {assignment.data.image ?
                                                <>
                                                    <img src={MEDIA_URL + assignment.data.image} />
                                                    <br />
                                                </>
                                                : ""}
                                            <br />
                                            <span className="gray">{assignment.data.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                            <br />
                                            <span className="gray">{assignment.data.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                            <br />
                                            <br />
                                            <span className="gray">Answers</span>
                                            <br />
                                            <br />
                                            <div className="edit-element-answer-container">
                                                {assignment.data.answers.map((answer, i) => (
                                                    <div className={`edit-element-answer ${assignment.data.correct_answer_indices.includes(i) ? "edit-element-answer-correct" : "edit-element-answer-wrong"}`} key={i}>
                                                        <ContentRenderer content={answer} />
                                                    </div>
                                                ))}
                                            </div>
                                            <br />
                                            <span className="gray">Explanation</span>
                                            <ContentRenderer content={assignment.data.explanation} />
                                            <br />
                                            {assignment.data.explanation_image ?
                                                <>
                                                    <img src={MEDIA_URL + assignment.data.explanation_image} />
                                                    <br />
                                                </>
                                                : ""}
                                        </div>
                                        <a href={`/element/${assignment.id}/edit`} target='_blank'>
                                            <button className="edit-course-button edit-course-button-border-assignment-element">
                                                Edit
                                            </button>
                                        </a>
                                        {assignment.order > 1 && (
                                            <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleSwapOrder(assignment.order, assignment.order - 1)}>Move up</button>
                                        )}
                                        {assignment.order < examElementAssignments.length && (
                                            <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleSwapOrder(assignment.order, assignment.order + 1)}>Move down</button>
                                        )}
                                        <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleRemoveAssignmentFromExam(assignment.order)}>Detach</button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </>
                : ""}
            {elementType == "module" ?
                <>
                    <div className="edit-element-label-box">
                        Title:&nbsp;<input className="edit-element-input-text" type="text" value={moduleElementTitle} onChange={(e) => setModuleElementTitle(e.target.value)} />
                    </div>
                    <div className="edit-element-label-box">
                        Description:&nbsp;<TextEditor value={moduleElementDescription} onChange={(value) => setModuleElementDescription(value)} />
                    </div>
                    <br />
                    {/* Module image:
                    <img id="uploaded-module-image" />
                    Upload module image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br /> */}
                    <div className="edit-element-bottom-main-container">
                        <div className="edit-element-bottom-left">
                            <div className="edit-element-search-container">
                                Search:&nbsp;
                                <input
                                    type="text"
                                    className="edit-element-search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="edit-element-button edit-element-button-wide" type="button" onClick={fetchAllElements}>Refresh</button>

                            {allElements.map((element) => (
                                <div
                                    draggable
                                    className={element.type + '-element any-element element-margin my-elements-element-margin'}
                                    key={element.id}
                                    onDragStart={(e) => handleOnDrag_m(e, { ...element, order: moduleElementElements.length + 1 })}
                                >
                                    {element.name}
                                    <br />
                                    <a href={`/element/${element.id}/edit`} target='_blank'>
                                        <button type="button" className={`edit-course-button edit-course-button-border-${element.type}-element`}>
                                            Edit
                                        </button>
                                    </a>
                                    <button
                                        className={`edit-course-button edit-course-button-border-${element.type}-element`}
                                        onClick={() => {
                                            setModuleElementElements([...moduleElementElements, { ...element, order: moduleElementElements.length + 1 }]);
                                        }}>
                                        Attach
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* <button type="button" onClick={() => console.log(moduleElementElements)}>debug</button>
                    <div
                        className='drop-zone'
                        onDrop={handleOnDrop_m}
                        onDragOver={handleDragOver_m}
                    > */}
                        <div className="edit-element-bottom-right">
                            {moduleElementElements
                                .sort((a, b) => a.order - b.order)
                                .map((element, i) => (
                                    <div
                                        className={element.type + '-element any-element element-margin my-elements-element-margin'}
                                        key={i}
                                    >
                                        {element.name}
                                        <br />
                                        <a href={`/element/${element.id}/edit`} target='_blank'>
                                            <button className={`edit-course-button edit-course-button-border-${element.type}-element`}>
                                                Edit
                                            </button>
                                        </a>
                                        {element.order > 1 && (
                                            <button className={`edit-course-button edit-course-button-border-${element.type}-element`} type="button" onClick={() => handleSwapElementsOrder(element.order, element.order - 1)}>Move up</button>
                                        )}
                                        {element.order < moduleElementElements.length && (
                                            <button className={`edit-course-button edit-course-button-border-${element.type}-element`} type="button" onClick={() => handleSwapElementsOrder(element.order, element.order + 1)}>Move down</button>
                                        )}
                                        <button className={`edit-course-button edit-course-button-border-${element.type}-element`} type="button" onClick={() => handleRemoveElementFromModule(element.order)}>Detach</button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </>
                : ""}
        </div>
    )
}