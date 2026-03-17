"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserActions, deleteAction } from "@/lib/firestoreService";
import { Action } from "@/types/action";

export const useActionRecordTable = () => {
  const { user, loading: authLoading } = useAuth();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = getUserActions(user.uid, (fetchedActions) => {
      setActions(fetchedActions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAction(id);
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = actions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(actions.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return {
    actions,
    loading,
    currentItems,
    currentPage,
    totalPages,
    handlePageChange,
    handleDelete,
  };
};
