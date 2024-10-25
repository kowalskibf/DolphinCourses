import React, { useEffect, useState } from 'react';
import '../App.css';
import "../types";

export default function MyElementsPage() {
    const [elements, setElements] = useState<CourseElement[]>([]);

    const fetchElements = async () => {
        fetch("http://127.0.0.1:8000/api/elements/my", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${localStorage.getItem("token")}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setElements(data));
    };

    useEffect(() => {
        fetchElements();
    }, []);

    if (!elements) {
        return (
            <>
                Loading...
            </>
        )
    }

    if (elements.length === 0) {
        return (
            <>
                You have no elements. <a href="/element/new">Create a new element!</a>
            </>
        )
    }

    return (
        <>
            {elements.map((element) => (
                <div key={element.id}>
                    id: {element.id} <br />
                    name: {element.name} <br />
                    type: {element.type} <br />
                    {element.type == "text" ?
                        <>
                            content: {element.data.content} <br />
                        </>
                        : ""}
                </div>
            ))}
        </>
    )

}