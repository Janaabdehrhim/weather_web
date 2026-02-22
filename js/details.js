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
    pPrecipitation = document.querySelector("#pPrecipitation");

let weatherData;
let loader = document.getElementById("loader");

function showLoader() {
    if (loader) loader.style.display = "flex";
}

function hideLoader() {
    if (loader) loader.style.display = "none";
}

let isInitialLoad = true;
txtSearch.value = "Cairo, Egypt";
async function getGeoData() {
    showLoader();

    let search = txtSearch?.value || "Cairo, Egypt";
    if (search.toLowerCase() === "cairo") search = "Cairo, Egypt";

    try {
        let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=jsonv2&addressdetails=1`;
        let response = await fetch(url, {
            headers: {
                "Accept-Language": "en",
                "User-Agent": "MyWeatherApp/1.0 (your@email.com)"
            }
        });
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        let result = await response.json();

        if (!result || result.length === 0) {
            if (!isInitialLoad) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'could not find the location. Please try a different search term.',
                    confirmButtonText: 'OK'
                });
            }
            return;
        }

        let lat = result[0].lat;
        let lon = result[0].lon;

        loadLocationData(result[0]);
        await getWeatherData(lat, lon); // استني تحميل الطقس

    } catch (error) {
        console.error(error.message);
    } finally {
        hideLoader(); // هنا بس
        isInitialLoad = false;
    }
}

function loadLocationData(location) {
    let address = location.address || {};
    let cityName = address.city || address.town || address.village || address.county || "Unknown";
    let countryName = address.country || "Unknown";

    let dateOptions = { year: "numeric", month: "short", day: "numeric", weekday: "long" };
    let currDate = new Intl.DateTimeFormat(navigator.language, dateOptions).format(new Date());

    dvCityCountry.textContent = `${cityName}, ${countryName}`;
    dvCurrDate.textContent = currDate;
}

async function getWeatherData(lat, lon) {
    let tempUnit = "celsius";
    let windUnit = "kmh";
    let precipUnit = "mm";

    if (ddlUnits.value === "F") {
        tempUnit = "fahrenheit";
        windUnit = "mph";
        precipUnit = "inch";
    }

    let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=${tempUnit}&windspeed_unit=${windUnit}&precipitation_unit=${precipUnit}`;

    try {
        let response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);

        weatherData = await response.json();
        loadCurrentWeather(weatherData);
        loadDailyForecast();
        loadHourlyForecast();
    } catch (error) {
        console.error(error.message);
    }
}
function loadCurrentWeather(data) {
    if (!data?.current_weather || !data.hourly?.time) return;

    let current = data.current_weather;
    let hourly = data.hourly;

    // نجيب أقرب وقت حالي من الداتا
    let now = new Date();
    let nowISO = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH

    let nowIndex = hourly.time.findIndex(t => t.startsWith(nowISO));

    // لو ملقيناش الساعة الحالية نرجع لأول عنصر
    if (nowIndex === -1) nowIndex = 0;

    dvCurrTemp.textContent = Math.round(hourly.temperature_2m[nowIndex]);
    pFeelsLike.textContent = Math.round(hourly.apparent_temperature[nowIndex]);
    pHumidity.textContent = hourly.relative_humidity_2m[nowIndex];
    pWind.textContent = `${hourly.wind_speed_10m[nowIndex]} ${ddlUnits.value === "F" ? "mph" : "km/h"}`;
    pPrecipitation.textContent = `${hourly.precipitation[nowIndex]} ${ddlUnits.value === "F" ? "in" : "mm"}`;

    let weatherCodeName = getWeatherCodeName(hourly.weather_code[nowIndex]);
    let img = document.querySelector(".current__icon");
    if (img) {
        img.src = `img/icon-${weatherCodeName}.webp`;
        img.alt = weatherCodeName;
    }
}
function loadDailyForecast() {
    if (!weatherData?.daily) return;

    let daily = weatherData.daily;
    let container = document.querySelector(".daily__forecast");
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        let date = new Date(daily.time[i]);
        let dayOfWeek = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
        let weatherCodeName = getWeatherCodeName(daily.weather_code[i]);
        let dailyHigh = Math.round(daily.temperature_2m_max[i]) + "°";
        let dailyLow = Math.round(daily.temperature_2m_min[i]) + "°";

        container.innerHTML += `
            <div id="dvForecastDay${i + 1}" class="block daily__day">
                <p class="day title">${dayOfWeek}</p>
                <img src="img/icon-${weatherCodeName}.webp" width="70" height="70">
                <div class="day_temps d-flex justify-content-between">
                    <div class="day_high">${dailyHigh}</div>
                    <div class="day_low">${dailyLow}</div>
                </div>
            </div>
        `;
    }
}

