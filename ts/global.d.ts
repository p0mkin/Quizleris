declare function renderMathInElement(element: Element, options?: unknown): void;

declare const Tesseract: {
    recognize: (
        image: string | File | Blob,
        lang: string,
        options?: { logger?: (m: unknown) => void }
    ) => Promise<{
        data: { text: string };
    }>;
};