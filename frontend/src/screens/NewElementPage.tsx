import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";

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
        fetchAllElements();
    }, []);

    useEffect(() => {
        const totalMarks = examElementAssignments.reduce((acc, assignment) => acc + assignment.marks, 0);
        setExamElementTotalMarks(totalMarks);
    }, [examElementAssignments]);

    useEffect(() => {
        console.log(moduleElementElements);
    }, [moduleElementElements]);
    return (
        <>
            <a href="/elements/my">Back</a>
            <br />
            Element name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            <br />
            Element type:
            <select value={elementType} onChange={(e) => setElementType(e.target.value)}>
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
                    Content: <textarea value={textElementContent} onChange={(e) => setTextElementContent(e.target.value)} />
                </>
                : ""}
            {elementType == "image" ?
                <>
                    Image:
                    <img id="uploaded-image"></img>
                    Upload image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Description: <textarea value={imageElementDescription} onChange={(e) => setImageElementDescription(e.target.value)} />
                </>
                : ""}
            {elementType == "video" ?
                <>
                    Video:
                    <video controls id="uploaded-video" />
                    Upload video
                    <input type="file" accept="video/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Description: <textarea value={videoElementDescription} onChange={(e) => setVideoElementDescription(e.target.value)} />
                </>
                : ""}
            {elementType === "example" ?
                <>
                    Question: <textarea value={exampleElementQuestion} onChange={(e) => setExampleElementQuestion(e.target.value)} />
                    Question image:
                    <img id="uploaded-example-image" />
                    Upload question image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Explanation: <textarea value={exampleElementExplanation} onChange={(e) => setExampleElementExplanation(e.target.value)} />
                    Explanation image:
                    <img id="uploaded-example-explanation-image" />
                    Upload explanation Image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "explanation")} />
                </>
                : ""}
            {elementType === "assignment" ?
                <>
                    Question: <textarea value={assignmentElementQuestion} onChange={(e) => setAssignmentElementQuestion(e.target.value)} />
                    Question image:
                    <img id="uploaded-assignment-image" />
                    Upload question image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Is multiple choice?
                    <input
                        type="checkbox"
                        checked={assignmentElementIsMultipleChoice}
                        onChange={() => setAssignmentElementIsMultipleChoice(!assignmentElementIsMultipleChoice)}
                    />
                    <br />
                    Hide answers?
                    <input
                        type="checkbox"
                        checked={assignmentElementHideAnswers}
                        onChange={() => setAssignmentElementHideAnswers(!assignmentElementHideAnswers)}
                    />
                    <br />
                    <h3>Answers:</h3>
                    {assignmentElementAnswers.map((answer, index) => (
                        <li key={index}>
                            {answer}
                            <input
                                type="checkbox"
                                checked={assignmentElementCorrectAnswerIndices.includes(index)}
                                onChange={() => handleAssignmentElementCorrectAnswerToggle(index)}
                            />
                            <button type="button" onClick={(e) => handleAssignmentElementRemoveAnswer(index)}>Remove</button>
                        </li>
                    ))}
                    <input type="text" value={assignmentElementNewAnswer} onChange={(e) => setAssignmentElementNewAnswer(e.target.value)} />
                    <br />
                    <button type="button" onClick={handleAssignmentElementAddAnswer}>Add</button>
                    <br />
                    Explanation: <textarea value={assignmentElementExplanation} onChange={(e) => setAssignmentElementExplanation(e.target.value)} />
                    <br />
                    Explanation image:
                    <img id="uploaded-assignment-explanation-image" />
                    Upload explanation Image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "explanation")} />
                    <br />
                </>
                : ""}
            {elementType == "exam" ?
                <>
                    Description: <textarea value={examElementDescription} onChange={(e) => setExamElementDescription(e.target.value)} />
                    <br />
                    Duration: <input type="number" value={examElementDuration} onChange={(e) => setExamElementDuration(parseInt(e.target.value))} />
                    <br />
                    Total marks: {examElementTotalMarks}
                    <br />
                    <button type="button" onClick={fetchAllElements}>Refresh</button>
                    <br />
                    Add questions:
                    <br />
                    {allElements.filter((element) => element.type == "assignment").map((element) => (
                        <div
                            draggable
                            className='assignment-to-drop'
                            key={element.id}
                            onDragStart={(e) => handleOnDrag(e, { ...element, marks: 1, order: examElementAssignments.length + 1 })}
                        >
                            {element.id}<br />
                            {element.name}<br />
                            {element.data.question}

                        </div>
                    ))}
                    <button type="button" onClick={() => console.log(examElementAssignments)}>debug</button>
                    <div
                        className='drop-zone'
                        onDrop={handleOnDrop}
                        onDragOver={handleDragOver}
                    >
                        {examElementAssignments
                            .sort((a, b) => a.order - b.order)
                            .map((assignment, i) => (
                                <div
                                    className='assignment-to-drop'
                                    key={i}
                                >
                                    {assignment.id}<br />
                                    {assignment.name}<br />
                                    {assignment.data.question}<br />
                                    Marks:
                                    <input
                                        type="number"
                                        value={assignment.marks}
                                        onChange={(e) => handleMarksChange(i, parseInt(e.target.value) || 0)}
                                    />
                                    {assignment.order > 1 && (
                                        <button type="button" onClick={() => handleSwapOrder(assignment.order, assignment.order - 1)}>^</button>
                                    )}
                                    {assignment.order < examElementAssignments.length && (
                                        <button type="button" onClick={() => handleSwapOrder(assignment.order, assignment.order + 1)}>v</button>
                                    )}
                                    <button type="button" onClick={() => handleRemoveAssignmentFromExam(assignment.order)}>Remove</button>
                                </div>
                            ))}
                    </div>
                </>
                : ""}
            {elementType == "module" ?
                <>
                    Title: <input type="text" value={moduleElementTitle} onChange={(e) => setModuleElementTitle(e.target.value)} />
                    <br />
                    Description: <textarea value={moduleElementDescription} onChange={(e) => setModuleElementDescription(e.target.value)} />
                    <br />
                    Module image:
                    <img id="uploaded-module-image" />
                    Upload module image
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <button type="button" onClick={fetchAllElements}>Refresh</button>
                    <br />
                    Add elements:
                    <br />
                    <br />
                    {allElements.map((element) => (
                        <div
                            draggable
                            className='assignment-to-drop'
                            key={element.id}
                            onDragStart={(e) => handleOnDrag_m(e, { ...element, order: moduleElementElements.length + 1 })}
                        >
                            {element.id}<br />
                            {element.name}<br />
                            {element.type}

                        </div>
                    ))}
                    <button type="button" onClick={() => console.log(moduleElementElements)}>debug</button>
                    <div
                        className='drop-zone'
                        onDrop={handleOnDrop_m}
                        onDragOver={handleDragOver_m}
                    >
                        {moduleElementElements
                            .sort((a, b) => a.order - b.order)
                            .map((element, i) => (
                                <div
                                    className='assignment-to-drop'
                                    key={i}
                                >
                                    {element.id}<br />
                                    {element.name}<br />
                                    {element.type}<br />
                                    {element.order > 1 && (
                                        <button type="button" onClick={() => handleSwapElementsOrder(element.order, element.order + 1)}>v</button>
                                    )}
                                    {element.order < moduleElementElements.length && (
                                        <button type="button" onClick={() => handleSwapElementsOrder(element.order, element.order - 1)}>^</button>
                                    )}
                                    <button type="button" onClick={() => handleRemoveElementFromModule(element.order)}>Remove</button>
                                </div>
                            ))}
                    </div>
                </>
                : ""}
            <br />
            <button type="button" onClick={handleCreateElement}>Save</button>
        </>
    )
}