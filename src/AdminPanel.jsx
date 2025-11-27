// src/components/AdminPanel.jsx
// import { useState, useEffect, useRef } from "react";
// import { FaUserCircle, FaFolder, FaEdit, FaTrash, FaCommentDots } from "react-icons/fa";
// import FolderImages from "./FolderImages";
// import FeedbackList from "./FeedbackList";

// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";

// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";

// import { CSS } from "@dnd-kit/utilities";

// function SortableFolderItem({ folder, selected, onClick, onEdit, onDelete }) {
//   const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: folder._id });
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     userSelect: "none",
//   };

//   return (
//     <li
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className={`p-2 flex justify-between items-center rounded cursor-pointer ${selected ? "bg-gray-700" : "hover:bg-gray-700"}`}
//     >
//       <div className="flex gap-2 items-center flex-1" onClick={() => onClick(folder)}>
//         <FaFolder size={22} />
//         <span className="capitalize">{folder.name}</span>
//       </div>

//       <div className="flex gap-2">
//         <FaEdit size={18} className="cursor-pointer hover:text-yellow-400" onClick={() => onEdit(folder)} />
//         <FaTrash size={18} className="cursor-pointer hover:text-red-500" onClick={() => onDelete(folder)} />
//       </div>
//     </li>
//   );
// }

// export default function AdminPanel({ onLogout }) {
//   const [folders, setFolders] = useState([]);
//   const [selected, setSelected] = useState(null);
//   // keep token state only as convenience; requests always read from localStorage
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [view, setView] = useState("folders"); // "folders" or "feedback"

//   const API_URL = "https://kooyapady-admin-backend-rtb2.onrender.com/api";
//   const AUTH_API = "https://kooyapady-admin-backend.onrender.com/api/auth";

//   // Add folder UI state
//   const [adding, setAdding] = useState(false);
//   const [newFolderName, setNewFolderName] = useState("");

//   // Edit folder UI state
//   const [editingFolderId, setEditingFolderId] = useState(null);
//   const [editingFolderName, setEditingFolderName] = useState("");

//   // Upload UI state (kept for file input area)
//   const [uploadFiles, setUploadFiles] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const fileInputRef = useRef(null);

//   // Create-admin UI state
//   const [newAdminEmail, setNewAdminEmail] = useState("");
//   const [newAdminPassword, setNewAdminPassword] = useState("");
//   const [newAdminConfirm, setNewAdminConfirm] = useState("");
//   const [creatingAdmin, setCreatingAdmin] = useState(false);
//   const [createAdminMsg, setCreateAdminMsg] = useState("");
//   const [createAdminErr, setCreateAdminErr] = useState("");

//   useEffect(() => {
//     // ensure token exists on mount; otherwise force logout
//     const t = localStorage.getItem("token");
//     if (!t) {
//       onLogout();
//       return;
//     }
//     setToken(t);
//     // fetch folders once we know token exists
//     fetchFolders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Always read token from localStorage at request time to avoid stale closures.
//   const getAuthHeader = () => {
//     const t = localStorage.getItem("token");
//     return t ? { Authorization: `Bearer ${t}` } : {};
//   };

//   const fetchFolders = async () => {
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, { headers });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders(data);
//       } else {
//         // for folder fetch, a 401/403 indicates token invalid -> logout
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error(data.message);
//         }
//       }
//     } catch (err) {
//       console.error("Fetch folders error:", err);
//     }
//   };

//   // Add folder
//   const addFolder = async () => {
//     const name = newFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => [...prev, data]);
//         setNewFolderName("");
//         setAdding(false);
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Add folder failed:", data.message);
//           alert(data.message || "Failed to add folder");
//         }
//       }
//     } catch (err) {
//       console.error("Add folder error:", err);
//     }
//   };

//   // Edit flow
//   const startEditFolder = (folder) => {
//     setEditingFolderId(folder._id || folder._1d);
//     setEditingFolderName(folder.name);
//   };

//   const cancelEdit = () => {
//     setEditingFolderId(null);
//     setEditingFolderName("");
//   };

//   const submitEditFolder = async (folderId) => {
//     const name = editingFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folderId}`, {
//         method: "PUT",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => prev.map((f) => (f._id === folderId ? data : f)));
//         if (selected && selected._id === folderId) setSelected(data);
//         setEditingFolderId(null);
//         setEditingFolderName("");
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Edit folder failed:", data.message);
//           alert(data.message || "Failed to edit folder");
//         }
//       }
//     } catch (err) {
//       console.error("Edit folder error:", err);
//     }
//   };

//   const deleteFolder = async (folder) => {
//     if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folder._id}`, {
//         method: "DELETE",
//         headers,
//       });
//       if (res.ok) {
//         setFolders((prev) => prev.filter((f) => f._id !== folder._id));
//         if (selected && selected._id === folder._id) setSelected(null);
//       } else {
//         const data = await res.json();
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           alert(data.message || "Delete failed");
//         }
//       }
//     } catch (err) {
//       console.error("Delete folder error:", err);
//     }
//   };

//   // File input helper
//   const onFileChange = (e) => {
//     setUploadFiles(Array.from(e.target.files || []));
//   };

//   const handleUpload = async () => {
//     if (!uploadFiles.length || !selected) return alert("Select a folder and at least one file.");
//     setUploading(true);
//     const formData = new FormData();
//     for (let file of uploadFiles) formData.append("file", file);

//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/${selected._id}`, {
//         method: "POST",
//         headers,
//         body: formData,
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//           return;
//         }
//         alert(data.message || "Upload failed");
//         console.error("Upload failed:", data);
//         return;
//       }

//       let uploadedImages = [];
//       let uploadedVideos = [];

//       if (Array.isArray(data.uploaded)) uploadedImages = data.uploaded;
//       else if (data.uploaded && typeof data.uploaded === "object") {
//         uploadedImages = Array.isArray(data.uploaded.images) ? data.uploaded.images : [];
//         uploadedVideos = Array.isArray(data.uploaded.videos) ? data.uploaded.videos : [];
//       } else {
//         uploadedImages = Array.isArray(data.images) ? data.images : [];
//         uploadedVideos = Array.isArray(data.videos) ? data.videos : [];
//       }

//       const updatedSelected = {
//         ...selected,
//         images: [...(selected.images || []), ...uploadedImages],
//         videos: [...(selected.videos || []), ...uploadedVideos],
//       };

//       setSelected(updatedSelected);
//       setFolders((prev) => prev.map((f) => (f._id === selected._id ? updatedSelected : f)));

//       setUploadFiles([]);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Upload error. Check console.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // -------------- DnD setup for folders --------------
//   const sensors = useSensors(
//     useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
//     useSensor(KeyboardSensor)
//   );

//   const onFoldersDragEnd = async (event) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const oldIndex = folders.findIndex((f) => f._id === active.id);
//     const newIndex = folders.findIndex((f) => f._id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newFolders = arrayMove(folders, oldIndex, newIndex);
//     setFolders(newFolders); // optimistic

//     const folderIds = newFolders.map((f) => f._id);

//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/reorder-folders`, {
//         method: "PATCH",
//         headers,
//         body: JSON.stringify({ folderIds }),
//       });
//       if (!res.ok) {
//         console.error("Reorder folders failed:", await res.text());
//         await fetchFolders(); // revert by refetching
//       } else {
//         const resultData = await res.json().catch(() => null);
//         if (resultData && Array.isArray(resultData.folders)) setFolders(resultData.folders);
//       }
//     } catch (err) {
//       console.error("Reorder folders error:", err);
//       await fetchFolders();
//     }
//   };

//   // Create admin handler
//   const handleCreateAdmin = async (e) => {
//     e.preventDefault();
//     setCreateAdminMsg("");
//     setCreateAdminErr("");

//     const email = newAdminEmail?.trim();
//     const password = newAdminPassword;
//     const confirm = newAdminConfirm;

//     if (!email || !password || !confirm) {
//       setCreateAdminErr("All fields are required.");
//       return;
//     }
//     if (password.length < 8) {
//       setCreateAdminErr("Password must be at least 8 characters.");
//       return;
//     }
//     if (password !== confirm) {
//       setCreateAdminErr("Passwords do not match.");
//       return;
//     }

//     setCreatingAdmin(true);
//     try {
//       // read token fresh from localStorage
//       const t = localStorage.getItem("token");
//       if (!t) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${AUTH_API}/create-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${t}`,
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       // For create-admin: don't force immediate logout on 401/403.
//       // Instead show a clear error so the admin can retry / refresh token.
//       if (res.status === 401 || res.status === 403) {
//         const body = await res.json().catch(() => ({}));
//         setCreateAdminErr(body.message || "Unauthorized — your token may be expired or you lack permission.");
//         setCreatingAdmin(false);
//         return;
//       }

//       const data = await res.json();

