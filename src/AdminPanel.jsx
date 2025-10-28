
// import { useState, useEffect } from "react";
// import { FaUserCircle, FaFolder, FaEdit, FaTrash } from "react-icons/fa";
// import FolderImages from "./FolderImages";

// export default function AdminPanel({ onLogout }) {
//     const [folders, setFolders] = useState([]);
//     const [selected, setSelected] = useState(null);
//     const [token, setToken] = useState(localStorage.getItem("token"));

//     const API_URL = "https://kooyapady-admin-backend.onrender.com/api";

//     useEffect(() => {
//         fetchFolders();
//     }, []);

//     const fetchFolders = async () => {
//         try {
//             const res = await fetch(`${API_URL}/folders`, {
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             const data = await res.json();
//             if (res.ok) setFolders(data);
//             else console.error(data.message);
//         } catch (err) {
//             console.error("Fetch folders error:", err);
//         }
//     };
//     //add folder
//     const addFolder = async () => {
//         const name = prompt("Enter new folder name:");
//         if (!name) return;
//         try {
//             const res = await fetch(`${API_URL}/folders`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ name }),
//             });
//             const data = await res.json();
//             if (res.ok) setFolders([...folders, data]);
//             else alert(data.message);
//         } catch (err) {
//             console.error("Add folder error:", err);
//         }
//     };

//     //Edit folder name
//     const editFolder = async (folder) => {
//         const newName = prompt("Enter new folder name:", folder.name);
//         if (!newName) return;
//         try {
//             const res = await fetch(`${API_URL}/folders/${folder._id}`, {
//                 method: "PUT",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                 },
//                 body: JSON.stringify({ name: newName }),
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 setFolders(folders.map((f) => (f._id === folder._id ? data : f)));
//                 if (selected && selected._id === folder._id) {
//                     setSelected(data);
//                 }
//             } else alert(data.message);
//         } catch (err) {
//             console.error("Edit folder error:", err);
//         }
//     };

//     //Delete folder
//     const deleteFolder = async (folder) => {
//         if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
//         try {
//             const res = await fetch(`${API_URL}/folders/${folder._id}`, {
//                 method: "DELETE",
//                 headers: { Authorization: `Bearer ${token}` },
//             });
//             if (res.ok) {
//                 setFolders(folders.filter((f) => f._id !== folder._id));
//                 if (selected && selected._id === folder._id) {
//                     setSelected(null);
//                 }
//             } else {
//                 const data = await res.json();
//                 alert(data.message);
//             }
//         } catch (err) {
//             console.error("Delete folder error:", err);
//         }
//     };


