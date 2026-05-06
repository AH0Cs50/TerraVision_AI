import { weatherService } from '../shared/container.js';

const weatherLocation = {
    city:'gaza',
    coordinates: null,
}

weatherService.getWeather(weatherLocation).then(console.log);

