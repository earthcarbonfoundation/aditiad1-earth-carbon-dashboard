import { useEffect, useRef, useState } from "react";
import { useGoogleMapsLoader } from "./useGoogleMapsLoader";

interface UseSchoolAutocompleteProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceSelect?: (location: any) => void;
}

export const useSchoolAutocomplete = ({
  value,
  onChange,
  onPlaceSelect,
}: UseSchoolAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value || "");
  const [isValidSelection, setIsValidSelection] = useState(!!value);
  const [lastValidValue, setLastValidValue] = useState(value || "");

  const onPlaceSelectRef = useRef(onPlaceSelect);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
    onChangeRef.current = onChange;
  });

  const { isLoaded, loadError } = useGoogleMapsLoader();

  const prevValueProp = useRef(value);
  useEffect(() => {
    // Only update internal state if the prop changed from its previous value
    // AND it's different from our current internal state
    if (value !== prevValueProp.current && value !== inputValue) {
      setInputValue(value || "");
      setLastValidValue(value || "");
      setIsValidSelection(true);
    }
    prevValueProp.current = value;
  }, [value, inputValue]);

  useEffect(() => {
    if (!isLoaded) return () => {};
    const currentInput = inputRef.current;
    if (!currentInput) return () => {};

    // Gujarat, India (lat: 22.2587, lng: 71.1924, radius: 300000m)
    const gujaratBounds = new window.google.maps.Circle({
      center: { lat: 22.2587, lng: 71.1924 },
      radius: 300000,
    }).getBounds();

    const autocomplete = new window.google.maps.places.Autocomplete(
      currentInput,
      {
        types: ["school"],
        bounds: gujaratBounds || undefined,
        componentRestrictions: { country: "in" },
        fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
      },
    );

    const handlePlaceChanged = () => {
      const place = autocomplete.getPlace();
      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      let city = "";
      let pincode = "";
      
      if (place.address_components) {
        place.address_components.forEach((component: any) => {
            if (component.types.includes("locality")) city = component.long_name;
            if (component.types.includes("postal_code")) pincode = component.long_name;
        });
      }

      const location = {
        schoolName: place.name || "",
        address: place.formatted_address || "",
        city: city,
        pincode: pincode,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        place_id: place.place_id,
      };

      setInputValue(place.name || "");
      setLastValidValue(place.name || "");
      setIsValidSelection(true);

      onPlaceSelectRef.current?.(location);
    };

    const listener = autocomplete.addListener("place_changed", handlePlaceChanged);

    return () => {
      const pacContainers = document.querySelectorAll(".pac-container");
      pacContainers.forEach((container) => container.remove());
      window.google.maps.event.removeListener(listener);
    };
  }, [isLoaded]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.trim() === "") {
      setIsValidSelection(true);
      setLastValidValue("");
    } else {
      setIsValidSelection(false);
    }

    onChangeRef.current?.(e);
  };

  return {
    inputRef,
    inputValue,
    isValidSelection,
    handleInputChange,
    isLoaded,
    loadError,
  };
};
