import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WasteReport } from '@/pages/Index';
import { MapPin, Navigation, Route, Clock, MapIcon } from 'lucide-react';
import { GeocodingService } from '@/services/geocodingService';
import GoogleMap from '@/components/GoogleMap';

interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  address: string;
  report?: WasteReport;
  isStart?: boolean;
}

interface OptimizedRoute {
  points: RoutePoint[];
  totalDistance: number;
  estimatedTime: number;
  order: number[];
}

interface RouteOptimizerProps {
  reports: WasteReport[];
}

// Traveling Salesman Problem solver using nearest neighbor heuristic
class TSPSolver {
  private static calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLng = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLng/2) * Math.sin(dLng/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  static solveNearestNeighbor(points: RoutePoint[], startIndex: number = 0): OptimizedRoute {
    if (points.length < 2) {
      return {
        points: points,
        totalDistance: 0,
        estimatedTime: 0,
        order: [0]
      };
    }

    const visited = new Set<number>();
    const route: number[] = [];
    let currentIndex = startIndex;
    let totalDistance = 0;

    visited.add(currentIndex);
    route.push(currentIndex);

    while (visited.size < points.length) {
      let nearestIndex = -1;
      let nearestDistance = Infinity;

      for (let i = 0; i < points.length; i++) {
        if (!visited.has(i)) {
          const distance = this.calculateDistance(points[currentIndex], points[i]);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      if (nearestIndex !== -1) {
        visited.add(nearestIndex);
        route.push(nearestIndex);
        totalDistance += nearestDistance;
        currentIndex = nearestIndex;
      }
    }

    const orderedPoints = route.map(index => points[index]);
    const estimatedTime = Math.ceil(totalDistance / 30 * 60); // Assuming 30km/h average speed

    return {
      points: orderedPoints,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedTime,
      order: route
    };
  }

  // Advanced 2-opt optimization for better routes
  static optimize2Opt(route: OptimizedRoute, points: RoutePoint[]): OptimizedRoute {
    let bestRoute = route.order.slice();
    let bestDistance = route.totalDistance;
    let improved = true;

    while (improved) {
      improved = false;
      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          if (j - i === 1) continue; // Skip adjacent edges

          const newRoute = bestRoute.slice();
          // Reverse the segment between i and j
          const segment = newRoute.slice(i, j + 1).reverse();
          newRoute.splice(i, j - i + 1, ...segment);

          // Calculate new distance
          let newDistance = 0;
          for (let k = 0; k < newRoute.length - 1; k++) {
            newDistance += this.calculateDistance(points[newRoute[k]], points[newRoute[k + 1]]);
          }

          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
          }
        }
      }
    }

    return {
      points: bestRoute.map(index => points[index]),
      totalDistance: Math.round(bestDistance * 100) / 100,
      estimatedTime: Math.ceil(bestDistance / 30 * 60),
      order: bestRoute
    };
  }
}

