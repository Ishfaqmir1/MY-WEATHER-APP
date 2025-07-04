const apiKey = '9af691e3e74abab55fecb8e1e71db2c0';

const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const currentLocationBtn = document.getElementById('currentLocationBtn');
const recentWrapper = document.getElementById('recentWrapper');
const recentSelect = document.getElementById('recentSelect');
const weatherIcon = document.getElementById('weatherIcon');
const tempDisplay = document.getElementById('tempDisplay');
const description = document.getElementById('description');
const date = document.getElementById('date');
const locationDisplay = document.getElementById('location');
const wind = document.getElementById('wind');
const windDir = document.getElementById('windDir');
const humidity = document.getElementById('humidity');
const humidityBar = document.getElementById('humidityBar');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecastContainer');
const errorBox = document.getElementById('error');

//  Search + Geolocation
searchBtn.onclick = () => {
  const city = cityInput.value.trim();
  if (!city) return showError("Please enter a city");
  fetchWeather(city);
};

currentLocationBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(
    pos => fetchCoords(pos.coords.latitude, pos.coords.longitude),
    () => showError("Location access denied.")
  );
};

recentSelect.onchange = () => fetchWeather(recentSelect.value);

cityInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') searchBtn.click();
});

//  API Calls
function fetchWeather(city) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) return showError(data.message);
      renderWeather(data);
      fetchForecast(data.name);
      saveCity(data.name);
    })
    .catch(() => showError("API error"));
}

function fetchCoords(lat, lon) {
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      renderWeather(data);
      fetchForecast(data.name);
      saveCity(data.name);
    });
}

function fetchForecast(city) {
  forecastContainer.innerHTML = '';
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const days = {};
      data.list.forEach(item => {
        const d = item.dt_txt.split(' ')[0];
        if (!days[d]) days[d] = item;
      });

      Object.keys(days).slice(1, 6).forEach(d => {
        const f = days[d];
        const div = document.createElement('div');
        div.className = "bg-[#1E213A] p-4 rounded text-center cursor-pointer hover:bg-[#2E2F3A]";
        div.innerHTML = `
          <p>${formatDate(d)}</p>
          <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png" class="mx-auto" />
          <p>${Math.round(f.main.temp_max)}° / ${Math.round(f.main.temp_min)}°</p>
        `;
        div.onclick = () => showForecastDetails(f);
        forecastContainer.appendChild(div);
      });
    });
}

//  UI Updates
function renderWeather(data) {
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  weatherIcon.classList.remove('hidden');
  tempDisplay.innerText = `${Math.round(data.main.temp)}°C`;
  description.innerText = capitalize(data.weather[0].description);
  date.innerText = `Today - ${new Date().toDateString()}`;
  locationDisplay.innerText = `📍 ${data.name}, ${data.sys.country}`;
  wind.innerText = `${Math.round(data.wind.speed * 2.237)} mph`;
  windDir.innerText = getWindDirection(data.wind.deg);
  humidity.innerText = `${data.main.humidity}%`;
  humidityBar.style.width = `${data.main.humidity}%`;
  visibility.innerText = `${(data.visibility / 1000).toFixed(1)} km`;
  pressure.innerText = `${data.main.pressure} mb`;
  hideError();
}

//  Slide-in Drawer for Details
function showForecastDetails(data) {
  const drawer = document.getElementById('forecastDrawer');
  const content = document.getElementById('drawerContent');

  const condition = data.weather[0].main.toLowerCase();
  const advice = getWeatherAdvice(condition);

  content.innerHTML = `
    <p><strong>Description:</strong> ${capitalize(data.weather[0].description)}</p>
    <p><strong>Temperature:</strong> ${data.main.temp}°C</p>
    <p><strong>Humidity:</strong> ${data.main.humidity}%</p>
    <p><strong>Wind Speed:</strong> ${data.wind.speed} m/s</p>
    <p><strong>Pressure:</strong> ${data.main.pressure} mb</p>
    <p><strong>Date:</strong> ${formatDate(data.dt_txt.split(' ')[0])}</p>
    <p class="mt-4 text-yellow-300 font-semibold">💡 Advice: ${advice}</p>
  `;

  drawer.classList.remove('translate-x-full');
}

document.getElementById('closeDrawer').onclick = () => {
  document.getElementById('forecastDrawer').classList.add('translate-x-full');
};

//  Helpers
function getWeatherAdvice(condition) {
  if (condition.includes("rain") || condition.includes("drizzle")) return "Carry an umbrella ☔";
  if (condition.includes("thunderstorm")) return "Stay indoors ⛈️";
  if (condition.includes("snow")) return "Wear warm clothes ❄️🧥";
  if (condition.includes("clear")) return "Enjoy your day ☀️";
  if (condition.includes("cloud")) return "Might be dull outside ☁️";
  if (condition.includes("extreme") || condition.includes("hot")) return "Stay cool and hydrated 🧊";
if (condition.includes("cold") || condition.includes("freezing")) return "Dress warmly and stay safe 🥶";

  if (condition.includes("mist") || condition.includes("fog")) return "Drive carefully in low visibility 🌫️";
  return "Check local alerts for safety ⚠️";
}

function showError(msg) {
  errorBox.innerText = msg;
  errorBox.classList.remove('hidden');
}
function hideError() {
  errorBox.classList.add('hidden');
}
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function formatDate(str) {
  const d = new Date(str);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
function getWindDirection(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}
function saveCity(city) {
  let list = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (!list.includes(city)) {
    list.unshift(city);
    if (list.length > 5) list.pop();
    localStorage.setItem('recentCities', JSON.stringify(list));
    loadCities();
  }
}
function loadCities() {
  let list = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (list.length) {
    recentWrapper.classList.remove('hidden');
    recentSelect.innerHTML = `<option disabled selected>Select recent city</option>`;
    list.forEach(city => {
      recentSelect.innerHTML += `<option value="${city}">${city}</option>`;
    });
  }
}

window.onload = () => {
  loadCities();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      fetchCoords(pos.coords.latitude, pos.coords.longitude);
    });
  }
};
