"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a valid PDF file.");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pdf/extract`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to extract text from PDF");
      }

      const data = await response.json();
      setResult(data.text);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            PDF Text Extractor
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your PDF and get the text content instantly.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={cn(
                "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 text-center",
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={onFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <Upload className={cn("h-12 w-12 mb-4 transition-colors", isDragging ? "text-blue-500" : "text-gray-400")} />
                <p className="text-lg font-medium text-gray-700">
                  {file ? file.name : "Drag and drop your PDF here"}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  or click to browse from your computer
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className={cn(
                  "flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white transition-all shadow-md",
                  !file || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Extracting...
                  </>
                ) : (
                  "Extract Text"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="mt-8">
                <div className="flex items-center mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Extracted Content</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                    {result}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
