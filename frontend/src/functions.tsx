export const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval > 50) {
        return "Never";
    }
    if (interval >= 1) {
        return interval + " years ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + " months ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + " days ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + " hours ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
};

export function formatAmount(amount: number): string {
    if (isNaN(amount)) {
        throw new Error("Invalid input: amount must be a number.");
    }

    const zl = Math.floor(amount / 100);
    const gr = amount % 100;

    return `${zl.toLocaleString("pl-PL")},${gr.toString().padStart(2, "0")}`;
}

export function priceToInt(value: string | number): number {
    if (typeof value === 'number') {
        return value * 100;
    }
    value = value.replace(',', '.');
    return Math.round(parseFloat(value) * 100);
}

export function intToPrice(value: number): string {
    const zl = Math.floor(value / 100);
    const gr = value % 100;
    return `${zl},${gr.toString().padStart(2, '0')}`;
}
export function formatDateToBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export const formatDateTimeLocal = (date: Date): string => {
    const isoString = date.toISOString();
    return isoString.substring(0, 16);
};

import parse, { domToReact, DOMNode } from 'html-react-parser';
import { InlineMath, BlockMath } from 'react-katex';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Stylizowanie Quill

export const sanitizeContent = (htmlString: string) => {
    return DOMPurify.sanitize(htmlString, {
        ALLOWED_TAGS: ['b', 'i', 'u', 'h1', 'h2', 'p', 'br', 'span'],
        ALLOWED_ATTR: ['style', 'class'],
    });
};

const latexRegex = /\\\((.+?)\\\)|\\\[(.+?)\\\]/g;

export const renderContent = (htmlString: string): JSX.Element => {
    const renderNode = (domNode: any, index: number): JSX.Element | null => {
        if (domNode.type === 'text' && domNode.data) {
            const matches = [...domNode.data.matchAll(latexRegex)];

            if (matches.length > 0) {
                let lastIndex = 0;
                const parts = [];
                matches.forEach((match, i) => {
                    if (match.index > lastIndex) {
                        parts.push(domNode.data.slice(lastIndex, match.index));
                    }
                    if (match[1]) {
                        parts.push(<span className="latex" key={i}><InlineMath>{match[1]}</InlineMath></span>);
                    }
                    if (match[2]) {
                        parts.push(<span className="latex" key={i}><BlockMath>{match[2]}</BlockMath></span>);
                    }
                    lastIndex = match.index + match[0].length;
                });
                if (lastIndex < domNode.data.length) {
                    parts.push(domNode.data.slice(lastIndex));
                }
                return <>{parts}</>;
            }
            return <>{domNode.data}</>;
        }
        if (domNode.type === 'tag' && domNode.children) {
            const children = domNode.children.map((child: any, i: number) => renderNode(child, i));
            switch (domNode.name) {
                case 'p':
                    return <p key={index}>{children}</p>;
                case 'h1':
                    return <h1 key={index}>{children}</h1>;
                case 'h2':
                    return <h2 key={index}>{children}</h2>;
                case 'strong':
                    return <b><strong style={{ fontWeight: 'bold' }} key={index}>{children}</strong></b>;
                case 'b':
                    return <b key={index}>{children}</b>;
                case 'em':
                    return <em key={index}>{children}</em>;
                case 'u':
                    return <u key={index}>{children}</u>;
                case 'ul':
                    return <ul key={index}>{children}</ul>;
                case 'li':
                    return <li key={index}>{children}</li>;
                default:
                    return <div key={index}>{children}</div>;
            }
        }
        return null;
    };
    const domNodes = parse(htmlString, {
        replace: (domNode, index) => renderNode(domNode, index),
    });
    return <>{domNodes}</>;
};