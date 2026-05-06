//infra services
import TokenService from '../service/common/token.service.js';
import PasswordHasher from '../service/common/passHash.service.js';

//domain 
import UserService from '../service/user.service.js'
import AuthService from '../service/auth.service.js';
import WeatherService from '../service/weather.service.js'

//ensure dependency injection
//infrastructure
export const tokenService = new TokenService();
export const passHasher = new PasswordHasher(); 

//domain services
export const userService = new UserService();
export const authService = new AuthService(tokenService,userService,passHasher);
export const weatherService = new WeatherService();