//       if (res.ok) {
//         setCreateAdminMsg(`Admin created: ${data.admin?.email ?? email}`);
//         setNewAdminEmail("");
//         setNewAdminPassword("");
//         setNewAdminConfirm("");
//       } else {
//         setCreateAdminErr(data.message || "Failed to create admin.");
//       }
//     } catch (err) {
//       console.error("Create admin error:", err);
//       setCreateAdminErr("Something went wrong. Try again.");
//     } finally {
//       setCreatingAdmin(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     setToken(null);
//     onLogout();
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Navbar */}
//       <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white flex justify-between items-center px-6 py-6 shadow-md z-10">
//         <h1 className="text-xl font-bold">Koovappady's Kshemalayam</h1>
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={handleLogout}
//             className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
//           >
//             Logout
//           </button>
//           <FaUserCircle size={28} className="cursor-pointer hover:text-gray-300" />
//         </div>
//       </nav>

//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <div className="w-74 overflow-hidden bg-gray-800 text-white py-6">
//           <h2 className="text-xl font-semibold mt-16 text-center mb-4">Image Folders</h2>

//           {/* Draggable list of folders */}
//           <div className="px-6">
//             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFoldersDragEnd}>
//               <SortableContext items={folders.map((f) => f._id)} strategy={verticalListSortingStrategy}>
//                 <ul className="space-y-2">
//                   {folders.map((f) => (
//                     <SortableFolderItem
//                       key={f._id}
//                       folder={f}
//                       selected={selected && selected._id === f._id}
//                       onClick={(folder) => {
//                         setView("folders");
//                         setSelected(folder);
//                       }}
//                       onEdit={(folder) => startEditFolder(folder)}
//                       onDelete={(folder) => deleteFolder(folder)}
//                     />
//                   ))}
//                 </ul>
//               </SortableContext>
//             </DndContext>
//           </div>

//           {/* Add folder input + button */}
//           <div className="mt-4 ml-6 mr-6 w-62">
//             {!adding ? (
//               <button onClick={() => setAdding(true)} className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700">
//                 + Add Folder
//               </button>
//             ) : (
//               <div className="flex gap-2">
//                 <input
//                   className="flex-1 p-2 rounded text-black"
//                   placeholder="Folder name"
//                   value={newFolderName}
//                   onChange={(e) => setNewFolderName(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") addFolder();
//                     if (e.key === "Escape") {
//                       setAdding(false);
//                       setNewFolderName("");
//                     }
//                   }}
//                   autoFocus
//                 />
//                 <button onClick={addFolder} className="bg-green-600 px-3 py-2 rounded hover:bg-green-700">
//                   Add
//                 </button>
//                 <button
//                   onClick={() => {
//                     setAdding(false);
//                     setNewFolderName("");
//                   }}
//                   className="bg-gray-600 px-3 py-2 rounded hover:bg-gray-500"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Feedback nav item */}
//           <div className="mt-6 ml-6 mr-6">
//             <button
//               onClick={() => {
//                 setSelected(null);
//                 setView("feedback");
//               }}
//               className={`w-full flex items-center gap-2 px-4 py-2 rounded ${view === "feedback" ? "bg-gray-700" : "bg-gray-600 hover:bg-gray-700"}`}
//             >
//               <FaCommentDots size={18} />
//               <span>Feedback</span>
//             </button>
//           </div>

//           {/* Create Admin section (protected) */}
//           <div className="mt-6 ml-6 mr-6">
//             <div className="bg-gray-700 p-3 rounded">
//               <h3 className="font-semibold mb-2 text-sm">Create Admin</h3>

//               {createAdminMsg && <div className="text-green-300 text-sm mb-2">{createAdminMsg}</div>}
//               {createAdminErr && <div className="text-red-300 text-sm mb-2">{createAdminErr}</div>}

//               <form onSubmit={handleCreateAdmin} className="space-y-2">
//                 <input
//                   type="email"
//                   placeholder="New admin email"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminEmail}
//                   onChange={(e) => setNewAdminEmail(e.target.value)}
//                   required
//                 />
//                 <input
//                   type="password"
//                   placeholder="Password (min 8 chars)"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminPassword}
//                   onChange={(e) => setNewAdminPassword(e.target.value)}
//                   required
//                 />
//                 <input
//                   type="password"
//                   placeholder="Confirm password"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminConfirm}
//                   onChange={(e) => setNewAdminConfirm(e.target.value)}
//                   required
//                 />
//                 <button
//                   type="submit"
//                   disabled={creatingAdmin}
//                   className={`w-full py-2 rounded ${creatingAdmin ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
//                 >
//                   {creatingAdmin ? "Creating..." : "Create Admin"}
//                 </button>
//               </form>

//               <p className="text-xs text-gray-300 mt-2">
//                 Only an authenticated admin can create another admin. If your token expires you'll be logged out.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 py-16 px-8 bg-gray-100">
//           {view === "folders" ? (
//             <>
//               <h1 className="text-2xl text-center py-4 mt-4 font-bold mb-4">
//                 Folder: {selected ? selected.name : "No Folder Selected"}
//               </h1>

//               {selected && (
//                 <>
//                   {/* File selector + upload button */}
//                   <div className="mb-4 flex gap-2 items-center">
//                     <input ref={fileInputRef} type="file" multiple className="block w-full border border-gray-400 rounded p-2" onChange={onFileChange} />
//                     <button onClick={handleUpload} disabled={uploading} className={`px-4 py-2 rounded ${uploading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
//                       {uploading ? "Uploading..." : "Upload"}
//                     </button>
//                   </div>

//                   <FolderImages folderId={selected._id} token={localStorage.getItem("token")} />
//                 </>
//               )}
//             </>
//           ) : (
//             <FeedbackList token={localStorage.getItem("token")} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect, useRef } from "react";
// import { FaUserCircle, FaFolder, FaEdit, FaTrash, FaCommentDots } from "react-icons/fa";
// import FolderImages from "./FolderImages";
// import FeedbackList from "./FeedbackList";

// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";

// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";

// import { CSS } from "@dnd-kit/utilities";

// /**
//  * SortableFolderItem
//  *
//  * Props:
//  * - folder
//  * - selected
//  * - onClick
//  * - onEdit (starts edit)
//  * - onDelete
//  * - editingFolderId
//  * - editingFolderName
//  * - setEditingFolderName
//  * - onSaveEdit (callback(folderId))
//  * - onCancelEdit
//  */
// function SortableFolderItem({
//   folder,
//   selected,
//   onClick,
//   onEdit,
//   onDelete,
//   editingFolderId,
//   editingFolderName,
//   setEditingFolderName,
//   onSaveEdit,
//   onCancelEdit,
// }) {
//   const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: folder._id });
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     userSelect: "none",
//   };

//   const isEditing = editingFolderId === folder._id;

//   return (
//     <li
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className={`p-2 flex justify-between items-center rounded cursor-pointer ${selected ? "bg-gray-700" : "hover:bg-gray-700"}`}
//     >
//       <div className="flex gap-2 items-center flex-1" onClick={() => !isEditing && onClick(folder)}>
//         <FaFolder size={22} />
//         {isEditing ? (
//           <input
//             className="text-black rounded p-1"
//             value={editingFolderName}
//             onChange={(e) => setEditingFolderName(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") onSaveEdit(folder._id);
//               if (e.key === "Escape") onCancelEdit();
//             }}
//             autoFocus
//           />
//         ) : (
//           <span className="capitalize">{folder.name}</span>
//         )}
//       </div>

//       <div className="flex gap-2">
//         {isEditing ? (
//           <>
//             <button
//               onClick={() => onSaveEdit(folder._id)}
//               className="text-green-400 hover:text-green-300"
//               title="Save"
//             >
//               Save
//             </button>
//             <button
//               onClick={onCancelEdit}
//               className="text-yellow-400 hover:text-yellow-300"
//               title="Cancel"
//             >
//               Cancel
//             </button>
//           </>
//         ) : (
//           <>
//             <FaEdit size={18} className="cursor-pointer hover:text-yellow-400" onClick={() => onEdit(folder)} />
//             <FaTrash size={18} className="cursor-pointer hover:text-red-500" onClick={() => onDelete(folder)} />
//           </>
//         )}
//       </div>
//     </li>
//   );
// }

// export default function AdminPanel({ onLogout }) {
//   const [folders, setFolders] = useState([]);
//   const [selected, setSelected] = useState(null);
//   // keep token state only as convenience; requests always read from localStorage
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [view, setView] = useState("folders"); // "folders" or "feedback"

//   const API_URL = "https://kooyapady-admin-backend-rtb2.onrender.com/api";
//   const AUTH_API = "https://kooyapady-admin-backend.onrender.com/api/auth";

//   // Add folder UI state
//   const [adding, setAdding] = useState(false);
//   const [newFolderName, setNewFolderName] = useState("");

//   // Edit folder UI state
//   const [editingFolderId, setEditingFolderId] = useState(null);
//   const [editingFolderName, setEditingFolderName] = useState("");

//   // Upload UI state (kept for file input area)
//   const [uploadFiles, setUploadFiles] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const fileInputRef = useRef(null);

