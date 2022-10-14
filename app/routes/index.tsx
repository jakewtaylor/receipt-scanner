import React, { useState } from "react";

export default function Index() {
  const [working, setWorking] = useState(false);
  const [base64, setBase64] = useState("");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setWorking(true);

    const converted = await convertBase64(file);

    setWorking(false);
    setBase64(converted);
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />

      {working ? (
        <p>Working...</p>
      ) : base64 ? (
        <img src={base64} alt="Uploaded pic" />
      ) : null}

      <form method="post" action="/detect">
        <input type="hidden" name="image" value={base64} />
        <button type="submit" disabled={working}>
          Upload
        </button>
      </form>
    </div>
  );
}

const convertBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
      const val = fileReader.result;

      if (typeof val === "string") {
        resolve(val);
      } else {
        reject(new Error("Didnt get a string"));
      }
    };

    fileReader.onerror = (error) => {
      reject(error);
    };
  });
