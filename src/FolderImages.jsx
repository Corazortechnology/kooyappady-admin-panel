import { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash, FaEdit, FaUpload, FaTimes } from "react-icons/fa";

function FolderImages({ folderId, token }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // New: files selected for upload. Each item: { file, preview, label }
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    if (folderId) fetchImages();
    // cleanup previews on unmount
    return () => {
      selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImages(res.data.images || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Upload UI handlers ----------
  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const newSelected = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      label: "", // optional label editable before upload
    }));
    // append to existing selected files
    setSelectedFiles((prev) => [...prev, ...newSelected]);
    // reset file input
    e.target.value = null;
  };

  const removeSelected = (index) => {
    // revoke preview url and remove
    URL.revokeObjectURL(selectedFiles[index].preview);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSelectedLabel = (index, label) => {
    setSelectedFiles((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], label };
      return arr;
    });
  };

  const uploadSelected = async () => {
    if (!folderId || selectedFiles.length === 0) return;
    const fd = new FormData();

    // append each file and corresponding labels[] in same order
    selectedFiles.forEach((s) => fd.append("file", s.file));
    // append labels[] even if some labels are empty strings (backend treats undefined/empty appropriately)
    selectedFiles.forEach((s) => fd.append("labels[]", s.label));

    try {
      setLoading(true);
      const res = await axios.post(
        `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // append newly uploaded images to state
      const uploaded = res.data.uploaded || [];
      setImages((prev) => [...uploaded, ...prev]);
      // clear selected files and revoke previews
      selectedFiles.forEach((s) => URL.revokeObjectURL(s.preview));
      setSelectedFiles([]);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Existing actions (adapted) ----------
  const deleteImage = async (publicId) => {
    if (!window.confirm("Delete this image?")) return;
    try {
      await axios.delete(
        `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
          publicId
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setImages((prev) => prev.filter((img) => img.public_id !== publicId));
    } catch (err) {
      console.error(err);
    }
  };

  const renameImage = async (publicId) => {
    const newName = prompt("Enter new name for image:");
    if (!newName) return;
    try {
      const res = await axios.put(
        `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
          publicId
        )}`,
        { newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
    } catch (err) {
      console.error(err);
    }
  };

  // Edit label for already uploaded image
  const editLabel = async (publicId, currentLabel) => {
    const newLabel = prompt("Enter label for this image (leave empty to clear):", currentLabel ?? "");
    if (newLabel === null) return; // cancelled
    try {
      const res = await axios.put(
        `https://kooyapady-admin-backend-rtb2.onrender.com/api/upload/${folderId}/${encodeURIComponent(
          publicId
        )}`,
        { newLabel },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImages((prev) => prev.map((img) => (img.public_id === publicId ? res.data.image : img)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Images in Folder</h2>

      {/* ===== Upload area ===== */}
      <div className="mb-4 border rounded p-3">
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="file" multiple onChange={handleFilesChange} className="hidden" />
            <button className="btn-primary inline-flex items-center gap-2">
              <FaUpload /> Select files
            </button>
          </label>

          <button
            className="btn-secondary"
            onClick={uploadSelected}
            disabled={selectedFiles.length === 0 || loading}
            title="Upload selected files with labels"
          >
            Upload ({selectedFiles.length})
          </button>
        </div>

        {/* Preview selected files with label inputs */}
        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {selectedFiles.map((s, idx) => (
              <div key={idx} className="relative border rounded p-2">
                <img src={s.preview} alt="" className="w-full h-32 object-cover rounded" />
                <input
                  type="text"
                  value={s.label}
                  onChange={(e) => updateSelectedLabel(idx, e.target.value)}
                  placeholder="Optional label"
                  className="mt-2 w-full px-2 py-1 border rounded text-sm"
                />
                <button
                  onClick={() => removeSelected(idx)}
                  className="absolute top-1 right-1 text-sm p-1"
                  title="Remove"
                >
                  <FaTimes />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Existing images ===== */}
      {loading ? (
        <p>Loading...</p>
      ) : images.length === 0 ? (
        <p>No images found in this folder.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.public_id} className="relative border rounded p-2">
              <img src={img.url} alt={img.label ?? ""} className="w-full h-40 object-cover rounded" />

              {/* Label */}
              <div className="mt-2">
                <div className="text-sm text-gray-700 truncate">
                  {img.label ? img.label : <span className="text-gray-400 italic">No label</span>}
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-3">
                  <button title="Edit label" className="text-blue-600" onClick={() => editLabel(img.public_id, img.label)}>
                    <FaEdit />
                  </button>

                  <button title="Rename public id" className="text-yellow-600" onClick={() => renameImage(img.public_id)}>
                    R
                  </button>
                </div>

                <button title="Delete" className="text-red-600" onClick={() => deleteImage(img.public_id)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FolderImages;


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