//     //Upload images
//     const handleUpload = async (e) => {
//         const files = e.target.files;
//         if (!files.length || !selected) return;
//         const formData = new FormData();
//         for (let file of files) {
//             formData.append("file", file);
//         }
//         try {
//             const res = await fetch(`${API_URL}/upload/${selected._id}`, {
//                 method: "POST",
//                 headers: { Authorization: `Bearer ${token}` },
//                 body: formData,
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 const updated = {
//                     ...selected,
//                     images: [...(selected.images || []), ...data.uploaded],
//                 };
//                 setSelected(updated);
//                 setFolders(
//                     folders.map((f) => (f._id === selected._id ? updated : f))
//                 );
//             } else alert(data.message);
//         } catch (err) {
//             console.error("Upload error:", err);
//         }
//     };

//     return (
//         <div className="min-h-screen flex flex-col">
//             {/* Navbar */}
//             <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white flex justify-between items-center px-6 py-6 shadow-md z-10">
//                 <h1 className="text-xl font-bold">Koovappady's Kshemalayam</h1>
//                 <div className="flex items-center space-x-4">
//                     <button
//                         onClick={() => {
//                             localStorage.removeItem("token");
//                             onLogout();
//                         }}
//                         className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
//                     >
//                         Logout
//                     </button>
//                     <FaUserCircle size={28} className="cursor-pointer hover:text-gray-300" />
//                 </div>
//             </nav>

//             <div className="flex flex-1">
//                 {/* Sidebar */}
//                 <div className="w-74 overflow-hidden bg-gray-800 text-white py-6">
//                     <h2 className="text-xl font-semibold mt-16 text-center mb-4">
//                         Image Folders
//                     </h2>
//                     <ul className="px-6 space-y-2">
//                         {folders.map((f) => (
//                             <li
//                                 key={f._id}
//                                 className={`p-2 flex justify-between items-center rounded cursor-pointer ${selected && selected._id === f._id
//                                     ? "bg-gray-700"
//                                     : "hover:bg-gray-700"
//                                     }`}
//                             >
//                                 <div
//                                     className="flex gap-2 items-center flex-1"
//                                     onClick={() => setSelected(f)}
//                                 >
//                                     <FaFolder size={22} />
//                                     <span className="capitalize">{f.name}</span>
//                                 </div>
//                                 <div className="flex gap-2">
//                                     <FaEdit
//                                         size={18}
//                                         className="cursor-pointer hover:text-yellow-400"
//                                         onClick={() => editFolder(f)}
//                                     />
//                                     <FaTrash
//                                         size={18}
//                                         className="cursor-pointer hover:text-red-500"
//                                         onClick={() => deleteFolder(f)}
//                                     />
//                                 </div>
//                             </li>
//                         ))}
//                     </ul>
//                     <button
//                         onClick={addFolder}
//                         className="mt-4 ml-6 mr-6 w-62 bg-blue-600 py-2 rounded hover:bg-blue-700"
//                     >
//                         + Add Folder
//                     </button>
//                 </div>

//                 {/* Main Content */}
//                 <div className="flex-1 py-16 px-8 bg-gray-100">
//                     <h1 className="text-2xl text-center py-4 mt-4 font-bold mb-4">
//                         Folder: {selected ? selected.name : "No Folder Selected"}
//                     </h1>
//                     {selected && (
//                         <>
//                             <input
//                                 type="file"
//                                 multiple
//                                 className="mb-4 block w-full border border-gray-400 rounded p-2"
//                                 onChange={handleUpload}
//                             />
//                             <FolderImages folderId={selected._id} token={token} />

//                         </>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }

// src/components/AdminPanel.jsx
import { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaFolder, FaEdit, FaTrash, FaCommentDots } from "react-icons/fa";
import FolderImages from "./FolderImages";
import FeedbackList from "./FeedbackList";

export default function AdminPanel({ onLogout }) {
  const [folders, setFolders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("folders"); // "folders" or "feedback"

  const API_URL = "http://localhost:5001/api";

  // Add folder UI state
  const [adding, setAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Edit folder UI state
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Upload UI state
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setFolders(data);
      else console.error(data.message);
    } catch (err) {
      console.error("Fetch folders error:", err);
    }
  };

  // Add folder
  const addFolder = async () => {
    const name = newFolderName?.trim();
    if (!name) return;
    try {
      const res = await fetch(`${API_URL}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state (no refresh)
        setFolders((prev) => [...prev, data]);
        setNewFolderName("");
        setAdding(false);
      } else {
        console.error("Add folder failed:", data.message);
        alert(data.message || "Failed to add folder");
      }
    } catch (err) {
      console.error("Add folder error:", err);
    }
  };

  // Start editing a folder (show input)
  const startEditFolder = (folder) => {
    setEditingFolderId(folder._id);
    setEditingFolderName(folder.name);
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  // Submit edit folder
  const submitEditFolder = async (folderId) => {
    const name = editingFolderName?.trim();
    if (!name) return;
    try {
      const res = await fetch(`${API_URL}/folders/${folderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        // Update local state
        setFolders((prev) => prev.map((f) => (f._id === folderId ? data : f)));
        if (selected && selected._id === folderId) setSelected(data);
        setEditingFolderId(null);
        setEditingFolderName("");
      } else {
        console.error("Edit folder failed:", data.message);
        alert(data.message || "Failed to edit folder");
      }
    } catch (err) {
      console.error("Edit folder error:", err);
    }
  };

  // Delete folder
  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    try {
      const res = await fetch(`${API_URL}/folders/${folder._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f._id !== folder._id));
        if (selected && selected._id === folder._id) setSelected(null);
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error("Delete folder error:", err);
    }
  };

  // Handle file input change
  const onFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files || []));
  };

  // Upload files (button)
  const handleUpload = async () => {
    if (!uploadFiles.length || !selected) return alert("Select a folder and at least one file.");
    setUploading(true);
    const formData = new FormData();
    for (let file of uploadFiles) {
      formData.append("file", file);
    }
    try {
      const res = await fetch(`${API_URL}/upload/${selected._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        // data.uploaded expected (from your earlier code)
        const uploaded = data.uploaded || data.images || [];
        // update selected and folders immutably
        const updatedSelected = {
          ...selected,
          images: [...(selected.images || []), ...uploaded],
        };
        setSelected(updatedSelected);
        setFolders((prev) => prev.map((f) => (f._id === selected._id ? updatedSelected : f)));
        // reset file input
        setUploadFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        alert(data.message || "Upload failed");
        console.error("Upload failed:", data);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white flex justify-between items-center px-6 py-6 shadow-md z-10">
        <h1 className="text-xl font-bold">Koovappady's Kshemalayam</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              onLogout();
            }}
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
          <FaUserCircle size={28} className="cursor-pointer hover:text-gray-300" />
        </div>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-74 overflow-hidden bg-gray-800 text-white py-6">
          <h2 className="text-xl font-semibold mt-16 text-center mb-4">Image Folders</h2>

          {/* List of folders */}
          <ul className="px-6 space-y-2">
            {folders.map((f) => (
              <li
                key={f._id}
                className={`p-2 flex justify-between items-center rounded cursor-pointer ${selected && selected._id === f._id ? "bg-gray-700" : "hover:bg-gray-700"
                  }`}
              >
                <div
                  className="flex gap-2 items-center flex-1"
                  onClick={() => {
                    setView("folders"); // ensure view stays on folders
                    setSelected(f);
                  }}
                >
                  <FaFolder size={22} />
                  {editingFolderId === f._id ? (
                    <input
                      className="text-black rounded p-1"
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitEditFolder(f._id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="capitalize">{f.name}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingFolderId === f._id ? (
                    <>
                      <button
                        onClick={() => submitEditFolder(f._id)}
                        className="text-green-400 hover:text-green-300"
                        title="Save"
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit} className="text-yellow-400 hover:text-yellow-300" title="Cancel">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <FaEdit
                        size={18}
                        className="cursor-pointer hover:text-yellow-400"
                        onClick={() => startEditFolder(f)}
                      />
                      <FaTrash
                        size={18}
                        className="cursor-pointer hover:text-red-500"
                        onClick={() => deleteFolder(f)}
                      />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Add folder input + button */}
          <div className="mt-4 ml-6 mr-6 w-62">
            {!adding ? (
              <button
                onClick={() => setAdding(true)}
                className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700"
              >
                + Add Folder
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 rounded text-black"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addFolder();
                    if (e.key === "Escape") {
                      setAdding(false);
                      setNewFolderName("");
                    }
                  }}
                  autoFocus
                />
                <button onClick={addFolder} className="bg-green-600 px-3 py-2 rounded hover:bg-green-700">
                  Add
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setNewFolderName("");
                  }}
                  className="bg-gray-600 px-3 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Feedback nav item */}
          <div className="mt-6 ml-6 mr-6">
            <button
              onClick={() => {
                setSelected(null);
                setView("feedback");
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded ${view === "feedback" ? "bg-gray-700" : "bg-gray-600 hover:bg-gray-700"
                }`}
            >
              <FaCommentDots size={18} />
              <span>Feedback</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 py-16 px-8 bg-gray-100">
          {view === "folders" ? (
            <>
              <h1 className="text-2xl text-center py-4 mt-4 font-bold mb-4">
                Folder: {selected ? selected.name : "No Folder Selected"}
              </h1>

              {selected && (
                <>
                  {/* File selector + upload button */}
                  <div className="mb-4 flex gap-2 items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="block w-full border border-gray-400 rounded p-2"
                      onChange={onFileChange}
                    />
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className={`px-4 py-2 rounded ${uploading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
                    >
                      {uploading ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  <FolderImages folderId={selected._id} token={token} />
                </>
              )}
            </>
          ) : (
            // Feedback view
            <FeedbackList token={token} />
          )}
        </div>
      </div>
    </div>
  );
}
