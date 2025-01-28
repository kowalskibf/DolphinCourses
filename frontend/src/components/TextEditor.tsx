import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { renderContent } from '../functions';

const TextEditor = ({ value, onChange }: { value: string, onChange: (value: string) => void }) => {
    const modules = {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline'],
            ['link'],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['image'],
            [{ 'color': [] }, { 'background': [] }],
        ],
    };

    return (
        <div>
            <ReactQuill
                value={value}
                onChange={onChange}
                modules={modules}
            />
            <div>
                <br />
                <div>{renderContent(value)}</div>
            </div>
        </div>
    );
};

export default TextEditor;