//   // Create-admin UI state
//   const [newAdminEmail, setNewAdminEmail] = useState("");
//   const [newAdminPassword, setNewAdminPassword] = useState("");
//   const [newAdminConfirm, setNewAdminConfirm] = useState("");
//   const [creatingAdmin, setCreatingAdmin] = useState(false);
//   const [createAdminMsg, setCreateAdminMsg] = useState("");
//   const [createAdminErr, setCreateAdminErr] = useState("");

//   useEffect(() => {
//     // ensure token exists on mount; otherwise force logout
//     const t = localStorage.getItem("token");
//     if (!t) {
//       onLogout();
//       return;
//     }
//     setToken(t);
//     // fetch folders once we know token exists
//     fetchFolders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Always read token from localStorage at request time to avoid stale closures.
//   const getAuthHeader = () => {
//     const t = localStorage.getItem("token");
//     return t ? { Authorization: `Bearer ${t}` } : {};
//   };

//   const fetchFolders = async () => {
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, { headers });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders(data);
//       } else {
//         // for folder fetch, a 401/403 indicates token invalid -> logout
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error(data.message);
//         }
//       }
//     } catch (err) {
//       console.error("Fetch folders error:", err);
//     }
//   };

//   // Add folder
//   const addFolder = async () => {
//     const name = newFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => [...prev, data]);
//         setNewFolderName("");
//         setAdding(false);
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Add folder failed:", data.message);
//           alert(data.message || "Failed to add folder");
//         }
//       }
//     } catch (err) {
//       console.error("Add folder error:", err);
//     }
//   };

//   // Edit flow
//   const startEditFolder = (folder) => {
//     // defensive: folder may have _id or id
//     setEditingFolderId(folder._id || folder.id);
//     setEditingFolderName(folder.name);
//   };

//   const cancelEdit = () => {
//     setEditingFolderId(null);
//     setEditingFolderName("");
//   };

//   const submitEditFolder = async (folderId) => {
//     const name = editingFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folderId}`, {
//         method: "PUT",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => prev.map((f) => (f._id === folderId ? data : f)));
//         if (selected && selected._id === folderId) setSelected(data);
//         setEditingFolderId(null);
//         setEditingFolderName("");
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Edit folder failed:", data.message);
//           alert(data.message || "Failed to edit folder");
//         }
//       }
//     } catch (err) {
//       console.error("Edit folder error:", err);
//     }
//   };

//   const deleteFolder = async (folder) => {
//     if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folder._id}`, {
//         method: "DELETE",
//         headers,
//       });
//       if (res.ok) {
//         setFolders((prev) => prev.filter((f) => f._id !== folder._id));
//         if (selected && selected._id === folder._id) setSelected(null);
//       } else {
//         const data = await res.json();
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           alert(data.message || "Delete failed");
//         }
//       }
//     } catch (err) {
//       console.error("Delete folder error:", err);
//     }
//   };

//   // File input helper
//   const onFileChange = (e) => {
//     setUploadFiles(Array.from(e.target.files || []));
//   };

//   const handleUpload = async () => {
//     if (!uploadFiles.length || !selected) return alert("Select a folder and at least one file.");
//     setUploading(true);
//     const formData = new FormData();
//     for (let file of uploadFiles) formData.append("file", file);

//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/${selected._id}`, {
//         method: "POST",
//         headers,
//         body: formData,
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//           return;
//         }
//         alert(data.message || "Upload failed");
//         console.error("Upload failed:", data);
//         return;
//       }

//       let uploadedImages = [];
//       let uploadedVideos = [];

//       if (Array.isArray(data.uploaded)) uploadedImages = data.uploaded;
//       else if (data.uploaded && typeof data.uploaded === "object") {
//         uploadedImages = Array.isArray(data.uploaded.images) ? data.uploaded.images : [];
//         uploadedVideos = Array.isArray(data.uploaded.videos) ? data.uploaded.videos : [];
//       } else {
//         uploadedImages = Array.isArray(data.images) ? data.images : [];
//         uploadedVideos = Array.isArray(data.videos) ? data.videos : [];
//       }

//       const updatedSelected = {
//         ...selected,
//         images: [...(selected.images || []), ...uploadedImages],
//         videos: [...(selected.videos || []), ...uploadedVideos],
//       };

//       setSelected(updatedSelected);
//       setFolders((prev) => prev.map((f) => (f._id === selected._id ? updatedSelected : f)));

//       setUploadFiles([]);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Upload error. Check console.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // -------------- DnD setup for folders --------------
//   const sensors = useSensors(
//     useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
//     useSensor(KeyboardSensor)
//   );

//   const onFoldersDragEnd = async (event) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const oldIndex = folders.findIndex((f) => f._id === active.id);
//     const newIndex = folders.findIndex((f) => f._id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newFolders = arrayMove(folders, oldIndex, newIndex);
//     setFolders(newFolders); // optimistic

//     const folderIds = newFolders.map((f) => f._id);

//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/reorder-folders`, {
//         method: "PATCH",
//         headers,
//         body: JSON.stringify({ folderIds }),
//       });
//       if (!res.ok) {
//         console.error("Reorder folders failed:", await res.text());
//         await fetchFolders(); // revert by refetching
//       } else {
//         const resultData = await res.json().catch(() => null);
//         if (resultData && Array.isArray(resultData.folders)) setFolders(resultData.folders);
//       }
//     } catch (err) {
//       console.error("Reorder folders error:", err);
//       await fetchFolders();
//     }
//   };

//   // Create admin handler
//   const handleCreateAdmin = async (e) => {
//     e.preventDefault();
//     setCreateAdminMsg("");
//     setCreateAdminErr("");

//     const email = newAdminEmail?.trim();
//     const password = newAdminPassword;
//     const confirm = newAdminConfirm;

//     if (!email || !password || !confirm) {
//       setCreateAdminErr("All fields are required.");
//       return;
//     }
//     if (password.length < 8) {
//       setCreateAdminErr("Password must be at least 8 characters.");
//       return;
//     }
//     if (password !== confirm) {
//       setCreateAdminErr("Passwords do not match.");
//       return;
//     }

//     setCreatingAdmin(true);
//     try {
//       // read token fresh from localStorage
//       const t = localStorage.getItem("token");
//       if (!t) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${AUTH_API}/create-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${t}`,
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       // For create-admin: don't force immediate logout on 401/403.
//       // Instead show a clear error so the admin can retry / refresh token.
//       if (res.status === 401 || res.status === 403) {
//         const body = await res.json().catch(() => ({}));
//         setCreateAdminErr(body.message || "Unauthorized — your token may be expired or you lack permission.");
//         setCreatingAdmin(false);
//         return;
//       }

//       const data = await res.json();

//       if (res.ok) {
//         setCreateAdminMsg(`Admin created: ${data.admin?.email ?? email}`);
//         setNewAdminEmail("");
//         setNewAdminPassword("");
//         setNewAdminConfirm("");
//       } else {
//         setCreateAdminErr(data.message || "Failed to create admin.");
//       }
//     } catch (err) {
//       console.error("Create admin error:", err);
//       setCreateAdminErr("Something went wrong. Try again.");
//     } finally {
//       setCreatingAdmin(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     setToken(null);
//     onLogout();
//   };

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Navbar */}
//       <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white flex justify-between items-center px-6 py-6 shadow-md z-10">
//         <h1 className="text-xl font-bold">Koovappady's Kshemalayam</h1>
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={handleLogout}
//             className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
//           >
//             Logout
//           </button>
//           <FaUserCircle size={28} className="cursor-pointer hover:text-gray-300" />
//         </div>
//       </nav>

//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <div className="w-74 overflow-hidden bg-gray-800 text-white py-6">
//           <h2 className="text-xl font-semibold mt-16 text-center mb-4">Image Folders</h2>

//           {/* Draggable list of folders */}
//           <div className="px-6">
//             <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFoldersDragEnd}>
//               <SortableContext items={folders.map((f) => f._id)} strategy={verticalListSortingStrategy}>
//                 <ul className="space-y-2">
//                   {folders.map((f) => (
//                     <SortableFolderItem
//                       key={f._id}
//                       folder={f}
//                       selected={selected && selected._id === f._id}
//                       onClick={(folder) => {
//                         setView("folders");
//                         setSelected(folder);
//                       }}
//                       onEdit={(folder) => startEditFolder(folder)}
//                       onDelete={(folder) => deleteFolder(folder)}
//                       // editing props
//                       editingFolderId={editingFolderId}
//                       editingFolderName={editingFolderName}
//                       setEditingFolderName={setEditingFolderName}
//                       onSaveEdit={submitEditFolder}
//                       onCancelEdit={cancelEdit}
//                     />
//                   ))}
//                 </ul>
//               </SortableContext>
//             </DndContext>
//           </div>

