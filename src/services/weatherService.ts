// WeatherAPI.com Service (Free Plan - 1 million calls/month)
// Optimized for Agriculture with 7-day forecast
const WEATHERAPI_KEY = 'd2b34665b09c495ebed151113250911';
const BASE_URL = 'https://api.weatherapi.com/v1';

export interface CurrentWeather {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  feelsLike: number;
  uvIndex?: number;
  dewPoint?: number;
  cloudCover?: number;
  rainfall?: number;
  soilTemp?: number;
}

export interface ForecastDay {
  day: string;
  temp: number;
  condition: string;
  icon: string;
  minTemp: number;
  maxTemp: number;
  date: string;
  humidity: number;
  windSpeed: number;
  pop: number; // Probability of precipitation
  rain?: number;
  uvIndex?: number;
}

export interface AgriculturalData {
  soilMoisture: string;
  irrigationRecommendation: string;
  pestRisk: string;
  plantingCondition: string;
}

// Get weather data from WeatherAPI.com (includes current + 7-day forecast in one call)
export const getWeatherAPIData = async (city: string) => {
  try {
    // WeatherAPI provides current + forecast in single call
    const response = await fetch(
      `${BASE_URL}/forecast.json?key=${WEATHERAPI_KEY}&q=${city}&days=7&aqi=no&alerts=yes`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
};

// Parse current weather data (WeatherAPI format)
export const parseCurrentWeather = (data: any): CurrentWeather | null => {
  if (!data || !data.current) return null;
  
  const current = data.current;
  return {
    temp: Math.round(current.temp_c),
    condition: current.condition?.text || 'Unknown',
    humidity: current.humidity,
    windSpeed: Math.round(current.wind_kph),
    visibility: Math.round(current.vis_km),
    pressure: Math.round(current.pressure_mb),
    feelsLike: Math.round(current.feelslike_c),
    cloudCover: current.cloud || 0,
    rainfall: current.precip_mm || 0,
    uvIndex: current.uv || 0,
    dewPoint: Math.round(current.dewpoint_c || 0),
  };
};

// Parse daily forecast (WeatherAPI format - 7 day forecast)
export const parseForecast = (data: any): ForecastDay[] => {
  if (!data || !data.forecast || !data.forecast.forecastday) return [];
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return data.forecast.forecastday.map((day: any) => {
    const date = new Date(day.date);
    const dayName = daysOfWeek[date.getDay()];
    
    return {
      day: dayName,
      temp: Math.round((day.day.maxtemp_c + day.day.mintemp_c) / 2),
      condition: day.day.condition?.text || 'Unknown',
      icon: day.day.condition?.icon || '',
      minTemp: Math.round(day.day.mintemp_c),
      maxTemp: Math.round(day.day.maxtemp_c),
      date: day.date,
      humidity: day.day.avghumidity,
      windSpeed: Math.round(day.day.maxwind_kph),
      pop: day.day.daily_chance_of_rain || 0,
      rain: day.day.totalprecip_mm || 0,
      uvIndex: day.day.uv || 0,
    };
  });
};

// Calculate agricultural recommendations
export const getAgriculturalAdvice = (current: CurrentWeather, forecast: ForecastDay[]): AgriculturalData => {
  const advice: AgriculturalData = {
    soilMoisture: 'Moderate',
    irrigationRecommendation: 'Normal irrigation schedule',
    pestRisk: 'Low',
    plantingCondition: 'Good',
  };

  // Soil moisture estimation based on recent rainfall and humidity
  if (current.rainfall && current.rainfall > 5) {
    advice.soilMoisture = 'High';
    advice.irrigationRecommendation = 'Reduce irrigation for 2-3 days';
  } else if (current.humidity < 40) {
    advice.soilMoisture = 'Low';
    advice.irrigationRecommendation = 'Increase irrigation frequency';
  }

  // Pest risk based on temperature and humidity
  if (current.temp > 25 && current.humidity > 70) {
    advice.pestRisk = 'High - Monitor crops closely';
  } else if (current.temp > 20 && current.humidity > 60) {
    advice.pestRisk = 'Moderate - Regular monitoring';
  }

  // Planting conditions
  const upcomingRain = forecast.slice(0, 3).some(day => day.pop > 50);
  if (upcomingRain) {
    advice.plantingCondition = 'Wait - Rain expected soon';
  } else if (current.temp < 10 || current.temp > 35) {
    advice.plantingCondition = 'Poor - Extreme temperature';
  } else if (current.humidity > 80) {
    advice.plantingCondition = 'Fair - High humidity';
  }

  return advice;
};

// Main function to get all weather data for agriculture
export const getWeatherData = async (city: string = 'Kathmandu') => {
  try {
    // WeatherAPI provides current + forecast in one call
    const weatherData = await getWeatherAPIData(city);
    
    if (!weatherData) {
      throw new Error('Failed to fetch weather data');
    }

    const current = parseCurrentWeather(weatherData);
    const forecast = parseForecast(weatherData);
    const agricultural = current ? getAgriculturalAdvice(current, forecast) : null;
    
    return {
      current,
      forecast,
      agricultural,
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return {
      current: null,
      forecast: [],
      agricultural: null,
    };
  }
};
