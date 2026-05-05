import React from "react";
import {Json} from "@/modules/page";

interface PageRendererProps {
    content: Json;
}

export const PageRenderer: React.FC<PageRendererProps> = ({content}) => {
    if (!content) return null;

    // If content is a string (HTML from Tiptap)
    if (typeof content === "string") {
        return (
            <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary"
                dangerouslySetInnerHTML={{__html: content}}
            />
        );
    }

    // If content is an object (Tiptap JSON)
    // For now, we assume it's HTML string for simplicity as per current implementation patterns seen in TiptapEditor
    return (
        <div className="prose prose-lg max-w-none">
            {JSON.stringify(content)}
        </div>
    );
};
