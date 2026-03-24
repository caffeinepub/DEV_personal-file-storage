import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
}
export interface FileRecord {
    id: string;
    owner: Principal;
    name: string;
    size: bigint;
    mimeType: string;
    blobId: string;
    uploadedAt: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFile(fileId: string): Promise<void>;
    getAllFiles(): Promise<Array<FileRecord>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFileMetadata(fileId: string): Promise<FileRecord>;
    getMyFiles(): Promise<Array<FileRecord>>;
    getRemainingStorageCapacity(): Promise<bigint>;
    getTotalStorageUsed(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadFile(id: string, name: string, size: bigint, mimeType: string, blobId: string): Promise<void>;
}
