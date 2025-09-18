import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { WasteReport } from '../pages/Index';
import { supabase } from '../integrations/supabase/client';

interface RoutePoint {
  lat: number;
  lng: number;
  address: string;
  isStart?: boolean;
}

interface GoogleMapProps {
  reports: WasteReport[];
  onReportSelect: (report: WasteReport) => void;
  center?: { lat: number; lng: number } | null;
  routePoints?: RoutePoint[];
  showRoute?: boolean;
}

const GoogleMap = ({ reports, onReportSelect, center, routePoints, showRoute }: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusColors = {
    dirty: '#ef4444',        // Red for dirty/reported waste
    cleaning: '#eab308',     // Yellow for cleaning in progress
    cleaned: '#10b981',      // Green for cleaned waste
    'in-progress': '#3b82f6', // Blue for in progress
    completed: '#059669',     // Dark green for completed
  };

  const statusLabels = {
    dirty: 'Needs Cleaning',
    cleaning: 'Being Cleaned',
    cleaned: 'Recently Cleaned',
    'in-progress': 'In Progress',
    completed: 'Completed',
  };

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Fetch API key from edge function
        const { data, error: functionError } = await supabase.functions.invoke('get-google-maps-key');
        
        if (functionError) throw functionError;
        if (!data?.apiKey) throw new Error('No API key received');

        const loader = new Loader({
          apiKey: data.apiKey,
          version: 'weekly',
          libraries: ['maps']
        });

        await loader.load();

        const defaultCenter = center || { lat: 19.8762, lng: 75.3433 }; // Aurangabad, Maharashtra, India

        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom: 12,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.panTo(center);
      mapInstanceRef.current.setZoom(15);
    }
  }, [center]);

  // Update markers when reports change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    reports.forEach((report) => {
      const color = statusColors[report.status as keyof typeof statusColors] || '#6b7280';

      const marker = new google.maps.Marker({
        position: { lat: report.location.lat, lng: report.location.lng },
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8
        },
        title: report.category
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${report.category}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${report.location.address}</p>
            <p style="margin: 0; font-size: 12px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: ${color}; border-radius: 50%; margin-right: 4px;"></span>
              ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker);
        onReportSelect(report);
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (reports.length > 0 && mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      reports.forEach(report => {
        bounds.extend({ lat: report.location.lat, lng: report.location.lng });
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [reports, onReportSelect]);

  // Handle route visualization
  useEffect(() => {
    if (!mapInstanceRef.current || !showRoute || !routePoints || routePoints.length < 2) {
      // Clear existing route
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    if (!directionsRenderer.current) {
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#4285f4',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      });
    }

    directionsRenderer.current.setMap(mapInstanceRef.current);

    // Create waypoints (all points except first and last)
    const waypoints = routePoints.slice(1, -1).map(point => ({
      location: { lat: point.lat, lng: point.lng },
      stopover: true
    }));

    const request: google.maps.DirectionsRequest = {
      origin: { lat: routePoints[0].lat, lng: routePoints[0].lng },
      destination: { lat: routePoints[routePoints.length - 1].lat, lng: routePoints[routePoints.length - 1].lng },
      waypoints: waypoints,
      optimizeWaypoints: false, // We already optimized the order
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && directionsRenderer.current) {
        directionsRenderer.current.setDirections(result);
      } else {
        console.error('Directions request failed due to:', status);
      }
    });

  }, [routePoints, showRoute]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
      <div ref={mapRef} className="w-full h-full" />
      {isLoading && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg shadow-md">
          <p className="text-xs">{error}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;
