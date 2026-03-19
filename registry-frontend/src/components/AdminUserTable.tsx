"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "./ui/Spinner";
import { UserProfile } from "@/types/user";
import { getAllUsers, updateUserProfile } from "@/lib/firestoreService";
import { useAuth } from "@/context/AuthContext";

export default function AdminUserTable() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const loadUsers = async () => {
        try {
            const data = await getAllUsers();
            data.sort((a, b) => {
                const timeA = a.createdAt?.toMillis?.() || 0;
                const timeB = b.createdAt?.toMillis?.() || 0;
                return timeB - timeA;
            });
            setUsers(data);
        } catch {
            toast.error("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleToggleRole = async (uid: string, currentRole: string) => {
        const targetUser = users.find(u => u.uid === uid);
        if (targetUser && (targetUser as UserProfile & { primaryAdmin?: boolean }).primaryAdmin) {
            toast.error("Cannot change role of primary admin.");
            return;
        }
        const newRole = currentRole === "admin" ? "user" : "admin";
        setUpdatingUid(uid);
        setUsers((prev) =>
            prev.map((u) => (u.uid === uid ? { ...u, role: newRole as UserProfile["role"] } : u))
        );
        try {
            await updateUserProfile(uid, { role: newRole as UserProfile["role"] });
            toast.success(`User role updated to ${newRole}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update role.";
            toast.error(message);
            await loadUsers();
        } finally {
            setUpdatingUid(null);
        }
    };

    const formatDate = (timestamp: UserProfile["createdAt"]) => {
        if (!timestamp) return "N/A";
        const date = typeof timestamp === "string"
            ? new Date(timestamp)
            : timestamp?.toDate?.()
                ? timestamp.toDate()
                : null;
        if (!date || isNaN(date.getTime())) return "N/A";
        return date.toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            timeZone: "Asia/Kolkata",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <h3 className="text-gray-500 font-semibold text-lg">No users found</h3>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100/50">
                            <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="py-5 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                            <th className="py-5 px-6 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((u) => {
                            const isCurrentUser = u.uid === currentUser?.uid;
                            return (
                                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6 text-sm font-semibold text-gray-800">
                                        {u.displayName || "Unknown"}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-600">
                                        {u.email || <span className="text-gray-300">N/A</span>}
                                    </td>
                                    <td className="py-4 px-6 text-sm">
                                        <span
                                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === "admin"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {u.role || "user"}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-400 whitespace-nowrap">
                                        {formatDate(u.createdAt)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        {(() => {
                                            const isPrimary = !!(u as UserProfile & { primaryAdmin?: boolean }).primaryAdmin;
                                            return (
                                                <button
                                                    onClick={() => handleToggleRole(u.uid, u.role || "user")}
                                                    disabled={isCurrentUser || updatingUid === u.uid || isPrimary}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isCurrentUser || isPrimary
                                                        ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                                        : u.role === "admin"
                                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                                            : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                                                        } ${updatingUid === u.uid ? "opacity-50" : ""}`}
                                                >
                                                    {updatingUid === u.uid ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                            Updating
                                                        </span>
                                                    ) : isPrimary ? (
                                                        "Primary Admin"
                                                    ) : u.role === "admin" ? (
                                                        "Remove Admin"
                                                    ) : (
                                                        "Make Admin"
                                                    )}
                                                </button>
                                            );
                                        })()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
