import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';
import { sendUserBackToLoginPageIfNotLoggedIn } from '../functions';
import "../styles/EditWeightsPage.css";
import ContentRenderer from '../components/ContentRenderer';

type Params = {
    course_id: string;
    assignment_id: string;
}

export default function EditWeightsPage() {

    const { course_id, assignment_id } = useParams<Params>();

    const [formData, setFormData] = useState<Record<string, any>>({});

    const fetchWeights = async () => {
        fetch(`http://127.0.0.1:8000/api/course/${course_id}/assignment/${assignment_id}/weights`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setFormData(data);
                console.log(data);
            });
    }

    const handleChangeWeight = (weight_id: number, new_value: number) => {
        setFormData((prev) => {
            if (!prev) return prev;
            const updatedWeights = formData.weights.map((weight: any) => {
                if (weight.id === weight_id) {
                    return {
                        ...weight,
                        weight: new_value,
                    };
                }
                return weight;
            });
            return {
                ...prev,
                weights: updatedWeights,
            };
        });
    }

    const handleSaveWeights = async () => {
        const bodyToSend = formData.weights;
        const response = await fetch(`http://127.0.0.1:8000/api/course/${course_id}/assignment/${assignment_id}/weights`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({ "weights": bodyToSend }),
        })
            .then(() => fetchWeights());
    }

    useEffect(() => {
        sendUserBackToLoginPageIfNotLoggedIn();
        fetchWeights();
    }, [])

    if (!formData || !formData.weights) {
        return (
            <>Loading...</>
        )
    }

    return (
        <div id="edit-weights-main-container">
            <a href={`/course/${course_id}/edit/topics`} target='_blank'>
                <button className="edit-weights-button">
                    Course topics
                </button>
            </a>
            <button className="edit-weights-button" type="button" onClick={fetchWeights}>Refresh</button>
            <button className="edit-weights-button" type="button" onClick={handleSaveWeights}>Save</button>
            <br />
            <div className="edit-weights-label-box">
                <span className="gray">
                    Assignment
                </span>
            </div>
            <ContentRenderer content={(formData as AssignmentElementStructure).question} />
            <br />
            {(formData as AssignmentElementStructure).weights.map((weight, index) => (
                <div className="edit-weights-row" key={weight.id}>
                    <div className="edit-weights-row-half text-align-right">{weight.topic.topic}</div>
                    <div className="edit-weights-row-half text-align-left">
                        <input
                            type="range"
                            min={0.0}
                            max={1.0}
                            step={0.1}
                            value={weight.weight}
                            onChange={(e) => handleChangeWeight(weight.id, parseFloat(e.target.value))}
                        />
                        {weight.weight}
                        <br />
                    </div>
                </div>
            ))}
        </div>
    )



}