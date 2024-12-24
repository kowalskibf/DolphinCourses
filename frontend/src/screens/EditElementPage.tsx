import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';

type Params = {
    id: string;
}

type DetailExamQuestion = {
    id: number;
    question: AssignmentElement;
    marks: number;
    order: number;
}

type DetailExamElement = ExamElement & {
    data: ExamElement["data"] & {
        questions: DetailExamQuestion[];
    }
}

type DetailElementToModule = {
    id: number;
    element: CourseElement;
    order: number;
}

type DetailModuleElement = ModuleElement & {
    data: ModuleElement["data"] & {
        elements: DetailElementToModule[];
    }
}

type ElementDetail =
    | TextElement
    | ImageElement
    | VideoElement
    | ExampleElement
    | AssignmentElement
    | DetailExamElement
    | DetailModuleElement;

export default function EditElementPage() {

    const { id } = useParams<Params>();
    const [element, setElement] = useState<ElementDetail | undefined>(undefined);

    const [myElements, setMyElements] = useState<AssignmentElement[]>([]);

    const [searchQuery, setSearchQuery] = useState<string>("");

    const [formData, setFormData] = useState<Record<string, any>>({});

    const [newAnswer, setNewAnswer] = useState<string>("");

    const fetchElement = async () => {
        fetch(`http://127.0.0.1:8000/api/element/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                // console.log("pobrane data z api");
                // console.log(data);
                setElement(data);
                setFormData({
                    name: data.name,
                    ...Object.fromEntries(
                        Object.entries(data.data || {}).map(([key, value]) =>
                            key.toLowerCase().includes("image") ||
                                key.toLowerCase().includes("video")
                                ? [key, null]
                                : [key, value]
                        )
                    )
                });
                // if (data.type == "exam") {
                //     handleChange('exam_questions', data.data.questions.map((question: DetailExamQuestion) => ({ id: question.id, order: question.order })));
                // }
            });
    }

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

    const handleChange = (key: string, value: any) => {
        setFormData((prev) => {
            if (Array.isArray(prev[key])) {
                return {
                    ...prev,
                    [key]: Array.isArray(value) ? value : [...prev[key], value],
                };
            }
            return {
                ...prev,
                [key]: value,
            };
        });
        console.log(formData);
    };

    const handleSwapOrder = (key: string, order1: number, order2: number) => {
        setFormData((prev) => {
            if (Array.isArray(prev[key])) {
                return {
                    ...prev,
                    [key]: prev[key].map((item: any) => {
                        if (item.order === order1) {
                            return { ...item, order: order2 };
                        }
                        if (item.order === order2) {
                            return { ...item, order: order1 };
                        }
                        return item;
                    }),
                };
            }
            return prev;
        });
        setFormData((prev) => {
            if (!prev) return prev;
            const updated = prev.questions.map((q: any) => {
                if (q.order === order1) {
                    return { ...q, order: order2 };
                }
                if (q.order === order2) {
                    return { ...q, order: order1 };
                }
                return q;
            });
            return {
                ...prev,
                questions: updated,
            };
        });
    };

    const countTotalMarks = (examQuestions: any) => {
        return examQuestions.reduce((sum: number, question: any) => sum + (question.marks || 0), 0);
    }

    const handleModifyMarks = (examQuestionId: number, newMarks: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const updatedExamQuestions = prev.questions.map((q: any) => {
                if (q.id === examQuestionId) {
                    return { ...q, marks: newMarks };
                }
                return q;
            })
            //const totalMarks = updatedExamQuestions.reduce((sum: number, question: any) => sum + (question.marks || 0), 0);
            const totalMarks = countTotalMarks(updatedExamQuestions);
            return {
                ...prev,
                questions: updatedExamQuestions,
                total_marks: totalMarks,
            };
        });
    }

    const reorderQuestions = (examQuestions: any) => {
        const reorderedQuestions = examQuestions.sort((a: any, b: any) => a.order - b.order).map((question: any, index: number) => ({
            ...question,
            order: index + 1,
        }));
        return reorderedQuestions;
    }

    const handleRemoveAssignmentFromExam = (examQuestionId: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const updatedExamQuestions = prev.questions.filter(
                (q: any) => q.id !== examQuestionId
            );
            const totalMarks = countTotalMarks(updatedExamQuestions);
            const reorderedQuestions = reorderQuestions(updatedExamQuestions);
            return {
                ...prev,
                questions: reorderedQuestions,
                total_marks: totalMarks,
            };
        });
    }

    const handleAddAssignmentToExam = (assignment: AssignmentElement) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const maxOrder = prev.questions.length > 0
                ? Math.max(...prev.questions.map((q: any) => q.order))
                : 0;
            const newExamQuestion: DetailExamQuestion = {
                id: 0,
                marks: 1,
                order: maxOrder + 1,
                question: assignment,
            };
            const updatedExamQuestions = [...prev.questions, newExamQuestion];
            const totalMarks = countTotalMarks(updatedExamQuestions);
            const reorderedExamQuestions = reorderQuestions(updatedExamQuestions);
            return {
                ...prev,
                questions: reorderedExamQuestions,
                total_marks: totalMarks,
            };
        });
    }

    const exam_handleOnDrag = (e: React.DragEvent, assignment: AssignmentElement) => {
        e.dataTransfer.setData("assignment", JSON.stringify(assignment));
    }

    const exam_handleOnDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const assignmentData = e.dataTransfer.getData("assignment");
        const assignment: AssignmentElement = JSON.parse(assignmentData);
        handleAddAssignmentToExam(assignment);
    }

    const exam_handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const handleAddElementToModule = (element: CourseElement) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const maxOrder = prev.elements.length > 0
                ? Math.max(...prev.elements.map((e: any) => e.order))
                : 0;
            const newElement: DetailElementToModule = {
                id: 0,
                order: maxOrder + 1,
                element: element,
            };
            const updatedElements = [...prev.elements, newElement];
            const reorderedElements = reorderElements(updatedElements);
            return {
                ...prev,
                elements: reorderedElements,
            };
        });
    }

    const reorderElements = (elementsToModule: any) => {
        const reorderedElements = elementsToModule.sort((a: any, b: any) => a.order - b.order).map((element: any, index: number) => ({
            ...element,
            order: index + 1,
        }));
        return reorderedElements;
    }

    const handleSwapElementsOrder = (key: string, order1: number, order2: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const updated = prev.elements.map((e: any) => {
                if (e.order === order1) {
                    return { ...e, order: order2 };
                }
                if (e.order === order2) {
                    return { ...e, order: order1 };
                }
                return e;
            });
            return {
                ...prev,
                elements: reorderElements(updated),
            };
        });
    };

    const handleRemoveElementFromModule = (order: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const updated = prev.elements.filter(
                (e: any) => e.order !== order
            );
            const reordered = reorderElements(updated);
            return {
                ...prev,
                elements: reordered,
            };
        });
    }

    const module_handleOnDrag = (e: React.DragEvent, element: CourseElement) => {
        e.dataTransfer.setData("element", JSON.stringify(element));
    }

    const module_handleOnDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const elementData = e.dataTransfer.getData("element");
        const element: CourseElement = JSON.parse(elementData);
        handleAddElementToModule(element);
    }

    const module_handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    }

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        imageType: "main" | "explanation" = "main"
    ) => {
        if (element && e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileReader = new FileReader();

            fileReader.onload = () => {
                if (element.type == 'image') {
                    const imageElement = document.getElementById("uploaded-image") as HTMLImageElement;
                    if (imageElement && fileReader.result) {
                        imageElement.src = fileReader.result as string;
                    }
                    handleChange('image', file);
                } else if (element.type == 'video') {
                    const videoElement = document.getElementById("uploaded-video") as HTMLVideoElement;
                    if (videoElement && fileReader.result) {
                        videoElement.src = fileReader.result as string;
                    }
                    handleChange('video', file);
                } else if (element.type == 'example' || element.type == 'assignment') {
                    if (imageType == "main") {
                        const imageElement = document.getElementById("uploaded-image") as HTMLImageElement;
                        if (imageElement && fileReader.result) {
                            imageElement.src = fileReader.result as string;
                        }
                        handleChange('image', file);
                    } else {
                        const imageElement = document.getElementById("uploaded-explanation-image") as HTMLImageElement;
                        if (imageElement && fileReader.result) {
                            imageElement.src = fileReader.result as string;
                        }
                        handleChange('explanation_image', file);
                    }
                }
            };
            fileReader.readAsDataURL(file);
        }
    }

    const handleAddAnswer = () => {
        if (newAnswer.trim() !== "") {
            handleChange('answers', [...formData.answers, newAnswer.trim()]);
            setNewAnswer("");
        }
    };

    const handleRemoveAnswer = (index: number) => {
        setFormData((prev) => {
            const updatedAnswers = [...prev.answers];
            updatedAnswers.splice(index, 1);

            const updatedCorrectAnswers = prev.correct_answer_indices
                .filter((i: number) => i !== index)
                .map((i: number) => (i > index ? i - 1 : i));

            return {
                ...prev,
                answers: updatedAnswers,
                correct_answer_indices: updatedCorrectAnswers,
            };
        });
    };

    const handleToggleAnswer = (index: number) => {
        const isCorrect = formData.correct_answer_indices.includes(index);
        const updatedCorrectAnswers = isCorrect
            ? formData.correct_answer_indices.filter((i: number) => i !== index)
            : [...formData.correct_answer_indices, index];

        handleChange('correct_answer_indices', updatedCorrectAnswers);
    };

    const handleEditElement = async () => {

        const formDataToSend = new FormData();

        Object.entries(formData).forEach(([key, value]) => {
            if ((key.includes("image") || key.includes("video")) && value === null) {
                return;
            }
            if (Array.isArray(value)) {
                formDataToSend.append(key, JSON.stringify(value));
            } else {
                formDataToSend.append(key, value ?? "");
            }
        });
        const response = await fetch(`http://127.0.0.1:8000/api/element/${id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: formDataToSend,
        })
            .then((response) => { console.log(formDataToSend); fetchElement(); });
    }

    useEffect(() => {
        fetchElement();
        fetchMyElements();
    }, [])

    useEffect(() => {
        console.log("form data");
        console.log(formData);
    }, [formData])

    useEffect(() => {
        // console.log("zapisany element");
        // console.log(element);
    }, [element])

    if (element === undefined || !formData || myElements === undefined) {
        return <>Loading...</>
    }

    return (
        <>
            <a href="/elements/my">Back</a>
            <br />
            Name: <input type="text" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            <br />
            {element.type == 'text' ?
                <>
                    Content:
                    <textarea
                        value={formData.content || ''}
                        onChange={(e) => handleChange('content', e.target.value)}
                    />
                </>
                : ""}
            {element.type == 'image' ?
                <>
                    Image:
                    <img id="uploaded-image" src={MEDIA_URL + element.data.image} />
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Description:
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                </>
                : ""}
            {element.type == 'video' ?
                <>
                    Video:
                    <video controls id="uploaded-video" src={MEDIA_URL + element.data.video} />
                    Change video:
                    <input type="file" accept="video/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Description:
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                </>
                : ""}
            {element.type == 'example' ?
                <>
                    Question:
                    <textarea
                        value={formData.question || ''}
                        onChange={(e) => handleChange('question', e.target.value)}
                    />
                    <br />
                    Image:
                    <img id="uploaded-image" src={MEDIA_URL + element.data.image} />
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Explanation:
                    <textarea
                        value={formData.explanation || ''}
                        onChange={(e) => handleChange('explanation', e.target.value)}
                    />
                    <br />
                    Explanation image:
                    <img id="uploaded-explanation-image" src={MEDIA_URL + element.data.explanation_image} />
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'explanation')} />
                    <br />
                </>
                : ""}
            {element.type == 'assignment' ?
                <>
                    Question:
                    <textarea
                        value={formData.question || ''}
                        onChange={(e) => handleChange('question', e.target.value)}
                    />
                    <br />
                    Image:
                    <img id="uploaded-image" src={MEDIA_URL + element.data.image} />
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    Is multiple choice?
                    <input
                        type="checkbox"
                        checked={formData.is_multiple_choice || ''}
                        onChange={() => handleChange('is_multiple_choice', !formData.is_multiple_choice)}
                    />
                    <br />
                    Hide answers?
                    <input
                        type="checkbox"
                        checked={formData.hide_answers || false}
                        onChange={() => handleChange('hide_answers', !formData.hide_answers)}
                    />
                    <br />
                    <h6>Answers:</h6>
                    {formData.answers.map((answer: string, index: number) => (
                        <li key={index}>
                            {answer}
                            <input
                                type="checkbox"
                                checked={formData.correct_answer_indices.includes(index)}
                                onChange={() => handleToggleAnswer(index)}
                            />
                            <button type="button" onClick={() => handleRemoveAnswer(index)}>Remove</button>
                        </li>
                    ))}
                    <input type="text" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
                    <br />
                    <button type="button" onClick={handleAddAnswer}>Add</button>
                    <br />
                    Explanation:
                    <textarea
                        value={formData.explanation || ''}
                        onChange={(e) => handleChange('explanation', e.target.value)}
                    />
                    <br />
                    Explanation image:
                    <img id="uploaded-explanation-image" src={MEDIA_URL + element.data.image} />
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'explanation')} />
                    <br />
                </>
                : ""}
            {element.type == 'exam' ?
                <>
                    Description:
                    <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                    Duration:
                    <input
                        type="number"
                        value={formData.duration || ''}
                        onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                    />
                    Total marks: {formData.total_marks || ''}
                    <br />
                    <div id="main-container">
                        <div className="main-half">
                            Search:
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {myElements
                                .filter((elem) => elem.type == 'assignment' && elem.name.includes(searchQuery))
                                .map((assignment, index) => (
                                    <div
                                        key={assignment.id}
                                        className={assignment.type + '-element any-element element-margin'}
                                        draggable
                                        onDragStart={(e) => exam_handleOnDrag(e, assignment)}
                                    >
                                        Name: {assignment.name}
                                        <br />
                                        Question: {assignment.data.question}
                                        <br />
                                        {assignment.data.image ?
                                            <>
                                                Image: <img src={MEDIA_URL + assignment.data.image} />
                                                <br />
                                            </>
                                            : ""}
                                        <br />
                                        {assignment.data.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                        <br />
                                        {assignment.data.hide_answers ? "Answers hidden" : "Answers visible"}
                                        <br />
                                        Answers:
                                        {assignment.data.answers.map((answer, i) => (
                                            <li key={i}>
                                                {answer} {assignment.data.correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                            </li>
                                        ))}
                                        Explanation: {assignment.data.explanation}
                                        <br />
                                        {assignment.data.explanation_image ?
                                            <>
                                                Explanation image: <img src={MEDIA_URL + assignment.data.explanation_image} />
                                                <br />
                                            </>
                                            : ""}



                                    </div>
                                ))}
                        </div>
                        <div className="main-half">
                            {(formData as DetailExamElement["data"]).questions //element.data.questions
                                .sort((a, b) => a.order - b.order)
                                .map((examQuestion, index) => (
                                    <div
                                        key={examQuestion.question.id}
                                        className={examQuestion.question.type + '-element any-element element-margin'}
                                    >
                                        Name: {examQuestion.question.name}
                                        <br />
                                        Marks:
                                        <input
                                            type="number"
                                            min={0}
                                            value={examQuestion.marks}
                                            onChange={(e) => handleModifyMarks(examQuestion.id, parseInt(e.target.value))}
                                        />
                                        <br />
                                        Question: {examQuestion.question.data.question}
                                        <br />
                                        {examQuestion.question.data.image ?
                                            <>
                                                Image: <img src={MEDIA_URL + examQuestion.question.data.image} />
                                                <br />
                                            </>
                                            : ""}
                                        <br />
                                        {examQuestion.question.data.is_multiple_choice ? "Multiple choice" : "Single choice"}
                                        <br />
                                        {examQuestion.question.data.hide_answers ? "Answers hidden" : "Answers visible"}
                                        <br />
                                        Answers:
                                        {examQuestion.question.data.answers.map((answer, i) => (
                                            <li key={i}>
                                                {answer} {examQuestion.question.data.correct_answer_indices.includes(i) ? "Correct✅" : "Wrong❌"}
                                            </li>
                                        ))}
                                        Explanation: {examQuestion.question.data.explanation}
                                        <br />
                                        {examQuestion.question.data.explanation_image ?
                                            <>
                                                Explanation image: <img src={MEDIA_URL + examQuestion.question.data.explanation_image} />
                                                <br />
                                            </>
                                            : ""}

                                        {examQuestion.order > 1 && (
                                            <>
                                                <button type="button" onClick={() => handleSwapOrder('exam_questions', examQuestion.order, examQuestion.order - 1)}>^</button>
                                                <br />
                                            </>
                                        )}

                                        {examQuestion.order < formData.questions.length && (
                                            <>
                                                <button type="button" onClick={() => handleSwapOrder('exam_questions', examQuestion.order, examQuestion.order + 1)}>v</button>
                                                <br />
                                            </>
                                        )}
                                        <a href={`/element/${examQuestion.question.id}/edit`}>Edit</a>
                                        <button type="button" onClick={() => handleRemoveAssignmentFromExam(examQuestion.id)}>Remove</button>
                                    </div>
                                ))}
                            <div
                                id="drop-here-field"
                                onDrop={(e) => exam_handleOnDrop(e)}
                                onDragOver={exam_handleDragOver}
                            >
                                Drop assignments here
                            </div>
                        </div>
                    </div>

                </>
                : ""}
            {element.type == 'module' ?
                <>
                    Title: <input type="text" value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
                    <br />
                    Description: <textarea value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} />
                    <br />
                    <div id="main-container">
                        <div className="main-half">
                            Search:
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {myElements
                                .filter((elem) => elem.name.includes(searchQuery))
                                .map((element, index) => (
                                    <div
                                        key={element.id}
                                        className={element.type + '-element any-element element-margin'}
                                        draggable
                                        onDragStart={(e) => module_handleOnDrag(e, element)}
                                    >
                                        Name: {element.name}
                                        <br />
                                    </div>
                                ))}
                        </div>
                        <div className="main-half">
                            {(formData as DetailModuleElement["data"]).elements
                                .sort((a, b) => a.order - b.order)
                                .map((element, index) => (
                                    <div
                                        key={element.element.id}
                                        className={element.element.type + '-element any-element element-margin'}
                                    >
                                        Name: {element.element.name}
                                        <br />
                                        {element.order > 1 && (
                                            <>
                                                <button type="button" onClick={() => handleSwapElementsOrder('module_elements', element.order, element.order - 1)}>^</button>
                                                <br />
                                            </>
                                        )}

                                        {element.order < formData.elements.length && (
                                            <>
                                                <button type="button" onClick={() => handleSwapElementsOrder('module_elements', element.order, element.order + 1)}>v</button>
                                                <br />
                                            </>
                                        )}
                                        <a href={`/element/${element.element.id}/edit`}>Edit</a>
                                        <button type="button" onClick={() => handleRemoveElementFromModule(element.order)}>Remove</button>
                                    </div>
                                ))}
                            <div
                                id="drop-here-field"
                                onDrop={(e) => module_handleOnDrop(e)}
                                onDragOver={module_handleDragOver}
                            >
                                Drop assignments here
                            </div>
                        </div>
                    </div>
                </>
                : ""}
            <button type="button" onClick={handleEditElement}>Save</button>

        </>
    )

}