// src/components/FolderImages.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash, FaEdit, FaUpload, FaTimes } from "react-icons/fa";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const API_URL = "https://kooyapady-admin-backend-rtb2.onrender.com/api";

function SortableImage({ img, onEditLabel, onRename, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: img.public_id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative border rounded p-2">
      <img src={img.url} alt={img.label ?? ""} className="w-full h-40 object-cover rounded" />
      <div className="mt-2">
        <div className="text-sm text-gray-700 truncate">{img.label ? img.label : <span className="text-gray-400 italic">No label</span>}</div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-3">
          <button title="Edit label" className="text-blue-600" onClick={() => onEditLabel(img.public_id, img.label)}>
            <FaEdit />
          </button>

          <button title="Rename public id" className="text-yellow-600" onClick={() => onRename(img.public_id)}>
            R
          </button>
        </div>

        <button title="Delete" className="text-red-600" onClick={() => onDelete(img.public_id)}>
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

export default function FolderImages({ folderId, token }) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // selected files for upload
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (folderId) fetchImages();
    // cleanup previews on unmount
    return () => {
      selectedFiles.forEach((s) => {
        try {
          URL.revokeObjectURL(s.preview);
        } catch {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/upload/${folderId}`, { headers: { Authorization: `Bearer ${token}` } });
      setImages(res.data.images || []);
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error("fetchImages error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Upload UI handlers
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newSelected = files.map((file) => {
      const isVideo = file.type && file.type.startsWith("video");
      const isImage = file.type && file.type.startsWith("image");
      const type = isVideo ? "video" : isImage ? "image" : "other";
      return {
        file,
        preview: URL.createObjectURL(file),
        label: "",
        title: "",
        type,
      };
    });
    setSelectedFiles((prev) => [...prev, ...newSelected]);
    e.target.value = null;
  };

  const removeSelected = (index) => {
    URL.revokeObjectURL(selectedFiles[index].preview);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSelectedLabel = (index, label) =>
    setSelectedFiles((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], label };
      return arr;
    });

  const updateSelectedTitle = (index, title) =>
    setSelectedFiles((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], title };
      return arr;
    });

  const uploadSelected = async () => {
    if (!folderId || selectedFiles.length === 0) return;
    const fd = new FormData();
    selectedFiles.forEach((s) => fd.append("file", s.file));

    const imageLabels = selectedFiles.filter((s) => s.type === "image").map((s) => s.label ?? "");
    const videoTitles = selectedFiles.filter((s) => s.type === "video").map((s) => s.title ?? "");

    imageLabels.forEach((lbl) => fd.append("labels[]", lbl));
    videoTitles.forEach((t) => fd.append("videoTitles[]", t));

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/upload/${folderId}`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const uploaded = res.data.uploaded || {};
      const uploadedImages = uploaded.images || [];
      const uploadedVideos = uploaded.videos || [];

      // prepend uploaded so newest appear first
      setImages((prev) => [...uploadedImages, ...prev]);
      setVideos((prev) => [...uploadedVideos, ...prev]);

      selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
      setSelectedFiles([]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  // actions for existing media
  const deleteImage = async (publicId) => {
    if (!window.confirm("Delete this media?")) return;
    try {
      await axios.delete(`${API_URL}/upload/${folderId}/${encodeURIComponent(publicId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setImages((prev) => prev.filter((img) => img.public_id !== publicId));
      setVideos((prev) => prev.filter((v) => v.public_id !== publicId));
    } catch (err) {
      console.error("deleteImage error:", err);
    }
  };

  const renameImage = async (publicId) => {
    const newName = prompt("Enter new name for media:");
    if (!newName) return;
    try {
      const res = await axios.put(`${API_URL}/upload/${folderId}/${encodeURIComponent(publicId)}`, { newName }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.image) setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
      else if (res.data.video) setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
    } catch (err) {
      console.error("renameImage error:", err);
    }
  };

  const editLabel = async (publicId, currentLabel) => {
    const newLabel = prompt("Enter label for this image (leave empty to clear):", currentLabel ?? "");
    if (newLabel === null) return;
    try {
      const res = await axios.put(`${API_URL}/upload/${folderId}/${encodeURIComponent(publicId)}`, { newLabel }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.image) setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
      else if (res.data.video) setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
    } catch (err) {
      console.error("editLabel error:", err);
    }
  };

  const editTitle = async (publicId, currentTitle) => {
    const newTitle = prompt("Enter title for this video (leave empty to clear):", currentTitle ?? "");
    if (newTitle === null) return;
    try {
      const res = await axios.put(`${API_URL}/upload/${folderId}/${encodeURIComponent(publicId)}`, { newTitle }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.video) setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
      else if (res.data.image) setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
    } catch (err) {
      console.error("editTitle error:", err);
    }
  };

  // ---------------- DnD for images ----------------
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onImagesDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((i) => i.public_id === active.id);
    const newIndex = images.findIndex((i) => i.public_id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newImages = arrayMove(images, oldIndex, newIndex);
    setImages(newImages); // optimistic

    const imagesOrder = newImages.map((i) => i.public_id);

    // <-- dynamic endpoint with folderId (exactly as you requested) -->
    try {
      const res = await axios.patch(`${API_URL}/upload/${folderId}/reorder`, { imagesOrder }, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (res.status >= 200 && res.status < 300) {
        // sync if server returned canonical list
        if (res.data.images && Array.isArray(res.data.images)) setImages(res.data.images);
      } else {
        console.error("Reorder images failed:", res.data);
        await fetchImages();
      }
    } catch (err) {
      console.error("Reorder images error:", err);
      await fetchImages();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Media in Folder</h2>

      {/* Upload area */}
      <div className="mb-4 border rounded p-3">
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="file" multiple onChange={handleFilesChange} className="hidden" />
            <button className="btn-primary inline-flex items-center gap-2"><FaUpload /> Select files</button>
          </label>

          <button className="btn-secondary" onClick={uploadSelected} disabled={selectedFiles.length === 0 || loading} title="Upload selected files with labels/titles">
            Upload ({selectedFiles.length})
          </button>
        </div>

        {/* Preview selected files */}
        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedFiles.map((s, idx) => (
              <div key={idx} className="relative border rounded p-2">
                {s.type === "image" ? (
                  <img src={s.preview} alt="" className="w-full h-32 object-cover rounded" />
                ) : s.type === "video" ? (
                  <video src={s.preview} className="w-full h-32 object-cover rounded" controls />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded">Unsupported</div>
                )}

                {s.type === "image" ? (
                  <input type="text" value={s.label} onChange={(e) => updateSelectedLabel(idx, e.target.value)} placeholder="Optional label" className="mt-2 w-full px-2 py-1 border rounded text-sm" />
                ) : s.type === "video" ? (
                  <input type="text" value={s.title} onChange={(e) => updateSelectedTitle(idx, e.target.value)} placeholder="Optional title" className="mt-2 w-full px-2 py-1 border rounded text-sm" />
                ) : null}

                <button onClick={() => removeSelected(idx)} className="absolute top-1 right-1 text-sm p-1" title="Remove"><FaTimes /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing media */}
      {loading ? (
        <p>Loading...</p>
      ) : images.length === 0 && videos.length === 0 ? (
        <p>No media found in this folder.</p>
      ) : (
        <>
          {images.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Images</h3>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onImagesDragEnd}>
                <SortableContext items={images.map((i) => i.public_id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                      <SortableImage key={img.public_id} img={img} onEditLabel={editLabel} onRename={renameImage} onDelete={deleteImage} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {videos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Videos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v) => (
                  <div key={v.public_id} className="relative border rounded p-2">
                    <video src={v.url} controls className="w-full h-48 object-cover rounded" />
                    <div className="mt-2">
                      <div className="text-sm text-gray-700 truncate">{v.title ? v.title : <span className="text-gray-400 italic">No title</span>}</div>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-3">
                        <button title="Edit title" className="text-blue-600" onClick={() => editTitle(v.public_id, v.title)}><FaEdit /></button>
                        <button title="Rename public id" className="text-yellow-600" onClick={() => renameImage(v.public_id)}>R</button>
                      </div>

                      <button title="Delete" className="text-red-600" onClick={() => deleteImage(v.public_id)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// import { useState, useEffect } from "react";
// import axios from "axios";
// import { FaTrash, FaEdit, FaUpload, FaTimes } from "react-icons/fa";

// function FolderImages({ folderId, token }) {
//   const [images, setImages] = useState([]);
//   const [videos, setVideos] = useState([]); // new: store videos
//   const [loading, setLoading] = useState(true);

//   // New: files selected for upload. Each item: { file, preview, label, title, type }
//   const [selectedFiles, setSelectedFiles] = useState([]);

//   useEffect(() => {
//     if (folderId) fetchImages();
//     // cleanup previews on unmount
//     return () => {
//       selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [folderId]);

//   const fetchImages = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // backend may return both images and videos; keep backward compatibility
//       setImages(res.data.images || []);
//       setVideos(res.data.videos || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Upload UI handlers ----------
//   const handleFilesChange = (e) => {
//     const files = Array.from(e.target.files || []);
//     const newSelected = files.map((file) => {
//       const isVideo = file.type && file.type.startsWith("video");
//       const isImage = file.type && file.type.startsWith("image");
//       const type = isVideo ? "video" : isImage ? "image" : "other";
//       return {
//         file,
//         preview: URL.createObjectURL(file),
//         label: "", // optional label for images
//         title: "", // optional title for videos
//         type,
//       };
//     });
//     // append to existing selected files
//     setSelectedFiles((prev) => [...prev, ...newSelected]);
//     // reset file input
//     e.target.value = null;
//   };

//   const removeSelected = (index) => {
//     // revoke preview url and remove
//     URL.revokeObjectURL(selectedFiles[index].preview);
//     setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
//   };

//   const updateSelectedLabel = (index, label) => {
//     setSelectedFiles((prev) => {
//       const arr = [...prev];
//       arr[index] = { ...arr[index], label };
//       return arr;
//     });
//   };

//   const updateSelectedTitle = (index, title) => {
//     setSelectedFiles((prev) => {
//       const arr = [...prev];
//       arr[index] = { ...arr[index], title };
//       return arr;
//     });
//   };

//   const uploadSelected = async () => {
//     if (!folderId || selectedFiles.length === 0) return;
//     const fd = new FormData();

//     // append each file as 'file' (backend handles grouping by mime type)
//     selectedFiles.forEach((s) => fd.append("file", s.file));

//     // append labels[] for images (legacy) and videoTitles[] for videos
//     // Keep order per-type so backend can map metadata to files of that type
//     const imageLabels = selectedFiles.filter((s) => s.type === "image").map((s) => s.label ?? "");
//     const videoTitles = selectedFiles.filter((s) => s.type === "video").map((s) => s.title ?? "");

//     imageLabels.forEach((lbl) => fd.append("labels[]", lbl)); // legacy name kept for images
//     videoTitles.forEach((t) => fd.append("videoTitles[]", t)); // new field for videos

//     try {
//       setLoading(true);
//       const res = await axios.post(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
//         fd,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       // backend returns { uploaded: { images: [...], videos: [...] } } per updated server
//       const uploaded = res.data.uploaded || {};
//       const uploadedImages = uploaded.images || [];
//       const uploadedVideos = uploaded.videos || [];

//       // merge new media into state (prepend so newest appear first)
//       setImages((prev) => [...uploadedImages, ...prev]);
//       setVideos((prev) => [...uploadedVideos, ...prev]);

//       // clear selected files and revoke previews
//       selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
//       setSelectedFiles([]);
//     } catch (err) {
//       console.error("Upload error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Existing actions (adapted) ----------
//   const deleteImage = async (publicId) => {
//     if (!window.confirm("Delete this image?")) return;
//     try {
//       await axios.delete(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setImages((prev) => prev.filter((img) => img.public_id !== publicId));
//       setVideos((prev) => prev.filter((v) => v.public_id !== publicId)); // in case it's a video
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const renameImage = async (publicId) => {
//     const newName = prompt("Enter new name for image:");
//     if (!newName) return;
//     try {
//       const res = await axios.put(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         { newName },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       // server may return updated image or video in res.data.image / res.data.video
//       if (res.data.image) {
//         setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
//       } else if (res.data.video) {
//         setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Edit label for already uploaded image, or title for already uploaded video
//   const editLabel = async (publicId, currentLabel) => {
//     const newLabel = prompt("Enter label for this image (leave empty to clear):", currentLabel ?? "");
//     if (newLabel === null) return; // cancelled
//     try {
//       const res = await axios.put(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         { newLabel },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.image) {
//         setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
//       } else if (res.data.video) {
//         setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Edit title for video
//   const editTitle = async (publicId, currentTitle) => {
//     const newTitle = prompt("Enter title for this video (leave empty to clear):", currentTitle ?? "");
//     if (newTitle === null) return;
//     try {
//       const res = await axios.put(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         { newTitle },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       if (res.data.video) {
//         setVideos((prev) => prev.map((v) => (v.public_id === publicId ? res.data.video : v)));
//       } else if (res.data.image) {
//         setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div>
//       <h2 className="text-xl font-bold mb-4">Media in Folder</h2>

//       {/* ===== Upload area ===== */}
//       <div className="mb-4 border rounded p-3">
//         <div className="flex items-center gap-3 mb-3">
//           <label className="flex items-center gap-2 cursor-pointer">
//             <input type="file" multiple onChange={handleFilesChange} className="hidden" />
//             <button className="btn-primary inline-flex items-center gap-2">
//               <FaUpload /> Select files
//             </button>
//           </label>

//           <button
//             className="btn-secondary"
//             onClick={uploadSelected}
//             disabled={selectedFiles.length === 0 || loading}
//             title="Upload selected files with labels/titles"
//           >
//             Upload ({selectedFiles.length})
//           </button>
//         </div>

//         {/* Preview selected files with label/title inputs */}
//         {selectedFiles.length > 0 && (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             {selectedFiles.map((s, idx) => (
//               <div key={idx} className="relative border rounded p-2">
//                 {s.type === "image" ? (
//                   <img src={s.preview} alt="" className="w-full h-32 object-cover rounded" />
//                 ) : s.type === "video" ? (
//                   <video src={s.preview} className="w-full h-32 object-cover rounded" controls />
//                 ) : (
//                   <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded">Unsupported</div>
//                 )}

//                 {s.type === "image" ? (
//                   <input
//                     type="text"
//                     value={s.label}
//                     onChange={(e) => updateSelectedLabel(idx, e.target.value)}
//                     placeholder="Optional label"
//                     className="mt-2 w-full px-2 py-1 border rounded text-sm"
//                   />
//                 ) : s.type === "video" ? (
//                   <input
//                     type="text"
//                     value={s.title}
//                     onChange={(e) => updateSelectedTitle(idx, e.target.value)}
//                     placeholder="Optional title"
//                     className="mt-2 w-full px-2 py-1 border rounded text-sm"
//                   />
//                 ) : null}

//                 <button
//                   onClick={() => removeSelected(idx)}
//                   className="absolute top-1 right-1 text-sm p-1"
//                   title="Remove"
//                 >
//                   <FaTimes />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ===== Existing images & videos ===== */}
//       {loading ? (
//         <p>Loading...</p>
//       ) : images.length === 0 && videos.length === 0 ? (
//         <p>No media found in this folder.</p>
//       ) : (
//         <>
//           {images.length > 0 && (
//             <div className="mb-6">
//               <h3 className="font-semibold mb-2">Images</h3>
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {images.map((img) => (
//                   <div key={img.public_id} className="relative border rounded p-2">
//                     <img src={img.url} alt={img.label ?? ""} className="w-full h-40 object-cover rounded" />

//                     {/* Label */}
//                     <div className="mt-2">
//                       <div className="text-sm text-gray-700 truncate">
//                         {img.label ? img.label : <span className="text-gray-400 italic">No label</span>}
//                       </div>
//                     </div>

//                     <div className="flex justify-between items-center mt-2">
//                       <div className="flex gap-3">
//                         <button title="Edit label" className="text-blue-600" onClick={() => editLabel(img.public_id, img.label)}>
//                           <FaEdit />
//                         </button>

//                         <button title="Rename public id" className="text-yellow-600" onClick={() => renameImage(img.public_id)}>
//                           R
//                         </button>
//                       </div>

//                       <button title="Delete" className="text-red-600" onClick={() => deleteImage(img.public_id)}>
//                         <FaTrash />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {videos.length > 0 && (
//             <div>
//               <h3 className="font-semibold mb-2">Videos</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {videos.map((v) => (
//                   <div key={v.public_id} className="relative border rounded p-2">
//                     <video src={v.url} controls className="w-full h-48 object-cover rounded" />
//                     <div className="mt-2">
//                       <div className="text-sm text-gray-700 truncate">
//                         {v.title ? v.title : <span className="text-gray-400 italic">No title</span>}
//                       </div>
//                     </div>

//                     <div className="flex justify-between items-center mt-2">
//                       <div className="flex gap-3">
//                         <button title="Edit title" className="text-blue-600" onClick={() => editTitle(v.public_id, v.title)}>
//                           <FaEdit />
//                         </button>

//                         <button title="Rename public id" className="text-yellow-600" onClick={() => renameImage(v.public_id)}>
//                           R
//                         </button>
//                       </div>

//                       <button title="Delete" className="text-red-600" onClick={() => deleteImage(v.public_id)}>
//                         <FaTrash />
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// export default FolderImages;


// import { useState, useEffect } from "react";
// import axios from "axios";
// import { FaTrash, FaEdit, FaUpload, FaTimes } from "react-icons/fa";

// function FolderImages({ folderId, token }) {
//   const [images, setImages] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // New: files selected for upload. Each item: { file, preview, label }
//   const [selectedFiles, setSelectedFiles] = useState([]);

//   useEffect(() => {
//     if (folderId) fetchImages();
//     // cleanup previews on unmount
//     return () => {
//       selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [folderId]);

//   const fetchImages = async () => {
//     try {
//       setLoading(true);
//       const res = await axios.get(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setImages(res.data.images || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Upload UI handlers ----------
//   const handleFilesChange = (e) => {
//     const files = Array.from(e.target.files || []);
//     const newSelected = files.map((file) => ({
//       file,
//       preview: URL.createObjectURL(file),
//       label: "", // optional label editable before upload
//     }));
//     // append to existing selected files
//     setSelectedFiles((prev) => [...prev, ...newSelected]);
//     // reset file input
//     e.target.value = null;
//   };

//   const removeSelected = (index) => {
//     // revoke preview url and remove
//     URL.revokeObjectURL(selectedFiles[index].preview);
//     setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
//   };

//   const updateSelectedLabel = (index, label) => {
//     setSelectedFiles((prev) => {
//       const arr = [...prev];
//       arr[index] = { ...arr[index], label };
//       return arr;
//     });
//   };

//   const uploadSelected = async () => {
//     if (!folderId || selectedFiles.length === 0) return;
//     const fd = new FormData();

//     // append each file and corresponding labels[] in same order
//     selectedFiles.forEach((s) => fd.append("file", s.file));
//     // append labels[] even if some labels are empty strings (backend treats undefined/empty appropriately)
//     selectedFiles.forEach((s) => fd.append("labels[]", s.label));

//     try {
//       setLoading(true);
//       const res = await axios.post(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
//         fd,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );
//       // append newly uploaded images to state
//       const uploaded = res.data.uploaded || [];
//       setImages((prev) => [...uploaded, ...prev]);
//       // clear selected files and revoke previews
//       selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
//       setSelectedFiles([]);
//     } catch (err) {
//       console.error("Upload error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ---------- Existing actions (adapted) ----------
//   const deleteImage = async (publicId) => {
//     if (!window.confirm("Delete this image?")) return;
//     try {
//       await axios.delete(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setImages((prev) => prev.filter((img) => img.public_id !== publicId));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const renameImage = async (publicId) => {
//     const newName = prompt("Enter new name for image:");
//     if (!newName) return;
//     try {
//       const res = await axios.put(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         { newName },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Edit label for already uploaded image
//   const editLabel = async (publicId, currentLabel) => {
//     const newLabel = prompt("Enter label for this image (leave empty to clear):", currentLabel ?? "");
//     if (newLabel === null) return; // cancelled
//     try {
//       const res = await axios.put(
//         `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
//           publicId
//         )}`,
//         { newLabel },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div>
//       <h2 className="text-xl font-bold mb-4">Images in Folder</h2>

//       {/* ===== Upload area ===== */}
//       <div className="mb-4 border rounded p-3">
//         <div className="flex items-center gap-3 mb-3">
//           <label className="flex items-center gap-2 cursor-pointer">
//             <input type="file" multiple onChange={handleFilesChange} className="hidden" />
//             <button className="btn-primary inline-flex items-center gap-2">
//               <FaUpload /> Select files
//             </button>
//           </label>

//           <button
//             className="btn-secondary"
//             onClick={uploadSelected}
//             disabled={selectedFiles.length === 0 || loading}
//             title="Upload selected files with labels"
//           >
//             Upload ({selectedFiles.length})
//           </button>
//         </div>

//         {/* Preview selected files with label inputs */}
//         {selectedFiles.length > 0 && (
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//             {selectedFiles.map((s, idx) => (
//               <div key={idx} className="relative border rounded p-2">
//                 <img src={s.preview} alt="" className="w-full h-32 object-cover rounded" />
//                 <input
//                   type="text"
//                   value={s.label}
//                   onChange={(e) => updateSelectedLabel(idx, e.target.value)}
//                   placeholder="Optional label"
//                   className="mt-2 w-full px-2 py-1 border rounded text-sm"
//                 />
//                 <button
//                   onClick={() => removeSelected(idx)}
//                   className="absolute top-1 right-1 text-sm p-1"
//                   title="Remove"
//                 >
//                   <FaTimes />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* ===== Existing images ===== */}
//       {loading ? (
//         <p>Loading...</p>
//       ) : images.length === 0 ? (
//         <p>No images found in this folder.</p>
//       ) : (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {images.map((img) => (
//             <div key={img.public_id} className="relative border rounded p-2">
//               <img src={img.url} alt={img.label ?? ""} className="w-full h-40 object-cover rounded" />

//               {/* Label */}
//               <div className="mt-2">
//                 <div className="text-sm text-gray-700 truncate">
//                   {img.label ? img.label : <span className="text-gray-400 italic">No label</span>}
//                 </div>
//               </div>

//               <div className="flex justify-between items-center mt-2">
//                 <div className="flex gap-3">
//                   <button title="Edit label" className="text-blue-600" onClick={() => editLabel(img.public_id, img.label)}>
//                     <FaEdit />
//                   </button>

//                   <button title="Rename public id" className="text-yellow-600" onClick={() => renameImage(img.public_id)}>
//                     R
//                   </button>
//                 </div>

//                 <button title="Delete" className="text-red-600" onClick={() => deleteImage(img.public_id)}>
//                   <FaTrash />
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default FolderImages;


// import { useState, useEffect } from "react";
// import axios from "axios";
// import { FaTrash, FaEdit } from "react-icons/fa";

// function FolderImages({ folderId, token }) {
//     const [images, setImages] = useState([]);
//     const [loading, setLoading] = useState(true);

//     // Fetch all images from folder
//     useEffect(() => {
//         if (folderId) {
//             fetchImages();
//         }
//     }, [folderId]);

//     const fetchImages = async () => {
//         try {
//             setLoading(true);
//             const res = await axios.get(`https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             console.log(res.data.images);
//             setImages(res.data.images);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Delete image
//     const deleteImage = async (cloudinaryPublicId) => {
//         if (!window.confirm("Delete this image?")) return;
//         try {
//             await axios.delete(`https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(cloudinaryPublicId)}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             setImages(images.filter(img => img.public_id !== cloudinaryPublicId));
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     // Rename image
//     const renameImage = async (publicId) => {
//         const newName = prompt("Enter new name for image:");
//         if (!newName) return;
//         try {
//             const res = await axios.put(
//                 `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${publicId}`,
//                 { newName },
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );
//             // update state
//             setImages(images.map(img =>
//                 img.public_id === publicId ? res.data.image : img
//             ));
//         } catch (err) {
//             console.error(err);
//         }
//     };

//     return (
//         <div>
//             <h2 className="text-xl font-bold mb-4">Images in Folder</h2>
//             {loading ? (
//                 <p>Loading...</p>
//             ) : images.length === 0 ? (
//                 <p>No images found in this folder.</p>
//             ) : (
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                     {images.map((img) => (
//                         <div key={img.public_id} className="relative border rounded p-2">
//                             <img src={img.url} alt="" className="w-full h-40 object-cover rounded" />
//                             <div className="flex justify-between mt-2">
//                                 <button
//                                     className="text-red-600"
//                                     onClick={() => deleteImage(encodeURIComponent(img.public_id))}
//                                 >
//                                     <FaTrash />
//                                 </button>
//                                 {/* <button
//                                     className="text-blue-600"
//                                     onClick={() => renameImage(img.public_id)}
//                                 >
//                                     <FaEdit />
//                                 </button> */}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }

// export default FolderImages;
