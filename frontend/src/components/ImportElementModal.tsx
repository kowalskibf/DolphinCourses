import React, { useEffect, useState } from 'react';
import '../App.css';
import '../styles/ImportElementModal.css';

type ImportElementModalProps = {
    type: "m" | "e";
    course_id: number;
    module_id: number;
    element_id: number | null;
    onClose: () => void;
}

export default function ImportElementModal({ type, course_id, module_id, element_id, onClose }: ImportElementModalProps) {
    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={onClose}>
                        X
                    </button>
                    <h2>Importing {type == "m" ? "module" : "element"}</h2>
                    <p>Choose how would you like to import your {type == "m" ? "module" : "element"}</p>
                    <div className="modal-buttons">
                        {type == "m" ?
                            <>
                                <button className="btn-primary">Import whole structure</button>
                                <button className="btn-secondary">Create a copy of the module, but import elements inside</button>
                                <button className="btn-secondary">Create a copy of the module and a copy of all the elements inside</button>
                                <button className="btn-secondary">Import and copy only the module, without elements inside</button>
                            </>
                            :
                            <>
                                <button className="btn-primary">Import element</button>
                                <button className="btn-secondary">Create a copy of the element</button>
                            </>
                        }
                    </div>
                </div>
            </div>
        </>
    );
}