//           {/* Add folder input + button */}
//           <div className="mt-4 ml-6 mr-6 w-62">
//             {!adding ? (
//               <button onClick={() => setAdding(true)} className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700">
//                 + Add Folder
//               </button>
//             ) : (
//               <div className="flex gap-2">
//                 <input
//                   className="flex-1 p-2 rounded text-black"
//                   placeholder="Folder name"
//                   value={newFolderName}
//                   onChange={(e) => setNewFolderName(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter") addFolder();
//                     if (e.key === "Escape") {
//                       setAdding(false);
//                       setNewFolderName("");
//                     }
//                   }}
//                   autoFocus
//                 />
//                 <button onClick={addFolder} className="bg-green-600 px-3 py-2 rounded hover:bg-green-700">
//                   Add
//                 </button>
//                 <button
//                   onClick={() => {
//                     setAdding(false);
//                     setNewFolderName("");
//                   }}
//                   className="bg-gray-600 px-3 py-2 rounded hover:bg-gray-500"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             )}
//           </div>

//           {/* Feedback nav item */}
//           <div className="mt-6 ml-6 mr-6">
//             <button
//               onClick={() => {
//                 setSelected(null);
//                 setView("feedback");
//               }}
//               className={`w-full flex items-center gap-2 px-4 py-2 rounded ${view === "feedback" ? "bg-gray-700" : "bg-gray-600 hover:bg-gray-700"}`}
//             >
//               <FaCommentDots size={18} />
//               <span>Feedback</span>
//             </button>
//           </div>

//           {/* Create Admin section (protected) */}
//           <div className="mt-6 ml-6 mr-6">
//             <div className="bg-gray-700 p-3 rounded">
//               <h3 className="font-semibold mb-2 text-sm">Create Admin</h3>

//               {createAdminMsg && <div className="text-green-300 text-sm mb-2">{createAdminMsg}</div>}
//               {createAdminErr && <div className="text-red-300 text-sm mb-2">{createAdminErr}</div>}

//               <form onSubmit={handleCreateAdmin} className="space-y-2">
//                 <input
//                   type="email"
//                   placeholder="New admin email"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminEmail}
//                   onChange={(e) => setNewAdminEmail(e.target.value)}
//                   required
//                 />
//                 <input
//                   type="password"
//                   placeholder="Password (min 8 chars)"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminPassword}
//                   onChange={(e) => setNewAdminPassword(e.target.value)}
//                   required
//                 />
//                 <input
//                   type="password"
//                   placeholder="Confirm password"
//                   className="w-full p-2 rounded text-black"
//                   value={newAdminConfirm}
//                   onChange={(e) => setNewAdminConfirm(e.target.value)}
//                   required
//                 />
//                 <button
//                   type="submit"
//                   disabled={creatingAdmin}
//                   className={`w-full py-2 rounded ${creatingAdmin ? "bg-gray-500" : "bg-green-600 hover:bg-green-700"}`}
//                 >
//                   {creatingAdmin ? "Creating..." : "Create Admin"}
//                 </button>
//               </form>

//               <p className="text-xs text-gray-300 mt-2">
//                 Only an authenticated admin can create another admin. If your token expires you'll be logged out.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 py-16 px-8 bg-gray-100">
//           {view === "folders" ? (
//             <>
//               <h1 className="text-2xl text-center py-4 mt-4 font-bold mb-4">
//                 Folder: {selected ? selected.name : "No Folder Selected"}
//               </h1>

//               {selected && (
//                 <>
//                   {/* File selector + upload button */}
//                   <div className="mb-4 flex gap-2 items-center">
//                     <input ref={fileInputRef} type="file" multiple className="block w-full border border-gray-400 rounded p-2" onChange={onFileChange} />
//                     <button onClick={handleUpload} disabled={uploading} className={`px-4 py-2 rounded ${uploading ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}>
//                       {uploading ? "Uploading..." : "Upload"}
//                     </button>
//                   </div>

//                   <FolderImages folderId={selected._id} token={localStorage.getItem("token")} />
//                 </>
//               )}
//             </>
//           ) : (
//             <FeedbackList token={localStorage.getItem("token")} />
//           )}
//          </div> 
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect, useRef } from "react";
// import { FaUserCircle, FaFolder, FaEdit, FaTrash, FaCommentDots, FaPlus, FaUpload, FaSignOutAlt, FaCog } from "react-icons/fa";
// import FolderImages from "./FolderImages";
// import FeedbackList from "./FeedbackList";

// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
// } from "@dnd-kit/core";

// import {
//   arrayMove,
//   SortableContext,
//   useSortable,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";

// import { CSS } from "@dnd-kit/utilities";

// function SortableFolderItem({
//   folder,
//   selected,
//   onClick,
//   onEdit,
//   onDelete,
//   editingFolderId,
//   editingFolderName,
//   setEditingFolderName,
//   onSaveEdit,
//   onCancelEdit,
// }) {
//   const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder._id });
//   const style = {
//     transform: CSS.Transform.toString(transform),
//     transition,
//     userSelect: "none",
//   };

//   const isEditing = editingFolderId === folder._id;
//   const isSelected = selected && selected._id === folder._id;

//   return (
//     <li
//       ref={setNodeRef}
//       style={style}
//       {...attributes}
//       {...listeners}
//       className={`group p-3 flex justify-between items-center rounded-lg cursor-pointer transition-all duration-200 ${
//         isDragging 
//           ? "bg-indigo-100 border-2 border-dashed border-indigo-400 shadow-lg" 
//           : isSelected
//           ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
//           : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
//       }`}
//     >
//       <div className="flex gap-3 items-center flex-1" onClick={() => !isEditing && onClick(folder)}>
//         <FaFolder 
//           size={20} 
//           className={isSelected ? "text-white" : "text-indigo-500"} 
//         />
//         {isEditing ? (
//           <input
//             className="text-gray-800 rounded-lg px-3 py-2 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
//             value={editingFolderName}
//             onChange={(e) => setEditingFolderName(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") onSaveEdit(folder._id);
//               if (e.key === "Escape") onCancelEdit();
//             }}
//             autoFocus
//           />
//         ) : (
//           <span className="capitalize font-medium">{folder.name}</span>
//         )}
//       </div>

//       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//         {isEditing ? (
//           <>
//             <button
//               onClick={() => onSaveEdit(folder._id)}
//               className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded-lg transition-colors"
//               title="Save"
//             >
//               Save
//             </button>
//             <button
//               onClick={onCancelEdit}
//               className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 p-2 rounded-lg transition-colors"
//               title="Cancel"
//             >
//               Cancel
//             </button>
//           </>
//         ) : (
//           <>
//             <button
//               onClick={() => onEdit(folder)}
//               className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
//               title="Edit"
//             >
//               <FaEdit size={16} />
//             </button>
//             <button
//               onClick={() => onDelete(folder)}
//               className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
//               title="Delete"
//             >
//               <FaTrash size={16} />
//             </button>
//           </>
//         )}
//       </div>
//     </li>
//   );
// }

// export default function AdminPanel({ onLogout }) {
//   const [folders, setFolders] = useState([]);
//   const [selected, setSelected] = useState(null);
//   // keep token state only as convenience; requests always read from localStorage
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [view, setView] = useState("folders"); // "folders" or "feedback"

//   const API_URL = "https://kooyapady-admin-backend-rtb2.onrender.com/api";
//   const AUTH_API = "https://kooyapady-admin-backend.onrender.com/api/auth";

//   // Add folder UI state
//   const [adding, setAdding] = useState(false);
//   const [newFolderName, setNewFolderName] = useState("");

//   // Edit folder UI state
//   const [editingFolderId, setEditingFolderId] = useState(null);
//   const [editingFolderName, setEditingFolderName] = useState("");

//   // Upload UI state (kept for file input area)
//   const [uploadFiles, setUploadFiles] = useState([]);
//   const [uploading, setUploading] = useState(false);
//   const fileInputRef = useRef(null);

//   // Create-admin UI state
//   const [newAdminEmail, setNewAdminEmail] = useState("");
//   const [newAdminPassword, setNewAdminPassword] = useState("");
//   const [newAdminConfirm, setNewAdminConfirm] = useState("");
//   const [creatingAdmin, setCreatingAdmin] = useState(false);
//   const [createAdminMsg, setCreateAdminMsg] = useState("");
//   const [createAdminErr, setCreateAdminErr] = useState("");

//   // Forgot / Reset password UI state (immediate-reset flow)
//   const [forgotEmail, setForgotEmail] = useState("");
//   const [forgotMsg, setForgotMsg] = useState("");
//   const [forgotErr, setForgotErr] = useState("");
//   const [sendingForgot, setSendingForgot] = useState(false);

//   // Reuse these states for entering the new password in immediate flow
//   const [resetNewPassword, setResetNewPassword] = useState("");
//   const [resetConfirm, setResetConfirm] = useState("");
//   const [resetting, setResetting] = useState(false);
//   const [resetMsg, setResetMsg] = useState("");
//   const [resetErr, setResetErr] = useState("");

//   useEffect(() => {
//     // ensure token exists on mount; otherwise force logout
//     const t = localStorage.getItem("token");
//     if (!t) {
//       onLogout();
//       return;
//     }
//     setToken(t);
//     // fetch folders once we know token exists
//     fetchFolders();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Always read token from localStorage at request time to avoid stale closures.
//   const getAuthHeader = () => {
//     const t = localStorage.getItem("token");
//     return t ? { Authorization: `Bearer ${t}` } : {};
//   };

