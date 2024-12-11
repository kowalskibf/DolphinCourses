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
                console.log("pobrane data z api");
                console.log(data);
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
        //console.log(formData);
    }, [formData])

    useEffect(() => {
        console.log("zapisany element");
        console.log(element);
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
                            {myElements.filter((elem) => elem.type == 'assignment').map((assignment, index) => (
                                <div
                                    key={assignment.id}
                                    className={assignment.type + '-element any-element element-margin'}
                                >
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
                            {element.data.questions
                                .sort((a, b) => a.order - b.order)
                                .map((examQuestion, index) => (
                                    <div
                                        key={examQuestion.question.id}
                                        className={examQuestion.question.type + '-element any-element element-margin'}
                                    >
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


                                    </div>
                                ))}
                        </div>
                    </div>

                </>
                : ""}
            {element.type == 'module' ?
                <>
                    module
                </>
                : ""}
            <button type="button" onClick={handleEditElement}>Save</button>

        </>
    )

}