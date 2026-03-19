"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { SchoolFormData } from "@/types/school";
import { 
    BASELINE_SOURCE_OPTIONS, 
    FUEL_TYPE_OPTIONS, 
    RENEWABLE_TYPE_OPTIONS,
    REPORTING_YEAR_OPTIONS,
    RECYCLING_PROGRAM_OPTIONS,
    ACTION_TYPE_OPTIONS
} from "@/lib/constants/schoolConstants";
import { toast } from "react-toastify";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import { auth } from "@/lib/firebaseConfig";
import SchoolAutocomplete from "./SchoolAutocomplete";
import { getProjects, getSchoolActions, checkDuplicateSchool } from "@/lib/schoolFirestoreService";
import CustomDropdown from "./ui/CustomDropdown";

declare global {
    interface Window {
        Razorpay: new (options: Record<string, unknown>) => {
            open: () => void;
            on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
        };
    }
}

const validationSchema = [
    // Step 1
    Yup.object({
        schoolName: Yup.string().required("School name is required"),
        address: Yup.string().required("Address is required"),
        city: Yup.string().required("City is required"),
        pincode: Yup.string().matches(/^[0-9]{6}$/, "Must be a 6-digit pincode").required("Required"),
        contactPerson: Yup.string().required("Required"),
        phone: Yup.string().matches(/^[0-9]{10}$/, "Must be 10 digits").required("Required"),
        email: Yup.string().email("Invalid email").required("Required"),
        projectId: Yup.string().required("Please select a project"),
    }),
    // Step 2
    Yup.object({
        students_count: Yup.number().min(1, "Students count must be at least 1").required("Required"),
        reporting_year: Yup.string().required("Required"),
        action_id: Yup.string().required("Please select an action"),
    }),
    // Step 3
    Yup.object({
        calculation_notes: Yup.string().max(1000, "Maximum 1000 characters"),
    }),
    // Step 4
    Yup.object({
        consent_confirmed: Yup.boolean().oneOf([true], "Please provide consent to proceed").required(),
    })
];

const DRAFT_KEY = "school_onboarding_draft";