//   const fetchFolders = async () => {
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, { headers });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders(data);
//       } else {
//         // for folder fetch, a 401/403 indicates token invalid -> logout
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error(data.message);
//         }
//       }
//     } catch (err) {
//       console.error("Fetch folders error:", err);
//     }
//   };

//   // Add folder
//   const addFolder = async () => {
//     const name = newFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders`, {
//         method: "POST",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => [...prev, data]);
//         setNewFolderName("");
//         setAdding(false);
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Add folder failed:", data.message);
//           alert(data.message || "Failed to add folder");
//         }
//       }
//     } catch (err) {
//       console.error("Add folder error:", err);
//     }
//   };

//   // Edit flow
//   const startEditFolder = (folder) => {
//     // defensive: folder may have _id or id
//     setEditingFolderId(folder._id || folder.id);
//     setEditingFolderName(folder.name);
//   };

//   const cancelEdit = () => {
//     setEditingFolderId(null);
//     setEditingFolderName("");
//   };

//   const submitEditFolder = async (folderId) => {
//     const name = editingFolderName?.trim();
//     if (!name) return;
//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folderId}`, {
//         method: "PUT",
//         headers,
//         body: JSON.stringify({ name }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setFolders((prev) => prev.map((f) => (f._id === folderId ? data : f)));
//         if (selected && selected._id === folderId) setSelected(data);
//         setEditingFolderId(null);
//         setEditingFolderName("");
//       } else {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           console.error("Edit folder failed:", data.message);
//           alert(data.message || "Failed to edit folder");
//         }
//       }
//     } catch (err) {
//       console.error("Edit folder error:", err);
//     }
//   };

//   const deleteFolder = async (folder) => {
//     if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/folders/${folder._id}`, {
//         method: "DELETE",
//         headers,
//       });
//       if (res.ok) {
//         setFolders((prev) => prev.filter((f) => f._id !== folder._id));
//         if (selected && selected._id === folder._id) setSelected(null);
//       } else {
//         const data = await res.json();
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//         } else {
//           alert(data.message || "Delete failed");
//         }
//       }
//     } catch (err) {
//       console.error("Delete folder error:", err);
//     }
//   };

//   // File input helper
//   const onFileChange = (e) => {
//     setUploadFiles(Array.from(e.target.files || []));
//   };

//   const handleUpload = async () => {
//     if (!uploadFiles.length || !selected) return alert("Select a folder and at least one file.");
//     setUploading(true);
//     const formData = new FormData();
//     for (let file of uploadFiles) formData.append("file", file);

