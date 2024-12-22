import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";
import { MEDIA_URL } from '../constants';
import { useParams } from 'react-router-dom';

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

    const handleChangeWaight = (weight_id: number, new_value: number) => {
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
        fetchWeights();
    }, [])

    useEffect(() => {
        console.log(formData);
    }, [formData]);

    if (!formData || !formData.weights) {
        return (
            <>Loading...</>
        )
    }

    return (
        <>
            <h1>Assignment:</h1>
            {(formData as AssignmentElementStructure).question}
            <br />
            {(formData as AssignmentElementStructure).weights.map((weight, index) => (
                <li key={weight.id}>
                    {weight.topic.topic}
                    <input
                        type="range"
                        min={0.0}
                        max={1.0}
                        step={0.1}
                        value={weight.weight}
                        onChange={(e) => handleChangeWaight(weight.id, parseFloat(e.target.value))}
                    />
                    {weight.weight}
                    <br />
                </li>
            ))}
            <button type="button" onClick={handleSaveWeights}>Save</button>
        </>
    )



}