const RouteOptimizer = ({ reports }: RouteOptimizerProps) => {
  const [collectionReports, setCollectionReports] = useState<WasteReport[]>([]);
  const [startLocation, setStartLocation] = useState<string>('');
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 }); // Delhi default

  useEffect(() => {
    // Filter reports that need collection (dirty, cleaning, in-progress)
    const needCollection = reports.filter(report => 
      ['dirty', 'cleaning', 'in-progress'].includes(report.status)
    );
    setCollectionReports(needCollection);
  }, [reports]);

  const handleSetStartLocation = async () => {
    if (!startLocation.trim()) return;

    try {
      const location = await GeocodingService.searchLocation(startLocation);
      if (location) {
        const newStartPoint: RoutePoint = {
          id: 'start',
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          isStart: true
        };
        setStartPoint(newStartPoint);
        setMapCenter({ lat: location.lat, lng: location.lng });
      }
    } catch (error) {
      console.error('Error setting start location:', error);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!startPoint || collectionReports.length === 0) return;

    setIsOptimizing(true);

    try {
      // Convert reports to route points
      const reportPoints: RoutePoint[] = collectionReports.map(report => ({
        id: report.id,
        lat: report.location.lat,
        lng: report.location.lng,
        address: report.location.address,
        report
      }));

      // Add start point
      const allPoints = [startPoint, ...reportPoints];
      setRoutePoints(allPoints);

      // Solve TSP with nearest neighbor
      let route = TSPSolver.solveNearestNeighbor(allPoints, 0);

      // Optimize with 2-opt if there are enough points
      if (allPoints.length > 4) {
        route = TSPSolver.optimize2Opt(route, allPoints);
      }

      setOptimizedRoute(route);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const address = await GeocodingService.reverseGeocode(latitude, longitude);
            const newStartPoint: RoutePoint = {
              id: 'start',
              lat: latitude,
              lng: longitude,
              address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              isStart: true
            };
            setStartPoint(newStartPoint);
            setMapCenter({ lat: latitude, lng: longitude });
            setStartLocation(newStartPoint.address);
          } catch (error) {
            console.error('Error getting current location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="startLocation">Starting Location</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="startLocation"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Enter address or landmark"
                  onKeyPress={(e) => e.key === 'Enter' && handleSetStartLocation()}
                />
                <Button onClick={handleSetStartLocation} size="sm">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleUseCurrentLocation}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use Current Location
              </Button>
            </div>

            {startPoint && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-green-700">Start Point Set</p>
                <p className="text-xs text-muted-foreground">{startPoint.address}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reports to Collect:</span>
              <Badge variant="secondary">{collectionReports.length}</Badge>
            </div>

            <Button
              onClick={handleOptimizeRoute}
              disabled={!startPoint || collectionReports.length === 0 || isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Route className="h-4 w-4 mr-2" />
              )}
              {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
            </Button>
          </CardContent>
        </Card>

        {/* Route Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Route Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optimizedRoute ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{optimizedRoute.totalDistance}km</p>
                    <p className="text-xs text-muted-foreground">Total Distance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{optimizedRoute.estimatedTime}min</p>
                    <p className="text-xs text-muted-foreground">Estimated Time</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Collection Order:</h4>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {optimizedRoute.points.map((point, index) => (
                      <div key={point.id} className="flex items-start gap-2 p-2 bg-muted rounded text-xs">
                        <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                        <div className="flex-1">
                          <p className="font-medium">
                            {point.isStart ? 'Start Point' : point.report?.category}
                          </p>
                          <p className="text-muted-foreground truncate">{point.address}</p>
                          {point.report && (
                            <Badge 
                              variant="secondary" 
                              className="mt-1 text-xs"
                            >
                              {point.report.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Set start location and optimize to see route details</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Collection Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dirty Reports:</span>
                  <Badge variant="destructive">
                    {reports.filter(r => r.status === 'dirty').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Progress:</span>
                  <Badge variant="secondary">
                    {reports.filter(r => ['cleaning', 'in-progress'].includes(r.status)).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completed:</span>
                  <Badge variant="default">
                    {reports.filter(r => ['cleaned', 'completed'].includes(r.status)).length}
                  </Badge>
                </div>
              </div>

              {optimizedRoute && (
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Route Efficiency</p>
                    <div className="text-lg font-bold text-green-600">
                      {Math.round(collectionReports.length / optimizedRoute.estimatedTime * 60)}
                    </div>
                    <p className="text-xs text-muted-foreground">reports/hour</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Display */}
      <Card>
        <CardHeader>
          <CardTitle>Route Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <GoogleMap
              reports={optimizedRoute ? optimizedRoute.points.filter(p => p.report).map(p => p.report!) : collectionReports}
              onReportSelect={() => {}}
              center={mapCenter}
              routePoints={optimizedRoute ? optimizedRoute.points : undefined}
              showRoute={!!optimizedRoute}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteOptimizer;
