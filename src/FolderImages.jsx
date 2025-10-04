
import { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash, FaEdit } from "react-icons/fa";

function FolderImages({ folderId, token }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all images from folder
    useEffect(() => {
        if (folderId) {
            fetchImages();
        }
    }, [folderId]);

    const fetchImages = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`https://kooyapady-admin-backend.onrender.com/api/upload/${folderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(res.data.images);
            setImages(res.data.images);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Delete image
    const deleteImage = async (cloudinaryPublicId) => {
        if (!window.confirm("Delete this image?")) return;
        try {
            await axios.delete(`https://kooyapady-admin-backend.onrender.com/api/upload/${folderId}/${encodeURIComponent(cloudinaryPublicId)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setImages(images.filter(img => img.public_id !== cloudinaryPublicId));
        } catch (err) {
            console.error(err);
        }
    };

    // Rename image
    const renameImage = async (publicId) => {
        const newName = prompt("Enter new name for image:");
        if (!newName) return;
        try {
            const res = await axios.put(
                `https://kooyapady-admin-backend.onrender.com/api/upload/${folderId}/${publicId}`,
                { newName },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // update state
            setImages(images.map(img =>
                img.public_id === publicId ? res.data.image : img
            ));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Images in Folder</h2>
            {loading ? (
                <p>Loading...</p>
            ) : images.length === 0 ? (
                <p>No images found in this folder.</p>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div key={img.public_id} className="relative border rounded p-2">
                            <img src={img.url} alt="" className="w-full h-40 object-cover rounded" />
                            <div className="flex justify-between mt-2">
                                <button
                                    className="text-red-600"
                                    onClick={() => deleteImage(encodeURIComponent(img.public_id))}
                                >
                                    <FaTrash />
                                </button>
                                {/* <button
                                    className="text-blue-600"
                                    onClick={() => renameImage(img.public_id)}
                                >
                                    <FaEdit />
                                </button> */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FolderImages;
