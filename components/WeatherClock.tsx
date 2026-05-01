import React, { useState, useEffect } from 'react';
import {
    Cloud,
    Sun,
    CloudRain,
    CloudSnow,
    CloudLightning,
    CloudDrizzle,
    CloudFog,
    Droplets,
    Wind,
    MapPin,
    Clock,
    Calendar,
} from 'lucide-react';

interface WeatherData {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    isDay: boolean;
}

const WEATHER_DESCRIPTIONS: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Dense Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    80: 'Light Showers',
    81: 'Showers',
    82: 'Heavy Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm + Hail',
    99: 'Severe Thunderstorm',
};

const getWeatherIcon = (code: number, size: number = 16) => {
    if (code === 0 || code === 1) return <Sun size={size} className="text-amber-400" />;
    if (code === 2 || code === 3) return <Cloud size={size} className="text-slate-400" />;
    if (code === 45 || code === 48) return <CloudFog size={size} className="text-slate-400" />;
    if (code >= 51 && code <= 55) return <CloudDrizzle size={size} className="text-blue-400" />;
    if (code >= 61 && code <= 65) return <CloudRain size={size} className="text-blue-500" />;
    if (code >= 71 && code <= 75) return <CloudSnow size={size} className="text-cyan-300" />;
    if (code >= 80 && code <= 82) return <CloudRain size={size} className="text-blue-500" />;
    if (code >= 95) return <CloudLightning size={size} className="text-yellow-500" />;
    return <Sun size={size} className="text-amber-400" />;
};

export const WeatherClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [location, setLocation] = useState('Namhsan');
    const [isLoading, setIsLoading] = useState(true);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch weather data
    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,is_day&timezone=auto`
                );
                const data = await res.json();
                if (data.current) {
                    setWeather({
                        temperature: Math.round(data.current.temperature_2m),
                        weatherCode: data.current.weather_code,
                        windSpeed: Math.round(data.current.wind_speed_10m),
                        humidity: data.current.relative_humidity_2m,
                        isDay: data.current.is_day === 1,
                    });
                }
            } catch (err) {
                console.error('Weather fetch failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation('Current Location');
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                () => {
                    fetchWeather(23.7667, 97.3667);
                },
                { timeout: 5000 }
            );
        } else {
            fetchWeather(23.7667, 97.3667);
        }

        const weatherInterval = setInterval(() => {
            fetchWeather(23.7667, 97.3667);
        }, 15 * 60 * 1000);

        return () => clearInterval(weatherInterval);
    }, []);

    const formatTime = (d: Date) => {
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatSeconds = (d: Date) => {
        return String(d.getSeconds()).padStart(2, '0');
    };

    const formatDate = (d: Date) => {
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    const weatherDesc = weather ? (WEATHER_DESCRIPTIONS[weather.weatherCode] || 'Unknown') : '';

    return (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm">
            {/* Clock */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center relative">
                    <Clock size={14} className="text-white" />
                    {/* Seconds ring */}
                    <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                            background: `conic-gradient(#3b82f6 ${(time.getSeconds() / 60) * 360}deg, transparent 0deg)`,
                            mask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
                            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1.5px))',
                        }}
                    />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-black text-slate-900 tabular-nums leading-none">
                            {formatTime(time)}
                        </span>
                        <span className="text-[8px] font-bold text-blue-500 tabular-nums">
                            :{formatSeconds(time)}
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">
                        {formatDate(time)}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200" />

            {/* Weather */}
            {isLoading ? (
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-[9px] text-slate-400 font-bold">...</span>
                </div>
            ) : weather ? (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center">
                        {getWeatherIcon(weather.weatherCode, 18)}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 leading-none">
                                {weather.temperature}°C
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 leading-none">
                                {weatherDesc}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                                <Droplets size={8} className="text-blue-400" />
                                <span className="text-[8px] font-bold text-slate-400">{weather.humidity}%</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Wind size={8} className="text-slate-400" />
                                <span className="text-[8px] font-bold text-slate-400">{weather.windSpeed}km/h</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <MapPin size={7} className="text-slate-300" />
                                <span className="text-[8px] font-bold text-slate-300">{location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
};