function loadHourlyForecast() {
    if (!weatherData?.hourly) return;

    let selectedDate = ddlDay.value;
    let hourly = weatherData.hourly;
    let container = document.querySelector(".hourly__hours");
    container.innerHTML = "";

    for (let i = 0; i < hourly.time.length; i++) {
        if (!hourly.time[i].startsWith(selectedDate)) continue;

        let time = new Date(hourly.time[i]);
        let hourString = time.toLocaleTimeString(navigator.language, { hour: 'numeric', hour12: true });
        let weatherCodeName = getWeatherCodeName(hourly.weather_code[i]);
        let temp = Math.round(hourly.temperature_2m[i]) + "°";

        container.innerHTML += `
            <div class="hourly__hour">
                <img src="img/icon-${weatherCodeName}.webp" class="hourly__icon" width="50" height="50">
                <p class="hourly__time mt-3">${hourString}</p>
                <p class="hourly__temp mt-3">${temp}</p>
            </div>
        `;
    }
}

function getWeatherCodeName(code) {
    let weatherCodes = {
        0: "sunny",
        1: "partly-cloudy",
        2: "partly-cloudy",
        3: "overcast",
        45: "fog",
        48: "fog",
        51: "drizzle",
        53: "drizzle",
        55: "drizzle",
        56: "drizzle",
        57: "drizzle",
        61: "rain",
        63: "rain",
        65: "rain",
        66: "rain",
        67: "rain",
        80: "rain",
        81: "rain",
        82: "rain",
        71: "snow",
        73: "snow",
        75: "snow",
        77: "snow",
        85: "snow",
        86: "snow",
        95: "storm",
        96: "storm",
        99: "storm",
    };
    return weatherCodes[code] || "sunny";
}
async function fetchWithRetry(url, options = {}, retries = 2) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error("Fetch failed");
        return await response.json();
    } catch (err) {
        if (retries > 0) {
            return fetchWithRetry(url, options, retries - 1);
        }
        throw err;
    }
}
function DayOfWeek() {
    let currDate = new Date();
    ddlDay.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        let newOption = document.createElement("option");
        let dateValue = currDate.toISOString().split("T")[0];

        newOption.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(currDate);
        newOption.value = dateValue;

        // 👈 أول يوم يكون selected
        if (i === 0) newOption.selected = true;

        ddlDay.appendChild(newOption);
        currDate.setDate(currDate.getDate() + 1);
    }
}

DayOfWeek();

document.addEventListener("DOMContentLoaded", init);

async function init() {
    DayOfWeek();
    txtSearch.value = "Cairo, Egypt";
    await getGeoData();
}

btnSearch.addEventListener("click", getGeoData);
ddlUnits.addEventListener("change", getGeoData);
ddlDay.addEventListener("change", loadHourlyForecast);
let backButton = document.querySelector('.back');

backButton.addEventListener('click', () => {
    showLoader();
    window.location.href = 'index.html';
});

document.querySelectorAll("a[href]").forEach(link => {
    link.addEventListener("click", () => {
        showLoader();
    });
});