//     try {
//       const headers = getAuthHeader();
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/${selected._id}`, {
//         method: "POST",
//         headers,
//         body: formData,
//       });
//       const data = await res.json();
//       if (!res.ok) {
//         if (res.status === 401 || res.status === 403) {
//           handleLogout();
//           return;
//         }
//         alert(data.message || "Upload failed");
//         console.error("Upload failed:", data);
//         return;
//       }

//       let uploadedImages = [];
//       let uploadedVideos = [];

//       if (Array.isArray(data.uploaded)) uploadedImages = data.uploaded;
//       else if (data.uploaded && typeof data.uploaded === "object") {
//         uploadedImages = Array.isArray(data.uploaded.images) ? data.uploaded.images : [];
//         uploadedVideos = Array.isArray(data.uploaded.videos) ? data.uploaded.videos : [];
//       } else {
//         uploadedImages = Array.isArray(data.images) ? data.images : [];
//         uploadedVideos = Array.isArray(data.videos) ? data.videos : [];
//       }

//       const updatedSelected = {
//         ...selected,
//         images: [...(selected.images || []), ...uploadedImages],
//         videos: [...(selected.videos || []), ...uploadedVideos],
//       };

//       setSelected(updatedSelected);
//       setFolders((prev) => prev.map((f) => (f._id === selected._id ? updatedSelected : f)));

//       setUploadFiles([]);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Upload error. Check console.");
//     } finally {
//       setUploading(false);
//     }
//   };

//   // -------------- DnD setup for folders --------------
//   const sensors = useSensors(
//     useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
//     useSensor(KeyboardSensor)
//   );

//   const onFoldersDragEnd = async (event) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;

//     const oldIndex = folders.findIndex((f) => f._id === active.id);
//     const newIndex = folders.findIndex((f) => f._id === over.id);
//     if (oldIndex === -1 || newIndex === -1) return;

//     const newFolders = arrayMove(folders, oldIndex, newIndex);
//     setFolders(newFolders); // optimistic

//     const folderIds = newFolders.map((f) => f._id);

//     try {
//       const headers = { "Content-Type": "application/json", ...getAuthHeader() };
//       if (!headers.Authorization) {
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${API_URL}/upload/reorder-folders`, {
//         method: "PATCH",
//         headers,
//         body: JSON.stringify({ folderIds }),
//       });
//       if (!res.ok) {
//         console.error("Reorder folders failed:", await res.text());
//         await fetchFolders(); // revert by refetching
//       } else {
//         const resultData = await res.json().catch(() => null);
//         if (resultData && Array.isArray(resultData.folders)) setFolders(resultData.folders);
//       }
//     } catch (err) {
//       console.error("Reorder folders error:", err);
//       await fetchFolders();
//     }
//   };

//   // Create admin handler
//   const handleCreateAdmin = async (e) => {
//     e.preventDefault();
//     setCreateAdminMsg("");
//     setCreateAdminErr("");

//     const email = newAdminEmail?.trim();
//     const password = newAdminPassword;
//     const confirm = newAdminConfirm;

//     if (!email || !password || !confirm) {
//       setCreateAdminErr("All fields are required.");
//       return;
//     }
//     if (password.length < 8) {
//       setCreateAdminErr("Password must be at least 8 characters.");
//       return;
//     }
//     if (password !== confirm) {
//       setCreateAdminErr("Passwords do not match.");
//       return;
//     }

//     setCreatingAdmin(true);
//     try {
//       // read token fresh from localStorage
//       const t = localStorage.getItem("token");
//       if (!t) {
//         // no token -> force logout
//         handleLogout();
//         return;
//       }

//       const res = await fetch(`${AUTH_API}/create-admin`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${t}`,
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       // For create-admin: don't force immediate logout on 401/403.
//       // Instead show a clear error so the admin can retry / refresh token.
//       if (res.status === 401 || res.status === 403) {
//         const body = await res.json().catch(() => ({}));
//         setCreateAdminErr(body.message || "Unauthorized — your token may be expired or you lack permission.");
//         setCreatingAdmin(false);
//         return;
//       }

//       const data = await res.json();

//       if (res.ok) {
//         setCreateAdminMsg(`Admin created: ${data.admin?.email ?? email}`);
//         setNewAdminEmail("");
//         setNewAdminPassword("");
//         setNewAdminConfirm("");
//       } else {
//         setCreateAdminErr(data.message || "Failed to create admin.");
//       }
//     } catch (err) {
//       console.error("Create admin error:", err);
//       setCreateAdminErr("Something went wrong. Try again.");
//     } finally {
//       setCreatingAdmin(false);
//     }
//   };

//   // Immediate reset handler: send { email, newPassword } to server to update immediately
//   const handleImmediateResetSubmit = async (e) => {
//     e.preventDefault();
//     setForgotMsg("");
//     setForgotErr("");
//     setResetMsg("");
//     setResetErr("");

//     const email = forgotEmail?.trim();
//     const newPassword = resetNewPassword;
//     const confirm = resetConfirm;

//     if (!email) {
//       setForgotErr("Email is required.");
//       return;
//     }
//     if (!newPassword || !confirm) {
//       setForgotErr("New password and confirmation are required.");
//       return;
//     }
//     if (newPassword.length < 8) {
//       setForgotErr("Password must be at least 8 characters.");
//       return;
//     }
//     if (newPassword !== confirm) {
//       setForgotErr("Passwords do not match.");
//       return;
//     }

//     setSendingForgot(true);
//     try {
//       const res = await fetch(`${AUTH_API}/forgot-password`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, newPassword }),
//       });
//       const data = await res.json().catch(() => ({}));
//       if (res.ok) {
//         setForgotMsg("Password updated successfully. The user can now log in with the new password.");
//         setForgotEmail("");
//         setResetNewPassword("");
//         setResetConfirm("");
//       } else {
//         // show server-provided message or a fallback
//         setForgotErr(data.message || "Failed to update password.");
//       }
//     } catch (err) {
//       console.error("Immediate reset error:", err);
//       setForgotErr("Something went wrong. Try again.");
//     } finally {
//       setSendingForgot(false);
//     }
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     setToken(null);
//     onLogout();
//   };

//   return (
//     <div className="min-h-screen flex flex-col bg-gray-50">
//       {/* Modern Navbar */}
//       <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex justify-between items-center px-6 py-4 shadow-lg z-10">
//         <div className="flex items-center space-x-3">
//           <div className="bg-white bg-opacity-20 p-2 rounded-lg">
//             <FaCog className="text-white" size={20} />
//           </div>
//           <h1 className="text-xl font-bold">Koovappady's Kshemalayam Admin</h1>
//         </div>
//         <div className="flex items-center space-x-4">
//           <button
//             onClick={handleLogout}
//             className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
//           >
//             <FaSignOutAlt size={16} />
//             Logout
//           </button>
//           <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
//             <FaUserCircle size={24} className="text-white" />
//             <span className="text-sm font-medium">Admin</span>
//           </div>
//         </div>
//       </nav>

//       <div className="flex flex-1 pt-16">
//         {/* Modern Sidebar */}
//         <div className="w-80 bg-white border-r border-gray-200 py-6 shadow-sm">
//           <div className="px-6 mb-6">
//             <h2 className="text-lg font-semibold text-gray-800 mb-2">Content Management</h2>
//             <p className="text-sm text-gray-600">Manage your folders and media content</p>
//           </div>

//           {/* Navigation Tabs */}
//           <div className="flex border-b border-gray-200 px-6 mb-4">
//             <button
//               onClick={() => setView("folders")}
//               className={`flex-1 py-3 text-center font-medium transition-colors ${
//                 view === "folders" 
//                   ? "text-indigo-600 border-b-2 border-indigo-600" 
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Folders
//             </button>
//             <button
//               onClick={() => {
//                 setSelected(null);
//                 setView("feedback");
//               }}
//               className={`flex-1 py-3 text-center font-medium transition-colors ${
//                 view === "feedback" 
//                   ? "text-indigo-600 border-b-2 border-indigo-600" 
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               Feedback
//             </button>
//           </div>

//           {view === "folders" && (
//             <>
//               {/* Folder List Header */}
//               <div className="px-6 mb-4 flex justify-between items-center">
//                 <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Image Folders</h3>
//                 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
//                   {folders.length} folders
//                 </span>
//               </div>

//               {/* Draggable list of folders */}
//               <div className="px-6 mb-4">
//                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFoldersDragEnd}>
//                   <SortableContext items={folders.map((f) => f._id)} strategy={verticalListSortingStrategy}>
//                     <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
//                       {folders.length === 0 ? (
//                         <div className="text-center py-8 text-gray-500">
//                           <FaFolder className="mx-auto mb-2 text-gray-300" size={32} />
//                           <p className="text-sm">No folders yet</p>
//                         </div>
//                       ) : (
//                         folders.map((f) => (
//                           <SortableFolderItem
//                             key={f._id}
//                             folder={f}
//                             selected={selected}
//                             onClick={(folder) => {
//                               setView("folders");
//                               setSelected(folder);
//                             }}
//                             onEdit={(folder) => startEditFolder(folder)}
//                             onDelete={(folder) => deleteFolder(folder)}
//                             // editing props
//                             editingFolderId={editingFolderId}
//                             editingFolderName={editingFolderName}
//                             setEditingFolderName={setEditingFolderName}
//                             onSaveEdit={submitEditFolder}
//                             onCancelEdit={cancelEdit}
//                           />
//                         ))
//                       )}
//                     </ul>
//                   </SortableContext>
//                 </DndContext>
//               </div>

//               {/* Add folder section */}
//               <div className="px-6 mt-6">
//                 {!adding ? (
//                   <button 
//                     onClick={() => setAdding(true)} 
//                     className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-3 rounded-lg border-2 border-dashed border-indigo-200 hover:border-indigo-300 transition-all duration-200 font-medium"
//                   >
//                     <FaPlus size={14} />
//                     Add New Folder
//                   </button>
//                 ) : (
//                   <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//                     <h4 className="text-sm font-medium text-gray-700 mb-2">Create New Folder</h4>
//                     <div className="space-y-3">
//                       <input
//                         className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
//                         placeholder="Enter folder name"
//                         value={newFolderName}
//                         onChange={(e) => setNewFolderName(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") addFolder();
//                           if (e.key === "Escape") {
//                             setAdding(false);
//                             setNewFolderName("");
//                           }
//                         }}
//                         autoFocus
//                       />
//                       <div className="flex gap-2">
//                         <button 
//                           onClick={addFolder} 
//                           className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
//                         >
//                           Create
//                         </button>
//                         <button
//                           onClick={() => {
//                             setAdding(false);
//                             setNewFolderName("");
//                           }}
//                           className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//                         >
//                           Cancel
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </>
//           )}

//           {/* Create Admin section */}
//           <div className="mt-8 px-6">
//             <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
//               <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                 <FaUserCircle className="text-indigo-500" />
//                 Create Admin Account
//               </h3>

//               {createAdminMsg && (
//                 <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-sm border border-green-200">
//                   {createAdminMsg}
//                 </div>
//               )}
//               {createAdminErr && (
//                 <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm border border-red-200">
//                   {createAdminErr}
//                 </div>
//               )}

//               <form onSubmit={handleCreateAdmin} className="space-y-3">
//                 <div>
//                   <input
//                     type="email"
//                     placeholder="Admin email address"
//                     className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                     value={newAdminEmail}
//                     onChange={(e) => setNewAdminEmail(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <input
//                     type="password"
//                     placeholder="Password (min 8 characters)"
//                     className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                     value={newAdminPassword}
//                     onChange={(e) => setNewAdminPassword(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div>
//                   <input
//                     type="password"
//                     placeholder="Confirm password"
//                     className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                     value={newAdminConfirm}
//                     onChange={(e) => setNewAdminConfirm(e.target.value)}
//                     required
//                   />
//                 </div>
//                 <button
//                   type="submit"
//                   disabled={creatingAdmin}
//                   className={`w-full py-3 rounded-lg font-medium transition-all ${
//                     creatingAdmin 
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
//                       : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md"
//                   }`}
//                 >
//                   {creatingAdmin ? "Creating Admin..." : "Create Admin Account"}
//                 </button>
//               </form>

//               <p className="text-xs text-gray-500 mt-3 text-center">
//                 Only authenticated admins can create new admin accounts
//               </p>

//               {/* Forgot password and immediate Reset password UI */}
//               <div className="mt-4 border-t pt-4">
//                 <h4 className="text-sm font-medium text-gray-700 mb-2">Reset Password (by email)</h4>

//                 {/* Immediate reset form: provide email + new password -> server updates immediately */}
//                 <form onSubmit={handleImmediateResetSubmit} className="space-y-2 mb-3">
//                   <div>
//                     <input
//                       type="email"
//                       placeholder="Enter admin email"
//                       className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                       value={forgotEmail}
//                       onChange={(e) => setForgotEmail(e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <input
//                       type="password"
//                       placeholder="New password (min 8 chars)"
//                       className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                       value={resetNewPassword}
//                       onChange={(e) => setResetNewPassword(e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <input
//                       type="password"
//                       placeholder="Confirm new password"
//                       className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
//                       value={resetConfirm}
//                       onChange={(e) => setResetConfirm(e.target.value)}
//                     />
//                   </div>

//                   <div className="flex gap-2">
//                     <button
//                       type="submit"
//                       disabled={sendingForgot}
//                       className={`flex-1 py-2 rounded-lg font-medium transition-all ${
//                         sendingForgot
//                           ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                           : "bg-green-600 text-white hover:bg-green-700"
//                       }`}
//                     >
//                       {sendingForgot ? "Updating..." : "Update Password"}
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => { setForgotEmail(""); setResetNewPassword(""); setResetConfirm(""); setForgotMsg(""); setForgotErr(""); setResetMsg(""); setResetErr(""); }}
//                       className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
//                     >
//                       Clear
//                     </button>
//                   </div>
//                 </form>

//                 {forgotMsg && <div className="text-sm text-green-700 mb-2">{forgotMsg}</div>}
//                 {forgotErr && <div className="text-sm text-red-700 mb-2">{forgotErr}</div>}
//                 {resetMsg && <div className="text-sm text-green-700 mb-2">{resetMsg}</div>}
//                 {resetErr && <div className="text-sm text-red-700 mb-2">{resetErr}</div>}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Modern Main Content */}
//         <div className="flex-1 py-6 px-8 bg-gray-50">
//           {view === "folders" ? (
//             <>
//               <div className="max-w-7xl mx-auto">
//                 {/* Header Section */}
//                 <div className="mb-8">
//                   <div className="flex justify-between items-center mb-2">
//                     <h1 className="text-2xl font-bold text-gray-900">
//                       {selected ? selected.name : "Select a Folder"}
//                     </h1>
//                     {selected && (
//                       <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
//                         {selected.images?.length || 0} images
//                       </div>
//                     )}
//                   </div>
//                   <p className="text-gray-600">
//                     {selected 
//                       ? "Manage images and content in this folder" 
//                       : "Choose a folder from the sidebar to get started"}
//                   </p>
//                 </div>

//                 {selected && (
//                   <>
//                     {/* Upload Section */}
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
//                       <div className="flex items-center gap-3 mb-4">
//                         <div className="bg-indigo-100 p-2 rounded-lg">
//                           <FaUpload className="text-indigo-600" size={18} />
//                         </div>
//                         <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
//                       </div>
                      
