"use client";

import React, { useState } from "react";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { updateUserProfile } from "@/lib/firestoreService";
import { toast } from "react-toastify";

interface ProfileSetupProps {
    uid: string;
    isOpen: boolean;
    onComplete: () => void;
}

export default function ProfileSetup({ uid, isOpen, onComplete }: ProfileSetupProps) {
    const [handles, setHandles] = useState(["", "", ""]);
    const [saving, setSaving] = useState(false);

    const handleChange = (index: number, value: string) => {
        const updated = [...handles];
        updated[index] = value;
        setHandles(updated);
    };

    const handleSubmit = async () => {
        const filled = handles.filter((h) => h.trim() !== "");
        if (filled.length === 0) {
            toast.error("Please enter at least one social handle.");
            return;
        }

        setSaving(true);
        try {
            await updateUserProfile(uid, {
                socialHandles: [handles[0] || "", handles[1] || "", handles[2] || ""] as [string, string, string],
            });
            toast.success("Profile updated successfully!");
            onComplete();
        } catch {
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { }} title="Complete Your Profile">
            <div className="space-y-6">
                <p className="text-sm text-gray-500">
                    Please add your social media handles to complete your profile setup.
                </p>

                <Input
                    label="Social Handle 1"
                    placeholder="e.g. twitter.com/username"
                    value={handles[0]}
                    onChange={(e) => handleChange(0, e.target.value)}
                />
                <Input
                    label="Social Handle 2"
                    placeholder="e.g. linkedin.com/in/username"
                    value={handles[1]}
                    onChange={(e) => handleChange(1, e.target.value)}
                />
                <Input
                    label="Social Handle 3"
                    placeholder="e.g. instagram.com/username"
                    value={handles[2]}
                    onChange={(e) => handleChange(2, e.target.value)}
                />

                <div className="flex justify-end pt-4">
                    <Button loading={saving} onClick={handleSubmit}>
                        Save Profile
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
