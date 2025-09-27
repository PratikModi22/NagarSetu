export interface IPLocation {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
}

export class IPGeolocationService {
  private static async fetchIPLocation(): Promise<IPLocation> {
    try {
      // Using ipapi.co - free tier with rate limits
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) {
        throw new Error("Failed to fetch IP location");
      }

      const data = await response.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        region: data.region,
        country: data.country_name,
      };
    } catch (error) {
      console.error("Error fetching IP location:", error);
      throw error;
    }
  }

  static async getLocation(): Promise<IPLocation> {
    return await this.fetchIPLocation();
  }

  static formatAddress(location: IPLocation): string {
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);

    return parts.length > 0
      ? parts.join(", ")
      : `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }
}