//                       <div className="flex gap-4 items-end">
//                         <div className="flex-1">
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Select files to upload
//                           </label>
//                           <input 
//                             ref={fileInputRef} 
//                             type="file" 
//                             multiple 
//                             className="block w-full border border-gray-300 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
//                             onChange={onFileChange} 
//                           />
//                         </div>
//                         <button 
//                           onClick={handleUpload} 
//                           disabled={uploading || !uploadFiles.length}
//                           className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
//                             uploading || !uploadFiles.length
//                               ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                               : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md"
//                           }`}
//                         >
//                           {uploading ? (
//                             <>
//                               <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
//                               Uploading...
//                             </>
//                           ) : (
//                             <>
//                               <FaUpload size={16} />
//                               Upload {uploadFiles.length > 0 && `(${uploadFiles.length})`}
//                             </>
//                           )}
//                         </button>
//                       </div>
//                       {uploadFiles.length > 0 && (
//                         <p className="text-sm text-gray-600 mt-3">
//                           Selected {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
//                         </p>
//                       )}
//                     </div>

//                     {/* Folder Images Component */}
//                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                       <FolderImages folderId={selected._id} token={localStorage.getItem("token")} />
//                     </div>
//                   </>
//                 )}
//               </div>
//             </>
//           ) : (
//             <div className="max-w-7xl mx-auto">
//               <div className="mb-8">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-2">User Feedback</h1>
//                 <p className="text-gray-600">Review and manage feedback from users</p>
//               </div>
//               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//                 <FeedbackList token={localStorage.getItem("token")} />
//               </div>
//             </div>
//           )}
//          </div> 
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaFolder, FaEdit, FaTrash, FaCommentDots, FaPlus, FaUpload, FaSignOutAlt, FaCog } from "react-icons/fa";
import FolderImages from "./FolderImages";
import FeedbackList from "./FeedbackList";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

