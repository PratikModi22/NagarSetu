import React, { useState } from "react";
import { Camera, MapPin, Upload, AlertCircle } from "lucide-react";
import { WasteReport } from "../pages/Index";
import { Label } from "@/components/ui/label";
import { logIssue } from "../contract.ts";
import { IPGeolocationService } from "../services/ipGeolocationService";
import { BlockchainRetryService } from "../services/blockchainRetryService";

interface UploadScreenProps {
  onAddReport: (
    report: Omit<WasteReport, "id" | "reportedAt" | "updatedAt">
  ) => Promise<WasteReport | null>;
  onNavigate: (screen: "home" | "map") => void;
  uploadImage: (file: File) => Promise<string | null>;
}

const UploadScreen = ({
  onAddReport,
  onNavigate,
  uploadImage,
}: UploadScreenProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [category, setCategory] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "Plastic Waste",
    "Food Waste",
    "Paper Waste",
    "Glass Waste",
    "Metal Waste",
    "Electronic Waste",
    "Hazardous Waste",
    "Other",
  ];

  const fallbackToIPLocation = async () => {
    try {
      console.log("📍 Attempting IP-based location...");
      const ipLocation = await IPGeolocationService.getLocation();
      const address = IPGeolocationService.formatAddress(ipLocation);

      console.log("✅ Got IP-based location:", {
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
        address,
      });

      setLocation({
        lat: ipLocation.latitude,
        lng: ipLocation.longitude,
        address,
      });

      setIsGettingLocation(false);
      setError(""); // Clear error since we got a location
    } catch (error) {
      console.error("❌ IP location fallback failed:", error);
      setError(
        "Could not determine your location. Please try again later or enter it manually."
      );
      setIsGettingLocation(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentLocation = async () => {
    console.log("🗺️ Getting current location...");

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser. Please try Chrome, Firefox, or Edge."
      );
      return;
    }

    setIsGettingLocation(true);
    setError("");

    try {
      // First check if permission is already denied
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      if (permission.state === "denied") {
        setError(
          "Location access is blocked. Please follow these steps:\n\n" +
            "For Chrome:\n" +
            "1. Click the lock/shield icon (🔒) in the address bar\n" +
            "2. Click 'Site settings'\n" +
            "3. Find 'Location' and change it to 'Allow'\n" +
            "4. Refresh the page\n\n" +
            "For Firefox:\n" +
            "1. Click the lock icon (🔒) in the address bar\n" +
            "2. Click the × next to 'Block Location'\n" +
            "3. Refresh the page\n\n" +
            "For Edge:\n" +
            "1. Click the lock icon (🔒) in the address bar\n" +
            "2. Click 'Permissions'\n" +
            "3. Allow 'Location'\n" +
            "4. Refresh the page\n\n" +
            "Also check if location services are enabled in your system settings."
        );
        setIsGettingLocation(false);
        return;
      }

      // Try low accuracy first for faster response and better compatibility
      const options = {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      const handleSuccess = (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        console.log("📍 Got coordinates:", { latitude, longitude });

        // Use coordinates immediately as fallback
        const coordinateAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(
          6
        )}`;
        setLocation({
          lat: latitude,
          lng: longitude,
          address: coordinateAddress,
        });

        // Try to get human-readable address
        reverseGeocode(latitude, longitude);
        setIsGettingLocation(false);
      };

      const handleError = (error: GeolocationPositionError) => {
        console.error("❌ Error getting location:", error);
        let errorMessage = "";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access was denied. Please follow these steps to enable location:" +
              "\n• Click the lock/info icon in your browser's address bar (🔒)" +
              '\n• Find "Location" or "Site Settings"' +
              "\n• Allow location access for this site" +
              "\n• Refresh the page and try again" +
              "\n\nIf you still have issues, check if location services are enabled in your system settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              "GPS location unavailable. Attempting to use IP-based location...";
            // Fall back to IP-based location
            fallbackToIPLocation();
            break;
          case error.TIMEOUT:
            // If low accuracy times out, try with high accuracy
            if (!options.enableHighAccuracy) {
              options.enableHighAccuracy = true;
              options.timeout = 20000; // Give more time for high accuracy
              navigator.geolocation.getCurrentPosition(
                handleSuccess,
                handleError,
                options
              );
              return;
            }
            errorMessage =
              "GPS timeout. Attempting to use IP-based location...";
            // Fall back to IP-based location
            fallbackToIPLocation();
            break;
          default:
            errorMessage = "GPS error. Attempting to use IP-based location...";
            // Fall back to IP-based location
            fallbackToIPLocation();
            break;
        }

        setError(errorMessage);
      };

      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (error) {
      console.error("Error checking permissions:", error);
      setError(
        "Unable to access location services. Please check your browser settings."
      );
      setIsGettingLocation(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const address = await import("../services/geocodingService").then(
        ({ GeocodingService }) =>
          GeocodingService.reverseGeocode(latitude, longitude)
      );

      if (address) {
        console.log("✅ Geocoding successful:", address);
        setLocation((prev) =>
          prev
            ? {
                ...prev,
                address,
              }
            : null
        );
      } else {
        console.log("⚠️ Geocoding failed, keeping coordinates");
      }
    } catch (error) {
      console.error("❌ Error in reverse geocoding:", error);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedImage || !location || !category) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadImage(selectedImage);

      if (!imageUrl) {
        setError("Failed to upload image. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Create report
      const newReport = await onAddReport({
        image: imageUrl,
        location,
        status: "dirty",
        category,
        remarks,
      });

      if (newReport) {
        console.log("Report submitted successfully:", newReport);

        // Ask user if they want to log on blockchain
        const shouldLog = window.confirm(
          "Do you want to log this report on the blockchain? (Requires wallet connection)"
        );

        if (shouldLog) {
          try {
            const result = await logIssue(
              newReport.id,
              `${newReport.location.lat},${newReport.location.lng}`,
              `${category}${remarks ? ": " + remarks : ""}`,
              newReport.status,
              newReport.image,
              0, // Initial upvotes
              "" // TODO: Add user email if available
            );
            console.log("Successfully logged to blockchain");
            onNavigate("map");
          } catch (error: any) {
            console.error("Failed to log to blockchain:", error);

            // If provider/circuit-breaker-like error, enqueue for retry and notify user
            const msg = error?.message || "";
            if (
              msg.toLowerCase().includes("circuit breaker") ||
              msg.toLowerCase().includes("rpc error") ||
              msg.toLowerCase().includes("internal json-rpc error") ||
              msg.toLowerCase().includes("provider temporarily blocked")
            ) {
              // enqueue for retry
              BlockchainRetryService.enqueue({
                id: newReport.id,
                location: `${newReport.location.lat},${newReport.location.lng}`,
                description: `${category}${remarks ? ": " + remarks : ""}`,
                status: newReport.status,
                imageUrl: newReport.image,
                reporterEmail: "",
              });

              // Ask user to retry now
              const retryNow = window.confirm(
                "Logging to blockchain failed due to a temporary provider error. Would you like to retry now?"
              );
              if (retryNow) {
                try {
                  await BlockchainRetryService.retryAll();
                  onNavigate("map");
                  return;
                } catch (e) {
                  console.error("Retry attempt failed:", e);
                  setError(
                    "Retry failed. Your report is queued and will be retried automatically later."
                  );
                  return;
                }
              }

              setError(
                "Blockchain logging is queued and will be retried automatically. You can also retry from the admin panel later."
              );
              return;
            }

            setError(
              `Failed to log to blockchain: ${error.message}. Please ensure your wallet is connected and try again.`
            );
            return;
          }
        } else {
          // If not logging to blockchain, just navigate
          onNavigate("map");
        }

        // Reset form
        setSelectedImage(null);
        setImagePreview("");
        setLocation(null);
        setCategory("");
        setRemarks("");
        // Navigation will happen above
      } else {
        setError("Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      setError("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Report Waste
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                <div className="text-red-700 whitespace-pre-line">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div>
                <Label htmlFor="upload-label">Upload Photo *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors bg-gray-50">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto max-h-64 rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview("");
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Camera className="mx-auto h-16 w-16 text-emerald-400 mb-6" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center space-x-2 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-colors shadow-md font-medium"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Capture Photo</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                        Use your camera to capture a clear photo of the waste
                        area.
                        <br />
                        Make sure the waste is clearly visible in good lighting.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                {location ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-start space-x-2 text-emerald-700">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-medium block">
                          {location.address}
                        </span>
                        <span className="text-xs text-emerald-600">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocation(null)}
                      className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Change Location
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-emerald-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGettingLocation ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        <span className="text-gray-600">
                          Getting location...
                        </span>
                      </div>
                    ) : (
                      <>
                        <MapPin className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-gray-600">
                          Get Current Location
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Click to use your device's GPS
                        </p>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waste Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Any additional details about the waste..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !selectedImage || !location || !category
                  }
                  className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Report</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
