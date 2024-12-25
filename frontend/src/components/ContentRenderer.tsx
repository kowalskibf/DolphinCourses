import React from 'react';
import { renderContent, sanitizeContent } from '../functions';

interface ContentRendererProps {
    content: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content }) => {
    return <>{renderContent(sanitizeContent(content))}</>;
};

export default ContentRenderer;
