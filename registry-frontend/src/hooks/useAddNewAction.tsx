"use client";
import { toast } from "react-toastify";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createAction, updateAction } from "@/lib/firestoreService";
import { Action } from "@/types/action";

interface ActionData {
  actionType: string;
  quantity: number;
  unit: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

interface EditingAction extends ActionData {
  id: string;
}

export const useAddNewAction = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAction, setEditingAction] = useState<EditingAction | null>(
    null,
  );

  const handleOpenModal = () => {
    setEditingAction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleEditAction = (action: EditingAction) => {
    setEditingAction(action);
    setIsModalOpen(true);
  };

  const handleSubmitAction = async (data: ActionData) => {
    if (!user) {
      toast.error("You must be signed in to submit an action.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingAction && editingAction.id) {
        await updateAction(editingAction.id, {
          actionType: data.actionType,
          quantity: Number(data.quantity),
          unit: data.unit,
          address: data.address,
          lat: data.lat || null,
          lng: data.lng || null,
        } as Partial<Action>);
      } else {
        await createAction({
          actionType: data.actionType,
          quantity: Number(data.quantity),
          unit: data.unit,
          address: data.address,
          lat: data.lat || null,
          lng: data.lng || null,
          userId: user.uid,
          userEmail: user.email || "",
          registryId: "",
          institutionId: null,
          actorType: "individual",
          actorName: "",
          contactPerson: "",
          phone: "",
          email: user.email || "",
          status: "pending",
          co2eKg: null,
          atmanirbharPercent: null,
          sha256Hash: "",
          meterPhotos: [],
          sitePhoto: null,
          commissioningDate: null,
          localPercent: null,
          indigenousPercent: null,
          communityPercent: null,
          jobsCreated: null,
          razorpayOrderId: null,
          razorpayPaymentId: null,
        });
      }

      setIsSubmitting(false);
      handleCloseModal();

      setTimeout(() => {
        toast.success(
          editingAction
            ? "Action updated successfully!"
            : "Action submitted successfully!",
        );
      }, 100);
    } catch (error: unknown) {
      setIsSubmitting(false);
      const message = error instanceof Error ? error.message : "Please try again.";

      if (message.includes("offline")) {
        toast.error("Network Error: Please check your internet connection.");
      } else {
        toast.error(`Failed to submit action: ${message}`);
      }
      throw error;
    }
  };

  return {
    isModalOpen,
    isSubmitting,
    editingAction,
    handleOpenModal,
    handleCloseModal,
    handleEditAction,
    handleSubmitAction,
  };
};
