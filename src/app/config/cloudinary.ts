import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryConfig = cloudinary;

export const uploadToCloudinary = async (
    file: string,
    folder: string = "soul-space"
): Promise<{ url: string; publicId: string }> => {
    try {
        const isPdfUpload = /^data:application\/pdf;/i.test(file);
        const resourceType = isPdfUpload ? "raw" : "auto";

        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: resourceType,
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error("Failed to upload file to Cloudinary");
    }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new Error("Failed to delete file from Cloudinary");
    }
};

export const uploadMultipleToCloudinary = async (
    files: string[],
    folder: string = "soul-space"
): Promise<{ url: string; publicId: string }[]> => {
    try {
        const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error("Cloudinary multiple upload error:", error);
        throw new Error("Failed to upload files to Cloudinary");
    }
};
