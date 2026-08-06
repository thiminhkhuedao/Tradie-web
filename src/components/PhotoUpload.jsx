// src/components/PhotoUpload.jsx

import { useState, useEffect, useId } from "react";
import { toast } from "react-hot-toast";
import { T } from "../styles/tokens";
import { uploadImage } from "../lib/db";

export default function PhotoUpload({
  profileId, value, onChange, folder = "uploads",
  hintText = "Drop an image or tap to upload",
  uploadingText = "Uploading…",
  failedText = "Upload failed — please try again",
}) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);

  useEffect(() => { setPreview(value); }, [value]);

  async function handleFile(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const { data: url, error } = await uploadImage(profileId, file, folder);
    setUploading(false);
    if (error) {
      console.error("[PhotoUpload] upload failed:", error);
      toast.error(failedText);
      setPreview(value ?? null);
      return;
    }
    onChange(url);
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={e=>e.preventDefault()}
      onDrop={e=>{ e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      style={{
        display:"block",
        border:`2px dashed ${preview ? T.brand : T.borderMed}`,
        borderRadius:T.r.md, padding:preview?"0":"24px 16px",
        textAlign:"center", cursor:"pointer",
        background:preview?"transparent":T.surface2,
        overflow:"hidden",
      }}>
      {uploading ? (
        <div style={{ padding:24, fontSize:13, color:T.muted }}>{uploadingText}</div>
      ) : preview ? (
        <div style={{ position:"relative" }}>
          <img src={preview} alt="preview" style={{ width:"100%", maxHeight:180, objectFit:"cover", display:"block" }}/>
          <button type="button" onClick={e=>{ e.preventDefault(); setPreview(null); onChange(null); }}
            style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", color:"#fff",
              border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:15 }}>
            ×
          </button>
        </div>
      ) : (
        <div style={{ fontSize:13, color:T.muted }}>📎 {hintText}</div>
      )}
      <input id={inputId} type="file" accept="image/*" style={{ display:"none" }}
        onChange={e=>{ handleFile(e.target.files[0]); e.target.value = ""; }}/>
    </label>
  );
}
