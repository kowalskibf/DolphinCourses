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

    const handleChange = (key: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
        console.log(formData)
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
        const updatedAnswers = formData.answers.filter((_: string, i: number) => i !== index);
        const updatedCorrectAnswers = formData.correct_answer_indices.filter((i: number) => i !== index)
            .map((i: number) => (i > index ? i - 1 : i));

        handleChange('answers', updatedAnswers);
        handleChange('correct_answer_indices', updatedCorrectAnswers);
    };

    const handleToggleAnswer = (index: number) => {
        const isCorrect = formData.correct_answer_indices.includes(index);
        const updatedCorrectAnswers = isCorrect
            ? formData.correct_answer_indices.filter((i: number) => i !== index)
            : [...formData.correct_answer_indices, index];

        handleChange('correct_answer_indices', updatedCorrectAnswers);
    };

    useEffect(() => {
        fetchElement();
    }, [])

    useEffect(() => {
        console.log(formData);
    }, [formData])

    if (element === undefined || !formData) {
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
                        onChange={(e) => handleChange('image', e.target.value)}
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
                        onChange={(e) => handleChange('video', e.target.value)}
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
                    <img id="uploaded-explanation-image" src={MEDIA_URL + element.data.image} />
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
                </>
                : ""}
            {element.type == 'module' ?
                <>
                    module
                </>
                : ""}

        </>
    )

}