let ddlUnits = document.querySelector("#allUnits"),
    ddlDay = document.querySelector("#ddlDay"),
    txtSearch = document.querySelector("#txtSearch"),
    btnSearch = document.querySelector("#btnSearch"),
    dvCityCountry = document.querySelector("#CityCountry"),
    dvCurrDate = document.querySelector("#CurrDate"),
    dvCurrTemp = document.querySelector("#CurrTemp"),
    pFeelsLike = document.querySelector("#pFeelsLike"),
    pHumidity = document.querySelector("#pHumidity"),
    pWind = document.querySelector("#pWind"),
    pPrecipitation = document.querySelector("#pPrecipitation"),
    loader = document.getElementById("loader");

let weatherData = null;
let isFetching = false;

let showLoader = () => { if (loader) loader.style.display = "flex"; };
let hideLoader = () => { if (loader) loader.style.display = "none"; };

async function fetchWithRetry(url, options = {}, retries = 2) {
    try {
        let response = await fetch(url, options);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (err) {
        if (retries > 0) return fetchWithRetry(url, options, retries - 1);
        throw err;
    }
}

async function getGeoData() {
    if (isFetching) return;

    let search = txtSearch.value.trim() || "Cairo, Egypt";

    if (search.toLowerCase() === "cairo" || search === "القاهرة") {
        search = "Cairo, Egypt";
    }

    isFetching = true;
    showLoader();

    try {
        let geoUrl;

        if (search.toLowerCase().includes("egypt") || search === "القاهرة") {
            geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1&countrycodes=eg`;
        } else {
            geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1`;
        }

        let result = await fetchWithRetry(geoUrl, {
            headers: { "Accept-Language": "en", "User-Agent": "WeatherApp/1.0" }
        });

        if (!result || result.length === 0) {
            Swal.fire("Error", "location failed to load", "error");
            return;
        }

        loadLocationData(result[0]);
        await getWeatherData(result[0].lat, result[0].lon);
    } catch (error) {
        console.error("Geo Error:", error);
    } finally {
        hideLoader();
        isFetching = false;
    }
}

async function getWeatherData(lat, lon) {
    let isF = ddlUnits.value === "F";
    let tempUnit = isF ? "fahrenheit" : "celsius";
    let windUnit = isF ? "mph" : "kmh";
    let precipUnit = isF ? "inch" : "mm";

    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}&precipitation_unit=${precipUnit}&timezone=auto`;

    try {
        let response = await fetch(url);
        weatherData = await response.json();

        loadCurrentWeather(weatherData);
        loadDailyForecast();
        loadHourlyForecast();
    } catch (error) {
        console.error("Weather Fetch Error:", error);
    }
}

function loadLocationData(location) {
    let address = location.address || {};
    let cityName = address.city || address.town || address.village || address.county || "Unknown";
    let countryName = address.country || "Unknown";
    dvCityCountry.textContent = `${cityName}, ${countryName}`;
    dvCurrDate.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }).format(new Date());
}

function loadCurrentWeather(data) {
    let hourly = data.hourly;
    let nowISO = new Date().toISOString().slice(0, 13);
    let idx = hourly.time.findIndex(t => t.startsWith(nowISO));
    if (idx === -1) idx = 0;

    dvCurrTemp.textContent = Math.round(hourly.temperature_2m[idx]);
    pFeelsLike.textContent = Math.round(hourly.apparent_temperature[idx]);
    pHumidity.textContent = hourly.relative_humidity_2m[idx];
    pWind.textContent = `${hourly.wind_speed_10m[idx]} ${ddlUnits.value === "F" ? "mph" : "km/h"}`;
    pPrecipitation.textContent = `${hourly.precipitation[idx]} ${ddlUnits.value === "F" ? "in" : "mm"}`;

    let codeName = getWeatherCodeName(hourly.weather_code[idx]);
    let img = document.querySelector(".current__icon");
    if (img) img.src = `img/icon-${codeName}.webp`;
}

function loadDailyForecast() {
    if (!weatherData?.daily) return;
    let daily = weatherData.daily;
    let container = document.querySelector(".daily__forecast");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        let date = new Date(daily.time[i]);
        let dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
        let codeName = getWeatherCodeName(daily.weather_code[i]);

        container.innerHTML += `
            <div class="block daily__day">
                <p class="day title">${dayName}</p>
                <img src="img/icon-${codeName}.webp" width="70" height="70" onerror="this.src='img/icon-sunny.webp'">
                <div class="day_temps d-flex justify-content-between">
                    <div class="day_high">${Math.round(daily.temperature_2m_max[i])}°</div>
                    <div class="day_low">${Math.round(daily.temperature_2m_min[i])}°</div>
                </div>
            </div>`;
    }
}

function loadHourlyForecast() {
    if (!weatherData?.hourly) return;
    let selectedDate = ddlDay.value;
    let hourly = weatherData.hourly;
    let container = document.querySelector(".hourly__hours");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < hourly.time.length; i++) {
        if (!hourly.time[i].startsWith(selectedDate)) continue;
        let time = new Date(hourly.time[i]);
        let hourStr = time.toLocaleTimeString([], { hour: 'numeric', hour12: true });
        let codeName = getWeatherCodeName(hourly.weather_code[i]);

        container.innerHTML += `
            <div class="hourly__hour">
                <img src="img/icon-${codeName}.webp" class="hourly__icon" width="50" height="50">
                <p class="hourly__time mt-3">${hourStr}</p>
                <p class="hourly__temp mt-3">${Math.round(hourly.temperature_2m[i])}°</p>
            </div>`;
    }
}

function getWeatherCodeName(code) {
    let codes = { 0: "sunny", 1: "partly-cloudy", 2: "partly-cloudy", 3: "overcast", 45: "fog", 61: "rain", 95: "storm" };
    return codes[code] || "sunny";
}

function DayOfWeek() {
    ddlDay.innerHTML = "";
    let curr = new Date();
    for (let i = 0; i < 7; i++) {
        let opt = document.createElement("option");
        opt.value = curr.toISOString().split("T")[0];
        opt.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(curr);
        ddlDay.appendChild(opt);
        curr.setDate(curr.getDate() + 1);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    DayOfWeek();
    txtSearch.value = "Cairo, Egypt";
    getGeoData();
});

btnSearch.addEventListener("click", getGeoData);
ddlUnits.addEventListener("change", getGeoData);
ddlDay.addEventListener("change", loadHourlyForecast);

let backButton = document.querySelector('.back');
if (backButton) {
    backButton.addEventListener('click', () => {
        showLoader();
        window.location.href = 'index.html';
    });
}

document.querySelectorAll("a[href]").forEach(link => {
    link.addEventListener("click", () => {
        showLoader();
    });
});