function SortableFolderItem({
  folder,
  selected,
  onClick,
  onEdit,
  onDelete,
  editingFolderId,
  editingFolderName,
  setEditingFolderName,
  onSaveEdit,
  onCancelEdit,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: folder._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    userSelect: "none",
  };

  const isEditing = editingFolderId === folder._id;
  const isSelected = selected && selected._id === folder._id;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group p-3 flex flex-col rounded-lg cursor-pointer transition-all duration-200 ${
        isDragging 
          ? "bg-indigo-100 border-2 border-dashed border-indigo-400 shadow-lg" 
          : isSelected
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
          : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      <div className="flex gap-3 items-center flex-1" onClick={() => !isEditing && onClick(folder)}>
        <FaFolder 
          size={20} 
          className={isSelected ? "text-white" : "text-indigo-500"} 
        />
        {isEditing ? (
          <div className="flex-1">
            <input
              className="w-full text-gray-800 rounded-lg px-3 py-2 border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
              value={editingFolderName}
              onChange={(e) => setEditingFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(folder._id);
                if (e.key === "Escape") onCancelEdit();
              }}
              autoFocus
            />
          </div>
        ) : (
          <span className="capitalize font-medium flex-1">{folder.name}</span>
        )}
        
        {/* Edit and Delete buttons - only show when NOT editing */}
        {!isEditing && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(folder)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
              title="Edit"
            >
              <FaEdit size={16} />
            </button>
            <button
              onClick={() => onDelete(folder)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
              title="Delete"
            >
              <FaTrash size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Save and Cancel buttons - only show when editing and positioned below */}
      {isEditing && (
        <div className="flex gap-2 justify-end mt-3">
          <button
            onClick={() => onSaveEdit(folder._id)}
            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg transition-colors font-medium"
            title="Save"
          >
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-4 py-2 rounded-lg transition-colors font-medium"
            title="Cancel"
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}

export default function AdminPanel({ onLogout }) {
  const [folders, setFolders] = useState([]);
  const [selected, setSelected] = useState(null);
  // keep token state only as convenience; requests always read from localStorage
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState("folders"); // "folders" or "feedback"

  const API_URL = "https://kooyapady-admin-backend-rtb2.onrender.com/api";
  const AUTH_API = "https://kooyapady-admin-backend.onrender.com/api/auth";

  // Add folder UI state
  const [adding, setAdding] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Edit folder UI state
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  // Upload UI state (kept for file input area)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Create-admin UI state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminConfirm, setNewAdminConfirm] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [createAdminMsg, setCreateAdminMsg] = useState("");
  const [createAdminErr, setCreateAdminErr] = useState("");

  // Forgot / Reset password UI state (immediate-reset flow)
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [sendingForgot, setSendingForgot] = useState(false);

  // Reuse these states for entering the new password in immediate flow
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  useEffect(() => {
    // ensure token exists on mount; otherwise force logout
    const t = localStorage.getItem("token");
    if (!t) {
      onLogout();
      return;
    }
    setToken(t);
    // fetch folders once we know token exists
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always read token from localStorage at request time to avoid stale closures.
  const getAuthHeader = () => {
    const t = localStorage.getItem("token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

  const fetchFolders = async () => {
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        // no token -> force logout
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/folders`, { headers });
      const data = await res.json();
      if (res.ok) {
        setFolders(data);
      } else {
        // for folder fetch, a 401/403 indicates token invalid -> logout
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        } else {
          console.error(data.message);
        }
      }
    } catch (err) {
      console.error("Fetch folders error:", err);
    }
  };

  // Add folder
  const addFolder = async () => {
    const name = newFolderName?.trim();
    if (!name) return;
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeader() };
      if (!headers.Authorization) {
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/folders`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => [...prev, data]);
        setNewFolderName("");
        setAdding(false);
      } else {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        } else {
          console.error("Add folder failed:", data.message);
          alert(data.message || "Failed to add folder");
        }
      }
    } catch (err) {
      console.error("Add folder error:", err);
    }
  };

  // Edit flow
  const startEditFolder = (folder) => {
    // defensive: folder may have _id or id
    setEditingFolderId(folder._id || folder.id);
    setEditingFolderName(folder.name);
  };

  const cancelEdit = () => {
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const submitEditFolder = async (folderId) => {
    const name = editingFolderName?.trim();
    if (!name) return;
    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeader() };
      if (!headers.Authorization) {
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/folders/${folderId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders((prev) => prev.map((f) => (f._id === folderId ? data : f)));
        if (selected && selected._id === folderId) setSelected(data);
        setEditingFolderId(null);
        setEditingFolderName("");
      } else {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        } else {
          console.error("Edit folder failed:", data.message);
          alert(data.message || "Failed to edit folder");
        }
      }
    } catch (err) {
      console.error("Edit folder error:", err);
    }
  };

  const deleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/folders/${folder._id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setFolders((prev) => prev.filter((f) => f._id !== folder._id));
        if (selected && selected._id === folder._id) setSelected(null);
      } else {
        const data = await res.json();
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        } else {
          alert(data.message || "Delete failed");
        }
      }
    } catch (err) {
      console.error("Delete folder error:", err);
    }
  };

  // File input helper
  const onFileChange = (e) => {
    setUploadFiles(Array.from(e.target.files || []));
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || !selected) return alert("Select a folder and at least one file.");
    setUploading(true);
    const formData = new FormData();
    for (let file of uploadFiles) formData.append("file", file);

    try {
      const headers = getAuthHeader();
      if (!headers.Authorization) {
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/upload/${selected._id}`, {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
          return;
        }
        alert(data.message || "Upload failed");
        console.error("Upload failed:", data);
        return;
      }

      let uploadedImages = [];
      let uploadedVideos = [];

      if (Array.isArray(data.uploaded)) uploadedImages = data.uploaded;
      else if (data.uploaded && typeof data.uploaded === "object") {
        uploadedImages = Array.isArray(data.uploaded.images) ? data.uploaded.images : [];
        uploadedVideos = Array.isArray(data.uploaded.videos) ? data.uploaded.videos : [];
      } else {
        uploadedImages = Array.isArray(data.images) ? data.images : [];
        uploadedVideos = Array.isArray(data.videos) ? data.videos : [];
      }

      const updatedSelected = {
        ...selected,
        images: [...(selected.images || []), ...uploadedImages],
        videos: [...(selected.videos || []), ...uploadedVideos],
      };

      setSelected(updatedSelected);
      setFolders((prev) => prev.map((f) => (f._id === selected._id ? updatedSelected : f)));

      setUploadFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error. Check console.");
    } finally {
      setUploading(false);
    }
  };

  // -------------- DnD setup for folders --------------
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const onFoldersDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = folders.findIndex((f) => f._id === active.id);
    const newIndex = folders.findIndex((f) => f._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFolders = arrayMove(folders, oldIndex, newIndex);
    setFolders(newFolders); // optimistic

    const folderIds = newFolders.map((f) => f._id);

    try {
      const headers = { "Content-Type": "application/json", ...getAuthHeader() };
      if (!headers.Authorization) {
        handleLogout();
        return;
      }

      const res = await fetch(`${API_URL}/upload/reorder-folders`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ folderIds }),
      });
      if (!res.ok) {
        console.error("Reorder folders failed:", await res.text());
        await fetchFolders(); // revert by refetching
      } else {
        const resultData = await res.json().catch(() => null);
        if (resultData && Array.isArray(resultData.folders)) setFolders(resultData.folders);
      }
    } catch (err) {
      console.error("Reorder folders error:", err);
      await fetchFolders();
    }
  };

  // Create admin handler
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreateAdminMsg("");
    setCreateAdminErr("");

    const email = newAdminEmail?.trim();
    const password = newAdminPassword;
    const confirm = newAdminConfirm;

    if (!email || !password || !confirm) {
      setCreateAdminErr("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setCreateAdminErr("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setCreateAdminErr("Passwords do not match.");
      return;
    }

    setCreatingAdmin(true);
    try {
      // read token fresh from localStorage
      const t = localStorage.getItem("token");
      if (!t) {
        // no token -> force logout
        handleLogout();
        return;
      }

      const res = await fetch(`${AUTH_API}/create-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ email, password }),
      });

      // For create-admin: don't force immediate logout on 401/403.
      // Instead show a clear error so the admin can retry / refresh token.
      if (res.status === 401 || res.status === 403) {
        const body = await res.json().catch(() => ({}));
        setCreateAdminErr(body.message || "Unauthorized — your token may be expired or you lack permission.");
        setCreatingAdmin(false);
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setCreateAdminMsg(`Admin created: ${data.admin?.email ?? email}`);
        setNewAdminEmail("");
        setNewAdminPassword("");
        setNewAdminConfirm("");
      } else {
        setCreateAdminErr(data.message || "Failed to create admin.");
      }
    } catch (err) {
      console.error("Create admin error:", err);
      setCreateAdminErr("Something went wrong. Try again.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Immediate reset handler: send { email, newPassword } to server to update immediately
  const handleImmediateResetSubmit = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    setForgotErr("");
    setResetMsg("");
    setResetErr("");

    const email = forgotEmail?.trim();
    const newPassword = resetNewPassword;
    const confirm = resetConfirm;

    if (!email) {
      setForgotErr("Email is required.");
      return;
    }
    if (!newPassword || !confirm) {
      setForgotErr("New password and confirmation are required.");
      return;
    }
    if (newPassword.length < 8) {
      setForgotErr("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setForgotErr("Passwords do not match.");
      return;
    }

    setSendingForgot(true);
    try {
      const res = await fetch(`${AUTH_API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setForgotMsg("Password updated successfully. The user can now log in with the new password.");
        setForgotEmail("");
        setResetNewPassword("");
        setResetConfirm("");
      } else {
        // show server-provided message or a fallback
        setForgotErr(data.message || "Failed to update password.");
      }
    } catch (err) {
      console.error("Immediate reset error:", err);
      setForgotErr("Something went wrong. Try again.");
    } finally {
      setSendingForgot(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    onLogout();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Modern Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex justify-between items-center px-6 py-4 shadow-lg z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <FaCog className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold">Koovappady's Kshemalayam Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
          >
            <FaSignOutAlt size={16} />
            Logout
          </button>
          <div className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-2 rounded-lg">
            <FaUserCircle size={24} className="text-white" />
            <span className="text-sm font-medium">Admin</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-16">
        {/* Modern Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 py-6 shadow-sm">
          <div className="px-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Content Management</h2>
            <p className="text-sm text-gray-600">Manage your folders and media content</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 px-6 mb-4">
            <button
              onClick={() => setView("folders")}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                view === "folders" 
                  ? "text-indigo-600 border-b-2 border-indigo-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Folders
            </button>
            <button
              onClick={() => {
                setSelected(null);
                setView("feedback");
              }}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                view === "feedback" 
                  ? "text-indigo-600 border-b-2 border-indigo-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Feedback
            </button>
          </div>

          {view === "folders" && (
            <>
              {/* Folder List Header */}
              <div className="px-6 mb-4 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Image Folders</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {folders.length} folders
                </span>
              </div>

              {/* Draggable list of folders */}
              <div className="px-6 mb-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onFoldersDragEnd}>
                  <SortableContext items={folders.map((f) => f._id)} strategy={verticalListSortingStrategy}>
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {folders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FaFolder className="mx-auto mb-2 text-gray-300" size={32} />
                          <p className="text-sm">No folders yet</p>
                        </div>
                      ) : (
                        folders.map((f) => (
                          <SortableFolderItem
                            key={f._id}
                            folder={f}
                            selected={selected}
                            onClick={(folder) => {
                              setView("folders");
                              setSelected(folder);
                            }}
                            onEdit={(folder) => startEditFolder(folder)}
                            onDelete={(folder) => deleteFolder(folder)}
                            // editing props
                            editingFolderId={editingFolderId}
                            editingFolderName={editingFolderName}
                            setEditingFolderName={setEditingFolderName}
                            onSaveEdit={submitEditFolder}
                            onCancelEdit={cancelEdit}
                          />
                        ))
                      )}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Add folder section */}
              <div className="px-6 mt-6">
                {!adding ? (
                  <button 
                    onClick={() => setAdding(true)} 
                    className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 py-3 rounded-lg border-2 border-dashed border-indigo-200 hover:border-indigo-300 transition-all duration-200 font-medium"
                  >
                    <FaPlus size={14} />
                    Add New Folder
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Create New Folder</h4>
                    <div className="space-y-3">
                      <input
                        className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                        placeholder="Enter folder name"
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
                      <div className="flex gap-2">
                        <button 
                          onClick={addFolder} 
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => {
                            setAdding(false);
                            setNewFolderName("");
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Create Admin section */}
          <div className="mt-8 px-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaUserCircle className="text-indigo-500" />
                Create Admin Account
              </h3>

              {createAdminMsg && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-sm border border-green-200">
                  {createAdminMsg}
                </div>
              )}
              {createAdminErr && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-3 text-sm border border-red-200">
                  {createAdminErr}
                </div>
              )}

              <form onSubmit={handleCreateAdmin} className="space-y-3">
                <div>
                  <input
                    type="email"
                    placeholder="Admin email address"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                    value={newAdminConfirm}
                    onChange={(e) => setNewAdminConfirm(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    creatingAdmin 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  {creatingAdmin ? "Creating Admin..." : "Create Admin Account"}
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Only authenticated admins can create new admin accounts
              </p>

              {/* Forgot password and immediate Reset password UI */}
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reset Password (by email)</h4>

                {/* Immediate reset form: provide email + new password -> server updates immediately */}
                <form onSubmit={handleImmediateResetSubmit} className="space-y-2 mb-3">
                  <div>
                    <input
                      type="email"
                      placeholder="Enter admin email"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="New password (min 8 chars)"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors text-sm"
                      value={resetConfirm}
                      onChange={(e) => setResetConfirm(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={sendingForgot}
                      className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                        sendingForgot
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {sendingForgot ? "Updating..." : "Update Password"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(""); setResetNewPassword(""); setResetConfirm(""); setForgotMsg(""); setForgotErr(""); setResetMsg(""); setResetErr(""); }}
                      className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </form>

                {forgotMsg && <div className="text-sm text-green-700 mb-2">{forgotMsg}</div>}
                {forgotErr && <div className="text-sm text-red-700 mb-2">{forgotErr}</div>}
                {resetMsg && <div className="text-sm text-green-700 mb-2">{resetMsg}</div>}
                {resetErr && <div className="text-sm text-red-700 mb-2">{resetErr}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Main Content */}
        <div className="flex-1 py-6 px-8 bg-gray-50">
          {view === "folders" ? (
            <>
              <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {selected ? selected.name : "Select a Folder"}
                    </h1>
                    {selected && (
                      <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                        {selected.images?.length || 0} images
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">
                    {selected 
                      ? "Manage images and content in this folder" 
                      : "Choose a folder from the sidebar to get started"}
                  </p>
                </div>

                {selected && (
                  <>
                    {/* Upload Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <FaUpload className="text-indigo-600" size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Upload Files</h3>
                      </div>
                      
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select files to upload
                          </label>
                          <input 
                            ref={fileInputRef} 
                            type="file" 
                            multiple 
                            className="block w-full border border-gray-300 rounded-lg p-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                            onChange={onFileChange} 
                          />
                        </div>
                        <button 
                          onClick={handleUpload} 
                          disabled={uploading || !uploadFiles.length}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                            uploading || !uploadFiles.length
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md"
                          }`}
                        >
                          {uploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <FaUpload size={16} />
                              Upload {uploadFiles.length > 0 && `(${uploadFiles.length})`}
                            </>
                          )}
                        </button>
                      </div>
                      {uploadFiles.length > 0 && (
                        <p className="text-sm text-gray-600 mt-3">
                          Selected {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {/* Folder Images Component */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <FolderImages folderId={selected._id} token={localStorage.getItem("token")} />
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">User Feedback</h1>
                <p className="text-gray-600">Review and manage feedback from users</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <FeedbackList token={localStorage.getItem("token")} />
              </div>
            </div>
          )}
         </div> 
      </div>
    </div>
  );
}
