import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, Trash2, UploadIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { FileType } from "../api/assistants/[assistantId]/files/route";



type FileViewerProps = {
  assistantId: string,
  threadId: string,

}
const FileViewer = ({ assistantId, threadId }: FileViewerProps) => {

  const [files, setFiles] = useState<FileType[]>([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const resp = await fetch(`/api/assistants/${assistantId}/files`, {
      method: "GET",
    });
    const data = await resp.json();
    setFiles(data);
  };

  const handleFileDelete = async (fileId) => {
    await fetch(`/api/assistants/${assistantId}/files`, {
      method: "DELETE",
      body: JSON.stringify({ fileId }),
    });
  };

  const handleFileUpload = async (event) => {
    console.log('handleFileUpload from file-viewer');
    const data = new FormData();
    if (event.target.files.length < 0) return;
    data.append("file", event.target.files[0]);
    await fetch(`/api/assistants/${assistantId}/files`, {
      method: "POST",
      body: data,
    });
  };

  return (
    <div className="flex flex-col  bg-background">
      <header className="bg-card border-b border-muted px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground">File List</h2>
      </header>
      <div className="flex-1 overflow-auto p-6">
        <ScrollArea className="h-full">
          {files.map((file, index) => (
            <div
              key={file.file_id}
              className="flex items-start justify-between py-3 px-2 border-b last:border-b-0 hover:bg-muted/50 rounded-md"
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-sm">{file.filename}</span>
                <span className={`text-xs text-muted-foreground`}>
                  {file.status}
                </span>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleFileDelete(file.filename)}
                  aria-label={`Delete ${file.filename}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
      <div className="bg-card border-t border-muted px-6 py-4">
        <label htmlFor="file-upload-file-viewer" className="sr-only">Upload File</label>
        <input
          type="file"
          id="file-upload-file-viewer"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button variant="outline" onClick={() => document.getElementById('file-upload-file-viewer').click()} className="w-full">
          <UploadIcon className="h-4 w-4 mr-2" />
          Upload files
        </Button>
      </div>
    </div>
  );
};

export default FileViewer;
