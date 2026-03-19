"use client";

import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import ActionTypeSelector from "./forms/ActionTypeSelector";
import ActorDetailsSection from "./forms/ActorDetailsSection";
import LocationPickerSection from "./forms/LocationPickerSection";
import PhotoUploadSection from "./forms/PhotoUploadSection";
import Input from "./ui/Input";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { useAuth } from "@/context/AuthContext";
import { PAYMENT_AMOUNT_DISPLAY } from "@/lib/constants";


declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
        };
    }
}

const validationSchema = Yup.object().shape({
    actionType: Yup.string().required("Action type is required"),
    quantity: Yup.number()
        .min(0.01, "Quantity must be greater than 0")
        .required("Quantity is required")
        .typeError("Must be a number"),
    unit: Yup.string().required("Unit is required"),
    address: Yup.string().required("Address is required"),
    actorType: Yup.string().required("Actor type is required"),
    actorName: Yup.string().required("Actor name is required"),
    contactPerson: Yup.string().required("Contact person is required"),
    phone: Yup.string()
        .matches(/^\d{10}$/, "Must be a 10-digit number")
        .required("Phone is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    commissioningDate: Yup.string(),
    localPercent: Yup.number().min(0).max(100).typeError("Must be a number"),
    indigenousPercent: Yup.number().min(0).max(100).typeError("Must be a number"),
    communityPercent: Yup.number().min(0).max(100).typeError("Must be a number"),
    jobsCreated: Yup.number().min(0).typeError("Must be a number"),
    consentGiven: Yup.boolean().oneOf([true], "You must verify this data is correct"),
    disclaimerAccepted: Yup.boolean().oneOf([true], "You must accept the disclaimer to proceed"),
});

export default function RegisterActionForm() {
    const { user } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [meterPhotos, setMeterPhotos] = useState<string[]>(["", "", ""]);
    const [sitePhoto, setSitePhoto] = useState<string | null>(null);

    useEffect(() => {
        // Only add the script if it doesn't already exist.
        // CRITICAL: Do NOT remove this script on cleanup — removing it destroys
        // window.Razorpay and breaks the payment handler callback on deployment.
        const existing = document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );
        if (!existing) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
        // No cleanup — intentional. Removing the script destroys window.Razorpay.
    }, []);

    const processPaymentVerification = async (
        paymentDetails: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        },
        values: typeof formik.values
    ) => {
        try {
            console.log("[payment] processPaymentVerification called", paymentDetails);
            // Get the user's Firebase ID token for server-side auth
            const idToken = await user?.getIdToken();
            console.log("[payment] Got idToken:", !!idToken);

            const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...paymentDetails,
                    userIdToken: idToken,
                    formData: {
                        ...values,
                        quantity: Number(values.quantity),
                        localPercent: Number(values.localPercent) || 0,
                        indigenousPercent: Number(values.indigenousPercent) || 0,
                        communityPercent: Number(values.communityPercent) || 0,
                        jobsCreated: Number(values.jobsCreated) || 0,
                        meterPhotos: meterPhotos.filter(Boolean),
                        sitePhoto,
                        userId: user?.uid,
                        userEmail: user?.email,
                    },
                }),
            });

            console.log("[payment] verify response status:", verifyRes.status);

            if (!verifyRes.ok) {
                const errData = await verifyRes.json();
                console.error("[payment] verify API error:", errData);
                throw new Error(errData.error || "Payment verification failed");
            }

            const result = await verifyRes.json();
            console.log("[payment] verify success:", result);
            toast.success("Action registered successfully!");
            router.push(`/register/success?id=${result.registryId}`);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Payment verification failed";
            console.error("[payment] processPaymentVerification error:", message, err);
            toast.error(message);
            setSubmitting(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            actionType: "",
            quantity: "",
            unit: "",
            address: "",
            lat: null as number | null,
            lng: null as number | null,
            actorType: "",
            actorName: "",
            contactPerson: "",
            phone: "",
            email: "",
            commissioningDate: "",
            localPercent: "",
            indigenousPercent: "",
            communityPercent: "",
            jobsCreated: "",
            consentGiven: false,
            disclaimerAccepted: false,
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!user) {
                toast.error("You must be signed in.");
                return;
            }

            setSubmitting(true);

            try {
                const orderRes = await fetch("/api/payment/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });

                if (!orderRes.ok) {
                    throw new Error("Failed to create payment order");
                }

                const orderData = await orderRes.json();

                if (orderData.simulated) {
                    setIsSimulationMode(true);
                    await processPaymentVerification(
                        {
                            razorpay_order_id: orderData.orderId,
                            razorpay_payment_id: `pay_SIM_${Date.now()}`,
                            razorpay_signature: "SIMULATED_SIGNATURE",
                        },
                        values
                    );
                    return;
                }

                const options = {
                    key: orderData.key,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Earth Carbon Registry",
                    description: "Action Registration Fee",
                    order_id: orderData.orderId,
                    handler: async (response: {
                        razorpay_order_id: string;
                        razorpay_payment_id: string;
                        razorpay_signature: string;
                    }) => {
                        console.log("[payment] Razorpay handler fired!", response);
                        await processPaymentVerification(response, values);
                    },
                    prefill: {
                        name: values.actorName,
                        email: values.email,
                        contact: values.phone,
                    },
                    theme: { color: "rgb(32,38,130)" },
                    modal: {
                        ondismiss: () => {
                            console.log("[payment] Razorpay modal dismissed (no payment)");
                            setSubmitting(false);
                        },
                        escape: false,
                        animation: true,
                    },
                };

                const razorpay = new window.Razorpay(options);

                // Listen for payment failure events to help diagnose issues
                razorpay.on("payment.failed", (resp: Record<string, unknown>) => {
                    console.error("[payment] payment.failed event:", resp);
                    const err = resp?.error as Record<string, unknown> | undefined;
                    toast.error(
                        `Payment failed: ${err?.description || err?.reason || "Unknown error"}`
                    );
                    setSubmitting(false);
                });

                razorpay.open();
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to initiate payment";
                toast.error(message);
                setSubmitting(false);
            }
        },
    });

    const handlePlaceSelect = (location: { address: string; lat?: number; lng?: number }) => {
        formik.setFieldValue("address", location.address);
        if (location.lat && location.lng) {
            formik.setFieldValue("lat", location.lat);
            formik.setFieldValue("lng", location.lng);
        }
    };

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-8">
            {isSimulationMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-2">
                    <span className="text-xl flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </span>
                    <span className="text-sm font-semibold text-yellow-700">
                        Payment Simulation Mode — No real charges
                    </span>
                </div>
            )}

            <Card header={<h3 className="text-lg font-semibold text-gray-800">Action Details</h3>}>
                <div className="space-y-6">
                    <ActionTypeSelector
                        value={formik.values.actionType}
                        unitValue={formik.values.unit}
                        onChange={(val) => formik.setFieldValue("actionType", val)}
                        onUnitChange={(unit) => formik.setFieldValue("unit", unit)}
                        error={formik.errors.actionType}
                        touched={formik.touched.actionType}
                    />

                    <div className="space-y-2">
                        <label
                            htmlFor="quantity"
                            className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-1"
                        >
                            Capacity / Quantity
                        </label>
                        <div className="relative">
                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                step="0.01"
                                className={`
                  w-full px-5 py-4 pr-24 rounded-xl border bg-gray-50/50
                  focus:bg-white transition-all duration-200 outline-none
                  font-medium text-gray-700 placeholder:text-gray-300
                  ${formik.touched.quantity && formik.errors.quantity
                                        ? "border-red-400 focus:border-red-400"
                                        : "border-gray-100 focus:border-blue-400"
                                    }
                `}
                                value={formik.values.quantity}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="0.00"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-100/50 rounded-lg text-gray-500 font-bold text-sm pointer-events-none">
                                {formik.values.unit || "units"}
                            </div>
                        </div>
                        {formik.touched.quantity && formik.errors.quantity && (
                            <p className="text-red-500 text-xs ml-1">{formik.errors.quantity}</p>
                        )}
                    </div>

                    <Input
                        label="Commissioning Date"
                        name="commissioningDate"
                        type="date"
                        value={formik.values.commissioningDate}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </div>
            </Card>



            <Card header={<h3 className="text-lg font-semibold text-gray-800">Actor Information</h3>}>
                <ActorDetailsSection
                    actorType={formik.values.actorType}
                    actorName={formik.values.actorName}
                    contactPerson={formik.values.contactPerson}
                    phone={formik.values.phone}
                    email={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    errors={formik.errors as Record<string, string | undefined>}
                    touched={formik.touched as Record<string, boolean | undefined>}
                />
            </Card>

            <Card header={<h3 className="text-lg font-semibold text-gray-800">Location</h3>}>
                <LocationPickerSection
                    address={formik.values.address}
                    lat={formik.values.lat}
                    lng={formik.values.lng}
                    onAddressChange={formik.handleChange}
                    onPlaceSelect={handlePlaceSelect}
                    onCoordsChange={(lat, lng) => {
                        formik.setFieldValue("lat", lat);
                        formik.setFieldValue("lng", lng);
                    }}
                    error={formik.errors.address}
                    touched={formik.touched.address}
                />
            </Card>

            <Card header={<h3 className="text-lg font-semibold text-gray-800">Photos</h3>}>
                <PhotoUploadSection
                    meterPhotos={meterPhotos}
                    sitePhoto={sitePhoto}
                    userId={user?.uid || ""}
                    onMeterPhotosChange={setMeterPhotos}
                    onSitePhotoChange={setSitePhoto}
                />
            </Card>

            <Card header={
                <div>
                    <h3 className="text-lg font-semibold text-gray-800">Atmanirbhar Assessment</h3>
                    <p className="text-xs text-gray-500 mt-1">Optional — help us measure self-reliance impact</p>
                </div>
            }>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="Local Sourcing %"
                        name="localPercent"
                        type="number"
                        value={formik.values.localPercent}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="0 - 100"
                        error={formik.touched.localPercent ? formik.errors.localPercent : undefined}
                    />
                    <Input
                        label="Indigenous Tech %"
                        name="indigenousPercent"
                        type="number"
                        value={formik.values.indigenousPercent}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="0 - 100"
                        error={formik.touched.indigenousPercent ? formik.errors.indigenousPercent : undefined}
                    />
                    <Input
                        label="Community Ownership %"
                        name="communityPercent"
                        type="number"
                        value={formik.values.communityPercent}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="0 - 100"
                        error={formik.touched.communityPercent ? formik.errors.communityPercent : undefined}
                    />
                    <Input
                        label="Jobs Created"
                        name="jobsCreated"
                        type="number"
                        value={formik.values.jobsCreated}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Number of jobs"
                        error={formik.touched.jobsCreated ? formik.errors.jobsCreated : undefined}
                    />
                </div>
            </Card>

            <Card>
                <div className="space-y-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="consentGiven"
                            checked={formik.values.consentGiven}
                            onChange={formik.handleChange}
                            className="mt-1 w-5 h-5 accent-[rgb(32,38,130)] cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                            I verify that the data provided above is correct to the best of my knowledge.
                            I understand that this submission will generate a tamper-evident digital signature.
                        </span>
                    </label>
                    {formik.touched.consentGiven && formik.errors.consentGiven && (
                        <p className="text-red-500 text-xs ml-1">{formik.errors.consentGiven}</p>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="disclaimerAccepted"
                            checked={formik.values.disclaimerAccepted}
                            onChange={formik.handleChange}
                            className="mt-1 w-5 h-5 accent-[rgb(32,38,130)] cursor-pointer"
                        />
                        <span className="text-sm text-gray-600">
                            I understand that the carbon reduction (tCO₂e) and Atmanirbhar
                            values displayed are <strong>estimates</strong> based on my submitted data.
                            Earth Carbon Foundation verifies all actions in good faith.
                        </span>
                    </label>
                    {formik.touched.disclaimerAccepted && formik.errors.disclaimerAccepted && (
                        <p className="text-red-500 text-xs ml-1">{formik.errors.disclaimerAccepted}</p>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-sm text-gray-500">Registration Fee</p>
                            <p className="text-2xl font-black text-gray-800">{PAYMENT_AMOUNT_DISPLAY}</p>
                        </div>
                        <Button type="submit" size="lg" loading={submitting}>
                            Pay & Register Action
                        </Button>
                    </div>
                </div>
            </Card>
        </form >
    );
}
