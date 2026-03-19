"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Card from "./ui/Card";
import Spinner from "./ui/Spinner";
import LocationAutocomplete from "./LocationAutocomplete";
import { PIPELINE_STATUS_OPTIONS } from "@/lib/constants";
import {
    createInstitution,
    getUserInstitutions,
    updateInstitution,
    deleteInstitution,
} from "@/lib/firestoreService";
import { Institution } from "@/types/institution";
import CustomDropdown from "./ui/CustomDropdown";

interface InstitutionFormProps {
    userId: string;
}

const validationSchema = Yup.object().shape({
    name: Yup.string().required("Institution name is required"),
    contactPerson: Yup.string().required("Contact person is required"),
    phone: Yup.string()
        .matches(/^\d{10}$/, "Must be a 10-digit number")
        .required("Phone is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    address: Yup.string().required("Address is required"),
    pipelineStatus: Yup.string().required("Status is required"),
});

export default function InstitutionForm({ userId }: InstitutionFormProps) {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const loadInstitutions = async () => {
        setLoading(true);
        try {
            const data = await getUserInstitutions(userId);
            setInstitutions(data);
        } catch {
            toast.error("Failed to load institutions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInstitutions();
    }, [userId]);

    const formik = useFormik({
        initialValues: {
            name: "",
            contactPerson: "",
            phone: "",
            email: "",
            address: "",
            lat: null as number | null,
            lng: null as number | null,
            googleMapsPin: "",
            pipelineStatus: "active",
            sourceSegment: "",
            actorType: "",
        },
        validationSchema,
        onSubmit: async (values) => {
            setSubmitting(true);
            try {
                if (editingId) {
                    await updateInstitution(editingId, {
                        ...values,
                        userId,
                    });
                    toast.success("Institution updated!");
                } else {
                    await createInstitution({
                        ...values,
                        userId,
                    });
                    toast.success("Institution created!");
                }
                formik.resetForm();
                setShowForm(false);
                setEditingId(null);
                await loadInstitutions();
            } catch {
                toast.error("Failed to save institution.");
            } finally {
                setSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    const handleEdit = (inst: Institution) => {
        setEditingId(inst.id);
        formik.setValues({
            name: inst.name,
            contactPerson: inst.contactPerson,
            phone: inst.phone,
            email: inst.email,
            address: inst.address,
            lat: inst.lat,
            lng: inst.lng,
            googleMapsPin: inst.googleMapsPin,
            pipelineStatus: inst.pipelineStatus,
            sourceSegment: inst.sourceSegment,
            actorType: inst.actorType,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteInstitution(id);
            toast.success("Institution deleted.");
            await loadInstitutions();
        } catch {
            toast.error("Failed to delete institution.");
        }
    };

    const handlePlaceSelect = (location: { address: string; lat?: number; lng?: number }) => {
        formik.setFieldValue("address", location.address);
        if (location.lat && location.lng) {
            formik.setFieldValue("lat", location.lat);
            formik.setFieldValue("lng", location.lng);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Institutions</h3>
                <Button
                    size="sm"
                    onClick={() => {
                        setEditingId(null);
                        formik.resetForm();
                        setShowForm(!showForm);
                    }}
                >
                    {showForm ? "Cancel" : "+ Add Institution"}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <form onSubmit={formik.handleSubmit} className="space-y-4">
                        <Input
                            label="Institution Name"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.name ? formik.errors.name : undefined}
                            placeholder="Enter institution name"
                        />
                        <Input
                            label="Contact Person"
                            name="contactPerson"
                            value={formik.values.contactPerson}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.contactPerson ? formik.errors.contactPerson : undefined}
                            placeholder="Contact person name"
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Phone"
                                name="phone"
                                type="tel"
                                value={formik.values.phone}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.phone ? formik.errors.phone : undefined}
                                placeholder="10-digit number"
                            />
                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.email ? formik.errors.email : undefined}
                                placeholder="email@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Address
                            </label>
                            <LocationAutocomplete
                                value={formik.values.address}
                                onChange={formik.handleChange}
                                onPlaceSelect={handlePlaceSelect}
                                placeholder="Start typing an address..."
                                name="address"
                                error={formik.touched.address ? formik.errors.address : undefined}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                                Pipeline Status
                            </label>
                            <CustomDropdown
                                size="lg"
                                value={formik.values.pipelineStatus}
                                onChange={(val) => formik.setFieldValue("pipelineStatus", val)}
                                options={PIPELINE_STATUS_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                            />
                        </div>

                        <Input
                            label="Source Segment"
                            name="sourceSegment"
                            value={formik.values.sourceSegment}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="e.g. Solar, Education, Industrial"
                        />

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    formik.resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={submitting}>
                                {editingId ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {institutions.length === 0 && !showForm && (
                <div className="bg-white/50 border-2 border-dashed border-gray-300 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center">
                    <h3 className="text-gray-500 font-semibold text-lg">
                        No institutions yet
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                        Add an institution to start registering actions.
                    </p>
                </div>
            )}

            {institutions.map((inst) => (
                <Card key={inst.id}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-semibold text-gray-800">{inst.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{inst.address}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-xs text-gray-400">
                                    {inst.contactPerson} · {inst.phone}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                    {inst.pipelineStatus}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(inst)}>
                                Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleDelete(inst.id)}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
