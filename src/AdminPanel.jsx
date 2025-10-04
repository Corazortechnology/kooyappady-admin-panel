
import { useState, useEffect } from "react";
import { FaUserCircle, FaFolder, FaEdit, FaTrash } from "react-icons/fa";
import FolderImages from "./FolderImages";

export default function AdminPanel({ onLogout }) {
    const [folders, setFolders] = useState([]);
    const [selected, setSelected] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));

    const API_URL = "https://kooyapady-admin-backend.onrender.com/api";

    useEffect(() => {
        fetchFolders();
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
    //add folder
    const addFolder = async () => {
        const name = prompt("Enter new folder name:");
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
            if (res.ok) setFolders([...folders, data]);
            else alert(data.message);
        } catch (err) {
            console.error("Add folder error:", err);
        }
    };

    //Edit folder name
    const editFolder = async (folder) => {
        const newName = prompt("Enter new folder name:", folder.name);
        if (!newName) return;
        try {
            const res = await fetch(`${API_URL}/folders/${folder._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newName }),
            });
            const data = await res.json();
            if (res.ok) {
                setFolders(folders.map((f) => (f._id === folder._id ? data : f)));
                if (selected && selected._id === folder._id) {
                    setSelected(data);
                }
            } else alert(data.message);
        } catch (err) {
            console.error("Edit folder error:", err);
        }
    };

    //Delete folder
    const deleteFolder = async (folder) => {
        if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
        try {
            const res = await fetch(`${API_URL}/folders/${folder._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setFolders(folders.filter((f) => f._id !== folder._id));
                if (selected && selected._id === folder._id) {
                    setSelected(null);
                }
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) {
            console.error("Delete folder error:", err);
        }
    };


    //Upload images
    const handleUpload = async (e) => {
        const files = e.target.files;
        if (!files.length || !selected) return;
        const formData = new FormData();
        for (let file of files) {
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
                const updated = {
                    ...selected,
                    images: [...(selected.images || []), ...data.uploaded],
                };
                setSelected(updated);
                setFolders(
                    folders.map((f) => (f._id === selected._id ? updated : f))
                );
            } else alert(data.message);
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 bg-gray-800 text-white flex justify-between items-center px-6 py-6 shadow-md z-10 fixed">
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
                    <h2 className="text-xl font-semibold mt-16 text-center mb-4">
                        Image Folders
                    </h2>
                    <ul className="px-6 space-y-2">
                        {folders.map((f) => (
                            <li
                                key={f._id}
                                className={`p-2 flex justify-between items-center rounded cursor-pointer ${selected && selected._id === f._id
                                    ? "bg-gray-700"
                                    : "hover:bg-gray-700"
                                    }`}
                            >
                                <div
                                    className="flex gap-2 items-center flex-1"
                                    onClick={() => setSelected(f)}
                                >
                                    <FaFolder size={22} />
                                    <span className="capitalize">{f.name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <FaEdit
                                        size={18}
                                        className="cursor-pointer hover:text-yellow-400"
                                        onClick={() => editFolder(f)}
                                    />
                                    <FaTrash
                                        size={18}
                                        className="cursor-pointer hover:text-red-500"
                                        onClick={() => deleteFolder(f)}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={addFolder}
                        className="mt-4 ml-6 mr-6 w-62 bg-blue-600 py-2 rounded hover:bg-blue-700"
                    >
                        + Add Folder
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 py-16 px-8 bg-gray-100">
                    <h1 className="text-2xl text-center py-4 mt-4 font-bold mb-4">
                        Folder: {selected ? selected.name : "No Folder Selected"}
                    </h1>
                    {selected && (
                        <>
                            <input
                                type="file"
                                multiple
                                className="mb-4 block w-full border border-gray-400 rounded p-2"
                                onChange={handleUpload}
                            />
                            <FolderImages folderId={selected._id} token={token} />

                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

