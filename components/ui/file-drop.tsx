import * as React from "react"
import { cn } from "@/lib/utils"
import { FileUp } from "lucide-react"
import { useDropzone } from "react-dropzone"

import { Input } from "@/components/ui/input"

import { ScrollArea } from "./scroll-area"

export interface FileDropProps {
  className?: string
  onDrop: (files: File[]) => void
  onUpdateFilenames: (filenames: Record<string, string>) => void
}

const FileDrop = React.forwardRef<HTMLDivElement, FileDropProps>(
  ({ className, onDrop, onUpdateFilenames }, ref) => {
    const [files, setFiles] = React.useState<File[]>([])
    const [fileNames, setFileNames] = React.useState({})
    const doDrop = React.useCallback(
      acceptedFiles => {
        setFiles(acceptedFiles)
        onDrop(acceptedFiles ?? [])
      },
      [onDrop]
    )

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: doDrop,
      accept: { "text/*": [], "application/json": [] }
    })

    const updateFileName = file => event => {
      const updates = {
        ...fileNames,
        [file.name]: event.target.value
      }

      setFileNames(updates)

      onUpdateFilenames(updates)
    }

    return (
      <>
        {files.length > 0 && (
          <div className="mt-4">
            <ScrollArea className="h-[200px] px-2">
              <ul className="mt-2 space-y-2 px-2">
                {files.map(file => (
                  <li key={file.name}>
                    <Input
                      onChange={updateFileName(file)}
                      placeholder={file.name}
                      value={fileNames[file.name] ?? file.name}
                    />
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        {!files.length && (
          <div
            ref={ref}
            {...getRootProps()}
            className={cn(
              "text-muted-foreground hover:border-blue-10 hover:bg-muted hover:text-primary flex h-48 w-full cursor-pointer items-center justify-center rounded border-2 border-dashed text-center transition-colors duration-200",
              className
            )}
          >
            <input {...getInputProps()} />
            <div>
              <FileUp size={48} className="ml-auto mr-auto mb-2" />
              <div className="text-lg font-semibold">
                {isDragActive ? "Now drop." : "Drag file(s) here."}
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
)

FileDrop.displayName = "FileDrop"

export { FileDrop }
