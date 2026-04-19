import type { Metadata } from "next";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = {
  title: "Upload — TrickDB",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Clip</h1>
      <UploadForm />
    </div>
  );
}
