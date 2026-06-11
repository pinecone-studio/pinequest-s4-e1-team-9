"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"pdf" | "company">("pdf");
  
  // PDF Extractor State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Company State
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/companies`);
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error("Failed to fetch companies", err);
    }
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyLoading(true);
    setCompanyError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName, domain: companyDomain }),
      });

      if (!response.ok) {
        throw new Error("Failed to create company");
      }

      setCompanyName("");
      setCompanyDomain("");
      fetchCompanies();
    } catch (err: any) {
      setCompanyError(err.message || "An error occurred");
    } finally {
      setCompanyLoading(false);
    }
  };

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
            Admin Dashboard
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Manage your companies and documents.
          </p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("pdf")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === "pdf"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            PDF Extractor
          </button>
          <button
            onClick={() => {
              setActiveTab("company");
              fetchCompanies();
            }}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              activeTab === "company"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            Company Management
          </button>
        </div>

        {activeTab === "pdf" ? (
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
        ) : (
          <div className="space-y-6">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Company</h2>
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain (optional)</label>
                  <input
                    type="text"
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="acme.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={companyLoading}
                  className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400"
                >
                  {companyLoading ? "Creating..." : "Create Company"}
                </button>
              </form>
              {companyError && (
                <div className="mt-4 p-3 bg-red-50 rounded text-red-700 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {companyError}
                </div>
              )}
            </div>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Existing Companies</h2>
              <div className="divide-y divide-gray-100">
                {companies.length > 0 ? (
                  companies.map((c) => (
                    <div key={c.id} className="py-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900">{c.name}</h3>
                        <p className="text-sm text-gray-500">{c.domain || "No domain"}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        Added {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-gray-500 text-center">No companies created yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
