import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";

export default function NewElementPage() {
    const [elementType, setElementType] = useState<string>("text");
    const [name, setName] = useState<string>("");

    const [textElementContent, setTextElementContent] = useState<string>("");

    const handleCreateElement = async () => {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("type", elementType);
        if (elementType == "text") {
            formData.append("content", textElementContent);
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
            <br />
            <button type="button" onClick={handleCreateElement}>Save</button>
        </>
    )
}