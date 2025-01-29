import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import TextEditor from '../components/TextEditor';
import { BlockMath, InlineMath } from 'react-katex';
import ContentRenderer from '../components/ContentRenderer';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';
import "../styles/EditElementPage.css";

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
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchElement();
        fetchMyElements();
    }, [])

    if (element === undefined || !formData || myElements === undefined) {
        return <>Loading...</>
    }

    return (
        <div id="edit-element-main-container">
            <a href="/elements/my">
                <button className="edit-element-button">
                    Back to my elements
                </button>
            </a>
            <button className="edit-element-button" type="button" onClick={handleEditElement}>Save</button>
            <br />
            <div className="edit-element-label-box">
                Element name:&nbsp;
                <input className="edit-element-input-text" placeholder="Element name" type="text" value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
            </div>
            <br />
            {element.type == 'text' ?
                <>
                    <div className="edit-element-label-box">
                        Content:&nbsp;
                    </div>
                    <TextEditor value={formData.content || ''} onChange={(value: string) => handleChange('content', value)} />
                </>
                : ""}
            {element.type == 'image' ?
                <>
                    <div className="edit-element-label-box">
                        Image:&nbsp;
                    </div>
                    <img id="uploaded-image" className="edit-element-img" src={MEDIA_URL + element.data.image} />
                    <br />
                    Change image:&nbsp;
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.description || ''}
                        onChange={(value) => handleChange('description', value)}
                    />
                </>
                : ""}
            {element.type == 'video' ?
                <>
                    <div className="edit-element-label-box">
                        Video:&nbsp;
                    </div>
                    <video className="edit-element-img" controls id="uploaded-video" src={MEDIA_URL + element.data.video} />
                    <br />
                    Change video:&nbsp;
                    <input type="file" accept="video/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.description || ''}
                        onChange={(value) => handleChange('description', value)}
                    />
                </>
                : ""}
            {element.type == 'example' ?
                <>
                    <div className="edit-element-label-box">
                        Question:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.question || ''}
                        onChange={(value) => handleChange('question', value)}
                    />
                    <br />
                    {element.data.image ? (
                        <div className="edit-element-label-box">
                            Image:&nbsp;<br />
                            <img className="edit-element-img" id="uploaded-image" src={MEDIA_URL + element.data.image} />
                        </div>
                    ) : (
                        <div className="edit-element-label-box">
                            Image not set.&nbsp;
                        </div>
                    )}
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Explanation:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.explanation || ''}
                        onChange={(value) => handleChange('explanation', value)}
                    />
                    <br />
                    {element.data.explanation_image ? (
                        <div className="edit-element-label-box">
                            Explanation image:&nbsp;<br />
                            <img className="edit-element-img" id="uploaded-explanation-image" src={MEDIA_URL + element.data.explanation_image} />
                        </div>
                    ) : (
                        <div className="edit-element-label-box">
                            Explanation image not set.&nbsp;
                        </div>
                    )}
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'explanation')} />
                    <br />
                </>
                : ""}
            {element.type == 'assignment' ?
                <>
                    <div className="edit-element-label-box">
                        Question:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.question || ''}
                        onChange={(value) => handleChange('question', value)}
                    />
                    <br />
                    {element.data.image ? (
                        <div className="edit-element-label-box">
                            Image:&nbsp;<br />
                            <img className="edit-element-img" id="uploaded-image" src={MEDIA_URL + element.data.image} />
                        </div>
                    ) : (
                        <div className="edit-element-label-box">
                            Image not set.&nbsp;
                        </div>
                    )}
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e)} />
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Multiple choice&nbsp;
                        <input
                            type="checkbox"
                            className="edit-element-checkbox"
                            checked={formData.is_multiple_choice || ''}
                            onChange={() => handleChange('is_multiple_choice', !formData.is_multiple_choice)}
                        />
                    </div>
                    <div className="edit-element-label-box">
                        Hide answers&nbsp;
                        <input
                            type="checkbox"
                            className="edit-element-checkbox"
                            checked={formData.hide_answers || false}
                            onChange={() => handleChange('hide_answers', !formData.hide_answers)}
                        />
                    </div>
                    <br />
                    <div className="edit-element-label-box">
                        Answers
                    </div>
                    <div className="edit-element-answer-container">
                        {formData.answers.map((answer: string, index: number) => (
                            <div className={`edit-element-answer ${formData.correct_answer_indices.includes(index) ? "edit-element-answer-correct" : "edit-element-answer-wrong"}`} key={index}>
                                <ContentRenderer content={answer} />
                                <br />
                                Correct&nbsp;
                                <input
                                    type="checkbox"
                                    checked={formData.correct_answer_indices.includes(index)}
                                    onChange={() => handleToggleAnswer(index)}
                                />
                                <br />
                                <button className="edit-element-button edit-element-button-small edit-element-button-red" type="button" onClick={() => handleRemoveAnswer(index)}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <br />
                    <div className="edit-element-label-box">
                        Add new answer:&nbsp;
                    </div>
                    <TextEditor value={newAnswer} onChange={(value) => setNewAnswer(value)} />
                    <button className="edit-element-button edit-element-button-small" type="button" onClick={handleAddAnswer}>Add answer</button>
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Explanation:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.explanation || ''}
                        onChange={(value) => handleChange('explanation', value)}
                    />
                    <br />
                    {element.data.explanation_image ? (
                        <div className="edit-element-label-box">
                            Explanation image:&nbsp;<br />
                            <img className="edit-element-img" id="uploaded-explanation-image" src={MEDIA_URL + element.data.explanation_image} />
                        </div>
                    ) : (
                        <div className="edit-element-label-box">
                            Explanation image not set.&nbsp;
                        </div>
                    )}
                    Change image:
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'explanation')} />
                    <br />
                </>
                : ""}
            {element.type == 'exam' ?
                <>
                    <div className="edit-element-label-box">
                        Description:&nbsp;
                    </div>
                    <TextEditor
                        value={formData.description || ''}
                        onChange={(value) => handleChange('description', value)}
                    />
                    <br />
                    <br />
                    <div className="edit-element-label-box">
                        Duration:&nbsp;
                        <input
                            type="number"
                            min={1}
                            className="edit-element-input-number"
                            value={formData.duration || ''}
                            onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                        />
                        &nbsp;minutes
                    </div>
                    <div className="edit-element-label-box">
                        Total marks: {formData.total_marks || ''}
                    </div>
                    <br />
                    <div className="edit-element-bottom-main-container">
                        <div className="edit-element-bottom-left">
                            <div className="edit-element-search-container">
                                Search:&nbsp;
                                <input
                                    type="text"
                                    className="edit-element-search-input"
                                    placeholder="Assignment name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="edit-element-button edit-element-button-wide" type="button" onClick={fetchMyElements}>Refresh</button>
                            {myElements
                                .filter((elem) => elem.type == 'assignment' && elem.name.includes(searchQuery))
                                .map((assignment, index) => (
                                    <div
                                        key={assignment.id}
                                        className={assignment.type + '-element any-element element-margin my-elements-element-margin'}
                                        draggable
                                        onDragStart={(e) => exam_handleOnDrag(e, assignment)}
                                    >
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            {assignment.name}
                                        </div>
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            <span className="gray">Question</span>
                                            <ContentRenderer content={assignment.data.question} />
                                            <br />
                                            {assignment.data.image ?
                                                <>
                                                    <img className="img-max-size" src={MEDIA_URL + assignment.data.image} />
                                                    <br />
                                                    <br />
                                                </>
                                                : ""}
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
                                                    <img className="img-max-size" src={MEDIA_URL + assignment.data.explanation_image} />
                                                    <br />
                                                    <br />
                                                </>
                                                : ""}
                                        </div>

                                        <a href={`/element/${assignment.id}/edit`} target='_blank'>
                                            <button type="button" className="edit-course-button edit-course-button-border-assignment-element">
                                                Edit
                                            </button>
                                        </a>
                                        <button className="edit-course-button edit-course-button-border-assignment-element" onClick={() => handleAddAssignmentToExam(assignment)}>Attach</button>



                                    </div>
                                ))}
                        </div>
                        <div className="edit-element-bottom-right">
                            {(formData as DetailExamElement["data"]).questions //element.data.questions
                                .sort((a, b) => a.order - b.order)
                                .map((examQuestion, index) => (
                                    <div
                                        key={examQuestion.question.id}
                                        className={examQuestion.question.type + '-element any-element element-margin my-elements-element-margin'}
                                    >
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            {examQuestion.question.name}
                                        </div>
                                        <div className="assignment-element-border-bottom width-100 margin-bottom-10px">
                                            Marks:
                                            <input
                                                type="number"
                                                className="edit-element-input-number edit-element-input-number-small"
                                                min={1}
                                                value={examQuestion.marks}
                                                onChange={(e) => handleModifyMarks(examQuestion.id, parseInt(e.target.value))}
                                            />
                                            <br />
                                            <span className="gray">Question</span>
                                            <ContentRenderer content={examQuestion.question.data.question} />
                                            <br />
                                            {examQuestion.question.data.image ?
                                                <>
                                                    <img className="img-max-size" src={MEDIA_URL + examQuestion.question.data.image} />
                                                    <br />
                                                </>
                                                : ""}
                                            <br />
                                            <span className="gray">{examQuestion.question.data.is_multiple_choice ? "Multiple choice" : "Single choice"}</span>
                                            <br />
                                            <span className="gray">{examQuestion.question.data.hide_answers ? "Answers hidden" : "Answers visible"}</span>
                                            <br />
                                            <br />
                                            <span className="gray">Answers</span>
                                            <br />
                                            <br />
                                            <div className="edit-element-answer-container">
                                                {examQuestion.question.data.answers.map((answer, i) => (
                                                    <div className={`edit-element-answer ${examQuestion.question.data.correct_answer_indices.includes(i) ? "edit-element-answer-correct" : "edit-element-answer-wrong"}`} key={i}>
                                                        <ContentRenderer content={answer} />
                                                    </div>
                                                ))}
                                            </div>
                                            <br />
                                            <span className="gray">Explanation</span>
                                            <ContentRenderer content={examQuestion.question.data.explanation} />
                                            <br />
                                            {examQuestion.question.data.explanation_image ?
                                                <>
                                                    <img className="img-max-size" src={MEDIA_URL + examQuestion.question.data.explanation_image} />
                                                    <br />
                                                </>
                                                : ""}
                                        </div>
                                        <a href={`/element/${examQuestion.question.id}/edit`} target='_blank'>
                                            <button className="edit-course-button edit-course-button-border-assignment-element" type="button">
                                                Edit
                                            </button>
                                        </a>
                                        {examQuestion.order > 1 && (
                                            <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleSwapOrder('exam_questions', examQuestion.order, examQuestion.order - 1)}>Move up</button>

                                        )}

                                        {examQuestion.order < formData.questions.length && (
                                            <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleSwapOrder('exam_questions', examQuestion.order, examQuestion.order + 1)}>Move down</button>

                                        )}
                                        <button className="edit-course-button edit-course-button-border-assignment-element" type="button" onClick={() => handleRemoveAssignmentFromExam(examQuestion.id)}>Detach</button>
                                    </div>
                                ))}
                            {/* <div
                                id="drop-here-field"
                                onDrop={(e) => exam_handleOnDrop(e)}
                                onDragOver={exam_handleDragOver}
                            >
                                Drop assignments here
                            </div> */}
                        </div>
                    </div>

                </>
                : ""}
            {element.type == 'module' ?
                <>
                    <div className="edit-element-label-box">
                        Title:&nbsp;<input className="edit-element-input-text" placeholder="Module title" type="text" value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} />
                    </div>
                    <div className="edit-element-label-box">
                        Description:&nbsp;<TextEditor value={formData.description || ''} onChange={(value) => handleChange('description', value)} />
                    </div>
                    <br />
                    <div className="edit-element-bottom-main-container">
                        <div className="edit-element-bottom-left">
                            <div className="edit-element-search-container">
                                Search:&nbsp;
                                <input
                                    type="text"
                                    className="edit-element-search-input"
                                    placeholder="Element name"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="edit-element-button edit-element-button-wide" type="button" onClick={fetchMyElements}>Refresh</button>
                            {myElements
                                .filter((elem) => elem.name.includes(searchQuery))
                                .map((element, index) => (
                                    <div
                                        key={element.id}
                                        className={element.type + '-element any-element element-margin my-elements-element-margin'}
                                        draggable
                                        onDragStart={(e) => module_handleOnDrag(e, element)}
                                    >
                                        {element.name}
                                        <br />
                                        <a href={`/element/${element.id}/edit`} target='_blank'>
                                            <button type="button" className={`edit-course-button edit-course-button-border-${element.type}-element`}>
                                                Edit
                                            </button>
                                        </a>
                                        <button className={`edit-course-button edit-course-button-border-${element.type}-element`} onClick={() => handleAddElementToModule(element)}>Attach</button>

                                    </div>
                                ))}
                        </div>
                        <div className="edit-element-bottom-right">
                            {(formData as DetailModuleElement["data"]).elements
                                .sort((a, b) => a.order - b.order)
                                .map((element, index) => (
                                    <div
                                        key={element.element.id}
                                        className={element.element.type + '-element any-element element-margin my-elements-element-margin'}
                                    >
                                        {element.element.name}
                                        <br />
                                        <a href={`/element/${element.element.id}/edit`} target='_blank'>
                                            <button className={`edit-course-button edit-course-button-border-${element.element.type}-element`}>
                                                Edit
                                            </button>
                                        </a>
                                        {element.order > 1 && (
                                            <button className={`edit-course-button edit-course-button-border-${element.element.type}-element`} type="button" onClick={() => handleSwapElementsOrder('module_elements', element.order, element.order - 1)}>Move up</button>
                                        )}

                                        {element.order < formData.elements.length && (
                                            <button className={`edit-course-button edit-course-button-border-${element.element.type}-element`} type="button" onClick={() => handleSwapElementsOrder('module_elements', element.order, element.order + 1)}>Move down</button>
                                        )}
                                        <button className={`edit-course-button edit-course-button-border-${element.element.type}-element`} type="button" onClick={() => handleRemoveElementFromModule(element.order)}>Remove</button>
                                    </div>
                                ))}
                            {/* <div
                                id="drop-here-field"
                                onDrop={(e) => module_handleOnDrop(e)}
                                onDragOver={module_handleDragOver}
                            >
                                Drop assignments here
                            </div> */}
                        </div>
                    </div>
                </>
                : ""}

        </div>
    )

}