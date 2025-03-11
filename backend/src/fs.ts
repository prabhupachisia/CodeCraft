import fs from "fs";
import path from "path";

interface File {
  type: "file" | "dir";
  name: string;
  path: string;
}

export const fetchDir = (dir: string, baseDir: string): Promise<File[]> => {
  return new Promise((resolve, reject) => {
    // Check if directory exists, create it if missing
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        return reject(
          new Error(`Failed to create directory: ${dir}, Error: ${err.message}`)
        );
      }

      // Now read the directory
      fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
          return reject(
            new Error(`Failed to read directory: ${dir}, Error: ${err.message}`)
          );
        }
        resolve(
          files.map((file) => ({
            type: file.isDirectory() ? "dir" : "file",
            name: file.name,
            path: path.join(baseDir, file.name),
          }))
        );
      });
    });
  });
};

export const fetchFileContent = (file: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err, data) => {
      if (err) {
        return reject(
          new Error(`Failed to read file: ${file}, Error: ${err.message}`)
        );
      }
      resolve(data);
    });
  });
};

export const saveFile = (file: string, content: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, content, "utf8", (err) => {
      if (err) {
        return reject(
          new Error(`Failed to write file: ${file}, Error: ${err.message}`)
        );
      }
      resolve();
    });
  });
};
