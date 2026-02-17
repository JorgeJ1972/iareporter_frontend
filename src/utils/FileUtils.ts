import { FileData } from "../types/fileData";

export class FileUtils {
  static getIcon(type: string, name: string): string {
    let icon: string = "pi pi-file";
    switch (type) {
      case "image/jpeg":
      case "image/bmp":
      case "image/png":
      case "image/gif":
        icon = "pi pi-image";
        break;
      case "application/pdf":
        icon = "pi pi-file-pdf";
        break;
      case "video/avi":
      case "video/mp4":
        icon = "pi pi-video";
        break;
      case "application/x-zip-compressed":
        icon = "pi pi-tags";
        break;
      case "application/msword":
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        icon = "pi pi-file-word";
        break;
      case "text/xml":
      case "application/json":
      case "text/plain":
        icon = "pi pi-align-justify";
        break;
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        icon = "pi pi-file-excel";
        break;
      case "audio/wav":
      case "audio/mpeg":
        icon = "pi pi-volume-off";
        break;
      case "":
        let ext = FileUtils.getExtension(name);
        switch (ext) {
          case "7z":
          case "rar":
            icon = "pi pi-tags";
            break;
        }
        break;
    }
    return icon;
  }

  static getExtension(name: string): string {
    if (name.includes(".")) {
      let val = name.split(".").pop();
      if (val != undefined) {
        return val.toLowerCase();
      }
    }
    return "";
  }

  static getNameFile(name: string): string {
    let onlyName: string = "";
    if (name.includes(".")) {
      onlyName = name.split(".").slice(0, -1).join(".");
    } else {
      onlyName = name;
    }

    return onlyName;
  }

  static validateExtension(extension: string): boolean {
    let extensions: string[] = [
      "pdf",
      "txt",
      "jpg",
      "png",
      "pptx",
      "ppt",
      "docx",
      "doc",
      "html",
      "xlsx",
      "xls",
    ];
    let ext: string = extension.toLowerCase();
    return extensions.includes(ext);
  }

  static downloadFile(base64Data: string, fileName: string, fileType: string) {
    const blob = FileUtils.base64ToBlob(base64Data, fileType);
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }

  static base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: type });
  }

  static async blobToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);

      fileReader.onload = () => {
        if (fileReader.result != null) {
          resolve(fileReader.result.toString().split(",")[1]);
        } else {
          resolve("");
        }
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  static Utf8ToB64(str: string): string {
    return window.btoa(unescape(encodeURIComponent(str)));
  }

  static B64ToUtf8(str: string): string {
    return decodeURIComponent(escape(window.atob(str)));
  }

  static FileToFileData(file: File): FileData {
    const parts = file.name.split('.');
    const extension = parts.pop()?.toLocaleLowerCase();  
    const fileData: FileData = {
        extension:extension??"",
        name: parts.join('.'),
        base64File: ""
      }
      return fileData;
  }
}
