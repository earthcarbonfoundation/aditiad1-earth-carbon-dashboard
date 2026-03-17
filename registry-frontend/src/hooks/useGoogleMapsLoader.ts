import { useJsApiLoader, Libraries } from "@react-google-maps/api";

// CRITICAL: This must be defined OUTSIDE the hook at module scope.
// If defined inside the hook body, a new array is created on every render,
// which causes @react-google-maps/api to detect "different options" and
// reload the script on every render → infinite loop → Razorpay modal breaks.
const GOOGLE_MAPS_LIBRARIES: Libraries = ["places"];

/**
 * Shared hook for Google Maps API loading
 * Ensures the API is loaded only once across the entire app
 * This prevents "Loader must not be called again with different options" errors
 */
export const useGoogleMapsLoader = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: "en",
  });

  return { isLoaded, loadError };
};