export default function SchoolRegistrationForm() {
    const { profile } = useUserProfile();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [projects, setProjects] = useState<any[]>([]);
    const [actions, setActions] = useState<any[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const totalSteps = 4;

    useEffect(() => {
        // Load Razorpay Script
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (!existing) {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }

        // Load Projects
        getProjects().then(setProjects);

        // Load Draft
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                formik.setValues(parsed);
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, []);

    const formik = useFormik<SchoolFormData>({
        initialValues: {
            schoolName: "",
            address: "",
            city: "",
            pincode: "",
            place_id: "",
            contactPerson: "",
            phone: "",
            email: "",
            projectId: "",
            
            electricity_kWh_year: "",
            fuel_type: "None",
            fuel_consumption_litres: "",
            renewable_energy_type: "None",
            renewable_energy_kwh: "",
            attribution_pct_energy: 100,
            students_count: "",
            reporting_year: "2025",
            action_id: "",

            waste_generated_kg: "",
            waste_diverted_kg: "",
            recycling_programs: [],
            water_consumption_m3: "",
            attribution_pct_waste: 100,
            attribution_pct_water: 100,
            calculation_notes: "",
            baseline_source: "school_shared",

            has_existing_actions: "No",
            action_type: "",
            installation_date: "",
            capacity_description: "",
            photo_file: null,
            planned_action_type: "",
            target_date: "",
            
            consent_confirmed: false,
            lat: null,
            lng: null,
        },
        validationSchema: validationSchema[currentStep - 1],
        onSubmit: async (values) => {
            // Final Step Submission
            setSubmitting(true);
            try {
                // Feature 2: Final Duplicate Check
                const dupCheck = await checkDuplicateSchool(values.place_id, values.schoolName, values.lat || 0, values.lng || 0);
                if (dupCheck.isDuplicate && dupCheck.type === 'BLOCK') {
                    toast.error(`This school is already registered as ${dupCheck.registryId}. View profile: /verify/school/${dupCheck.registryId}`, { autoClose: 10000 });
                    setSubmitting(false);
                    return;
                }

                const orderRes = await fetch("/api/school/payment/create", { method: "POST" });
                const orderData = await orderRes.json();
                if (orderData.error) throw new Error(orderData.error);

                const options = {
                    key: orderData.key,
                    amount: 19900, // Rs. 199 in paise
                    currency: "INR",
                    name: "Earth Carbon Registry",
                    description: "School Onboarding - Rs.199",
                    order_id: orderData.orderId,
                    handler: async (response: any) => {
                        await processPaymentVerification(response, values);
                    },
                    prefill: {
                        name: values.schoolName,
                        email: values.email,
                        contact: values.phone,
                    },
                    theme: { color: "rgb(32,38,130)" },
                    modal: {
                        ondismiss: () => setSubmitting(false),
                    },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || "Registration failed");
                setSubmitting(false);
            }
        },
    });

    // Auto-save draft
    useEffect(() => {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...formik.values, currentStep }));
    }, [formik.values, currentStep]);

    // Fetch actions when project changes
    useEffect(() => {
        if (formik.values.projectId) {
            getSchoolActions(formik.values.projectId).then(setActions);
        } else {
            setActions([]);
        }
    }, [formik.values.projectId]);

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png"].includes(file.type)) {
            toast.error("Please upload an image file (JPG or PNG).");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image too large. Please upload a photo under 10MB.");
            return;
        }

        // Feature 9: Compression
        const compressed = await compressImage(file);
        formik.setFieldValue("photo_file", compressed);
        
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreview(reader.result as string);
        reader.readAsDataURL(compressed);
    };

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const max = 1200;
                    if (width > height && width > max) {
                        height *= max / width;
                        width = max;
                    } else if (height > max) {
                        width *= max / height;
                        height = max;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx?.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob!], file.name, { type: "image/jpeg" }));
                    }, "image/jpeg", 0.8);
                };
            };
        });
    };

    const processPaymentVerification = async (paymentDetails: any, values: SchoolFormData) => {
        try {
            const formData = new FormData();
            Object.entries(values).forEach(([key, val]) => {
                if (key === 'photo_file' && val) {
                    formData.append(key, val);
                } else if (val !== null && val !== undefined) {
                    formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
                }
            });
            
            formData.append("razorpay_order_id", paymentDetails.razorpay_order_id);
            formData.append("razorpay_payment_id", paymentDetails.razorpay_payment_id);
            formData.append("razorpay_signature", paymentDetails.razorpay_signature);
            formData.append("userIdToken", await auth.currentUser?.getIdToken() || "");
            formData.append("userId", profile?.uid || "");

            const verifyRes = await fetch("/api/school/payment/verify", {
                method: "POST",
                body: formData,
            });

            const verifyData = await verifyRes.json();
            if (verifyData.error) throw new Error(verifyData.error);

            toast.success("School registered successfully!");
            localStorage.removeItem(DRAFT_KEY);
            router.push("/school-register/success?id=" + verifyData.registryId);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Verification failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
            if (currentStep === 1) {
                // Feature 2: Duplicate Check
                const dupCheck = await checkDuplicateSchool(formik.values.place_id, formik.values.schoolName, formik.values.lat || 0, formik.values.lng || 0);
                if (dupCheck.isDuplicate) {
                    if (dupCheck.type === 'BLOCK') {
                        toast.error(`This school is already registered as ${dupCheck.registryId}. View profile: /verify/school/${dupCheck.registryId}`, { autoClose: 10000 });
                        return;
                    } else if (dupCheck.type === 'WARNING') {
                        if (!confirm("Another school with this name exists in a different location. Confirm to proceed?")) {
                            return;
                        }
                    }
                }
            }
            setCurrentStep(currentStep + 1);
        } else {
            formik.setTouched(
                Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
        }
    };

    const handlePrev = () => setCurrentStep(Math.max(1, currentStep - 1));

    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4">
            {/* Step Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-4 overflow-x-auto pb-2 scrollbar-none">
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex flex-col items-center min-w-[80px]">
                            <span className={`text-[10px] sm:text-xs font-bold mb-2 whitespace-nowrap ${currentStep >= step ? "text-[rgb(32,38,130)]" : "text-gray-400"}`}>
                                {step === 1 && "Identity"}
                                {step === 2 && "Emissions"}
                                {step === 3 && "Waste & Water"}
                                {step === 4 && "Consent"}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all ${
                                currentStep === step ? "bg-[rgb(32,38,130)] border-blue-100 text-white" : 
                                currentStep > step ? "bg-green-500 border-green-100 text-white" : 
                                "bg-white border-gray-100 text-gray-300"
                            }`}>
                                {currentStep > step ? "✓" : step}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-[rgb(32,38,130)] transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }} className="space-y-8">
                {currentStep === 1 && (
                    <StepWrapper title="Step 1: School Identity" icon={<IdentityIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-600 px-1">
                                    <span className="opacity-50"><SchoolIcon /></span>
                                    School Name
                                </label>
                                <SchoolAutocomplete 
                                    value={formik.values.schoolName}
                                    onPlaceSelect={(loc) => {
                                        formik.setFieldValue("schoolName", loc.schoolName);
                                        formik.setFieldValue("address", loc.address);
                                        formik.setFieldValue("city", loc.city);
                                        formik.setFieldValue("pincode", loc.pincode);
                                        formik.setFieldValue("lat", loc.lat);
                                        formik.setFieldValue("lng", loc.lng);
                                        formik.setFieldValue("place_id", loc.place_id);
                                    }}
                                    onManualEntry={(name) => formik.setFieldValue("schoolName", name)}
                                    error={formik.touched.schoolName ? (formik.errors.schoolName as string) : ""}
                                />
                            </div>
                            <InputField label="City" name="city" formik={formik} />
                            <InputField label="Pincode" name="pincode" formik={formik} maxLength={6} />
                            <div className="md:col-span-2">
                                <InputField label="Full Address" name="address" formik={formik} textarea />
                            </div>
                            <InputField label="Contact Person" name="contactPerson" formik={formik} />
                            <InputField label="Phone (10-digit)" name="phone" formik={formik} maxLength={10} />
                            <InputField label="Email Address" name="email" type="email" formik={formik} />
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-500 mb-2 px-1">Project ID</label>
                                <CustomDropdown
                                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                                    value={formik.values.projectId}
                                    onChange={(val) => formik.setFieldValue("projectId", val)}
                                    placeholder="Select Project"
                                    size="lg"
                                    className={formik.touched.projectId && formik.errors.projectId ? "border-red-500 rounded-xl" : ""}
                                />
                                {formik.touched.projectId && formik.errors.projectId && (
                                    <p className="text-xs font-bold text-red-500 px-1">{formik.errors.projectId as string}</p>
                                )}
                            </div>
                        </div>
                    </StepWrapper>
                )}

                {currentStep === 2 && (
                    <StepWrapper title="Step 2: Energy & Emissions" icon={<EnergyIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Students Count (Required)" name="students_count" type="number" formik={formik} />
                            <DropdownField label="Reporting Year" name="reporting_year" options={REPORTING_YEAR_OPTIONS} formik={formik} />
                            
                            <DropdownField label="Action ID" name="action_id" options={actions.map(a => ({ value: a.id, label: `${a.type} - ${a.id}` }))} formik={formik} placeholder="Select Action" />
                            <DropdownField label="Primary Data Source" name="baseline_source" options={BASELINE_SOURCE_OPTIONS} formik={formik} />

                            <div className="md:col-span-2 h-px bg-gray-100 my-4" />

                            <InputField label="Annual Electricity Use (kWh)" name="electricity_kWh_year" type="number" formik={formik} placeholder="Fallback used if blank" />
                            <DropdownField label="Fuel Type" name="fuel_type" options={FUEL_TYPE_OPTIONS} formik={formik} />
                            
                            {formik.values.fuel_type !== "None" && (
                                <InputField label="Annual Fuel (Litres/Kg)" name="fuel_consumption_litres" type="number" formik={formik} />
                            )}

                            <DropdownField label="Renewable Type" name="renewable_energy_type" options={RENEWABLE_TYPE_OPTIONS} formik={formik} />
                            {formik.values.renewable_energy_type !== "None" && (
                                <InputField label="Renewable Gen. (kWh/year)" name="renewable_energy_kwh" type="number" formik={formik} />
                            )}

                            <div className="md:col-span-2 space-y-4">
                                <label className="block text-sm font-bold text-gray-500">Attribution % for Energy: {formik.values.attribution_pct_energy}%</label>
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    className="w-full accent-[rgb(32,38,130)]"
                                    {...formik.getFieldProps("attribution_pct_energy")}
                                />
                                {formik.values.attribution_pct_energy === 0 && (
                                    <p className="text-[10px] text-orange-500 font-bold">Attribution 0% means no climate impact is claimed for this pillar.</p>
                                )}
                            </div>
                        </div>
                    </StepWrapper>
                )}

                {currentStep === 3 && (
                    <StepWrapper title="Step 3: Waste & Water" icon={<WasteIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Waste Generated (kg/year)" name="waste_generated_kg" type="number" formik={formik} />
                            <InputField label="Waste Diverted (kg/year)" name="waste_diverted_kg" type="number" formik={formik} />
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-500 mb-2">Recycling Programs</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {RECYCLING_PROGRAM_OPTIONS.map(opt => (
                                        <label key={opt.value} className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded accent-[rgb(32,38,130)]"
                                                checked={formik.values.recycling_programs.includes(opt.value)}
                                                onChange={(e) => {
                                                    const current = formik.values.recycling_programs;
                                                    if (e.target.checked) {
                                                        formik.setFieldValue("recycling_programs", [...current, opt.value]);
                                                    } else {
                                                        formik.setFieldValue("recycling_programs", current.filter(v => v !== opt.value));
                                                    }
                                                }}
                                            />
                                            <span className="text-xs font-bold text-gray-600">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 h-px bg-gray-100 my-4" />

                            <InputField label="Water Consumption (m3/year)" name="water_consumption_m3" type="number" formik={formik} />
                            
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-500">Attribution % Waste: {formik.values.attribution_pct_waste}%</label>
                                <input type="range" min="0" max="100" className="w-full accent-[rgb(32,38,130)]" {...formik.getFieldProps("attribution_pct_waste")}/>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-500">Attribution % Water: {formik.values.attribution_pct_water}%</label>
                                <input type="range" min="0" max="100" className="w-full accent-[rgb(32,38,130)]" {...formik.getFieldProps("attribution_pct_water")}/>
                            </div>

                            <div className="md:col-span-2">
                                <InputField label="Calculation Notes (Optional)" name="calculation_notes" formik={formik} textarea maxLength={1000} />
                                <div className="text-right text-[10px] font-bold text-gray-400 mt-1">
                                    {formik.values.calculation_notes.length} / 1000
                                </div>
                            </div>
                        </div>
                    </StepWrapper>
                )}

                {currentStep === 4 && (
                    <StepWrapper title="Step 4: Actions & Consent" icon={<RegistryIcon />}>
                        <div className="space-y-8">
                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-center justify-between">
                                <span className="font-bold text-gray-700">Has existing low-carbon actions installed?</span>
                                <button
                                    type="button"
                                    onClick={() => formik.setFieldValue("has_existing_actions", formik.values.has_existing_actions === "Yes" ? "No" : "Yes")}
                                    className={`relative w-14 h-8 rounded-full transition-all ${formik.values.has_existing_actions === "Yes" ? "bg-[rgb(32,38,130)]" : "bg-gray-300"}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${formik.values.has_existing_actions === "Yes" ? "left-7" : "left-1"}`} />
                                </button>
                            </div>

                            {formik.values.has_existing_actions === "Yes" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <DropdownField label="Action Type" name="action_type" options={ACTION_TYPE_OPTIONS} formik={formik} placeholder="Select Type" />
                                    <InputField label="Installation Date" name="installation_date" type="date" formik={formik} />
                                    <div className="sm:col-span-2">
                                        <InputField label="Capacity (e.g. 5kW Solar)" name="capacity_description" formik={formik} />
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        <label className="block text-sm font-bold text-gray-500 px-1">Proof Photo (JPG/PNG only, max 10MB)</label>
                                        <input type="file" onChange={handlePhotoChange} className="hidden" id="photo-upload" accept="image/jpeg,image/png" />
                                        <label htmlFor="photo-upload" className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-8 hover:border-[rgb(32,38,130)] hover:bg-blue-50/20 cursor-pointer transition-all">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="h-40 w-auto rounded-xl object-cover shadow-lg" />
                                            ) : (
                                                <div className="text-center space-y-2">
                                                    <span className="text-3xl">📷</span>
                                                    <p className="text-sm font-bold text-gray-400">Click to upload photo of action</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <DropdownField label="Planned Action Type" name="planned_action_type" options={ACTION_TYPE_OPTIONS} formik={formik} placeholder="Select Type" />
                                    <InputField label="Target Completion Date" name="target_date" type="date" formik={formik} />
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100">
                                <label className="flex gap-4 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        className="w-6 h-6 mt-1 rounded-lg border-2 border-gray-300 accent-[rgb(32,38,130)]"
                                        checked={formik.values.consent_confirmed}
                                        onChange={(e) => formik.setFieldValue("consent_confirmed", e.target.checked)}
                                    />
                                    <span className={`text-sm font-medium leading-relaxed transition-colors ${formik.touched.consent_confirmed && formik.errors.consent_confirmed ? "text-red-500" : "text-gray-500 group-hover:text-gray-800"}`}>
                                        I authorize Earth Carbon Foundation to collect, verify, and publicly display this school's low-carbon action data for transparency and climate accountability purposes.
                                    </span>
                                </label>
                            </div>
                        </div>
                    </StepWrapper>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-8">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="w-full sm:flex-1 px-8 py-5 rounded-2xl bg-gray-100 text-gray-600 font-black hover:bg-gray-200 transition-all active:scale-[0.98]"
                        >
                            Previous
                        </button>
                    )}
                    
                    {currentStep < totalSteps ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="w-full sm:flex-1 px-8 py-5 rounded-2xl bg-[rgb(32,38,130)] text-white font-black shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
                        >
                            Next Step
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:flex-1 px-8 py-5 rounded-2xl bg-[rgb(32,38,130)] text-white font-black shadow-xl shadow-blue-900/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-3"
                        >
                            {submitting ? <Spinner size="sm" light /> : "Pay Rs.199 and Register"}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

function StepWrapper({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 border border-gray-100 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black text-white bg-[rgb(32,38,130)] -mx-8 -mt-8 p-6 rounded-t-[2.5rem] flex items-center gap-3">
                <span className="p-2 bg-white/20 rounded-lg">{icon}</span>
                {title}
            </h2>
            <div className="px-2">{children}</div>
        </div>
    );
}

function InputField({ label, name, type = "text", formik, textarea = false, placeholder = "", icon, maxLength }: any) {
    const error = formik.touched[name] && formik.errors[name];
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-600 px-1">
                {icon && <span className="opacity-50">{icon}</span>}
                {label}
            </label>
            {textarea ? (
                <textarea
                    name={name}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 transition-all outline-none font-semibold text-gray-900 min-h-[140px] text-lg ${
                        error ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[rgb(32,38,130)] focus:bg-white"
                    }`}
                    {...formik.getFieldProps(name)}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    className={`w-full px-5 py-4 bg-gray-50 rounded-2xl border-2 transition-all outline-none font-semibold text-gray-900 text-lg ${
                        error ? "border-red-500 bg-red-50" : "border-gray-200 focus:border-[rgb(32,38,130)] focus:bg-white"
                    }`}
                    {...formik.getFieldProps(name)}
                />
            )}
            {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
        </div>
    );
}

function DropdownField({ label, name, options, formik, placeholder = "Select option" }: any) {
    const error = formik.touched[name] && formik.errors[name];
    return (
        <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-500 px-1">{label}</label>
            <CustomDropdown
                options={options}
                value={formik.values[name]}
                onChange={(val) => formik.setFieldValue(name, val)}
                placeholder={placeholder}
                size="lg"
                className={error ? "border-red-500 rounded-xl" : ""}
            />
            {error && <p className="text-xs font-bold text-red-500 px-1">{error}</p>}
        </div>
    );
}

// Icons
const SchoolIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 10-10-5L2 10l10 5 10-5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
);
const IdentityIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
);
const EnergyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);
const WasteIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
);
const RegistryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

