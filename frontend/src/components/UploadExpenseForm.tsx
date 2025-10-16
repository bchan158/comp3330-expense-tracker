import { useState } from "react";
import { useToast } from "./ToastContext";

interface UploadExpenseFormProps {
  expenseId: number;
  onSuccess?: () => void;
}

export function UploadExpenseForm({
  expenseId,
  onSuccess,
}: UploadExpenseFormProps) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setUploadProgress(0);
    }
  };

  const uploadToS3WithProgress = (url: string, file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      // Open and send request
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL from backend
      const signResponse = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ filename: file.name, type: file.type }),
      });

      if (!signResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, key } = await signResponse.json();

      // Step 2: Upload file to S3 with progress tracking
      await uploadToS3WithProgress(uploadUrl, file);

      // Step 3: Update expense with file key
      const updateResponse = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileKey: key }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update expense");
      }

      // Success! Clear form
      setFile(null);
      setError(null);
      setUploadProgress(0);

      // Reset file input
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Show success toast
      showToast("Receipt uploaded successfully!", "success");

      // Call success callback if provided
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setUploadProgress(0);
      // Show error toast
      showToast(errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-form-container">
      <h3 className="text-lg font-semibold mb-3">Upload Receipt</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label
            htmlFor="file-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Attach Receipt or Document
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            accept="image/*,.pdf"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {file && !isUploading && (
          <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
            <strong>Selected:</strong> {file.name} (
            {(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading...</span>
              <span className="font-semibold">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              >
                {/* Animated shimmer effect */}
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            {file && (
              <p className="text-xs text-gray-500 text-center">
                Uploading {file.name}...
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? `Uploading... ${uploadProgress}%` : "Upload File"}
        </button>
      </form>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
