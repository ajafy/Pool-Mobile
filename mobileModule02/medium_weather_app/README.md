# Weather App — Mobile Module 02

A weather app built with Expo + React Native + TypeScript.

This README is written so that **you can rebuild the whole project from zero**
by reading it. It explains *what* each piece does, *where* it lives, and
above all *why* it is written that way — most decisions here exist because a
simpler version was tried first and broke.

---

## 1. What the app must do

| Requirement | Where it is solved |
| --- | --- |
| Ask the location permission at start | `app/index.tsx` → `showMyPosition` |
| Say clearly when the permission is refused | `app/index.tsx` → `locationError` |
| Search a place by name | `app/index.tsx` → `runSearch` |
| Suggestion list: city + region + country | `app/components/AppBar.tsx` |
| Suggestions update while typing | `handleSearchChange` (debounce 300 ms) |
| Search without choosing a suggestion | `handleSearchSubmit` |
| Tab "Current": place, temp, description, wind | `BottomBar.tsx` → `renderCurrent` |
| Tab "Today": 24 hours (hour, temp, description, wind) | `BottomBar.tsx` → `renderToday` |
| Tab "Weekly": 7 days (date, min, max, description) | `BottomBar.tsx` → `renderWeekly` |
| Start on the first tab | `useState<Tab>("Current")` |
| Stay on the same tab after a search | `activeTab` lives in `BottomBar`, never reset |
| Tabs show the data of the last search | `weather` lives in `index.tsx`, above the tabs |
| Unknown city → message | `NOT_FOUND_MESSAGE` |
| API unreachable → message | `CONNECTION_MESSAGE` |
| Message stays until the problem is solved | see §7 |

---

## 2. Stack

- **Expo SDK 54** with **expo-router** (file based routing)
- **TypeScript**, `strict: true`
- **expo-location** — permission, GPS, reverse geocoding
- **lucide-react-native** — icons
- **Open-Meteo** — geocoding + weather, free, no API key

Nothing else was added. The animation uses React Native's built-in
`Animated`, the loader uses the built-in `ActivityIndicator`.

`tsconfig.json` defines the alias `@/*` → project root, which is why the
imports read `from "@/api/weather"`.

---

## 3. File map

```
api/
  weather.ts        <- every network call + the types. No React here.
app/
  _layout.tsx       <- expo-router stack, header hidden
  index.tsx         <- THE BRAIN: all the state and all the logic
  components/
    AppBar.tsx      <- search bar, my-location button, suggestion list
    BottomBar.tsx   <- the 3 tabs, the content of each tab, the animation
app.json            <- expo config + the expo-location permission text
```

The rule that keeps this readable: **`index.tsx` owns the state, the
components only display and report events.** `AppBar` and `BottomBar`
have no idea that an API exists.

---

## 4. The two APIs

### 4.1 Geocoding — name → coordinates

```
https://geocoding-api.open-meteo.com/v1/search?name=Paris&count=5&language=en&format=json
```

Answer (cut):

```json
{ "results": [ {
  "id": 2988507, "name": "Paris",
  "latitude": 48.85341, "longitude": 2.3488,
  "admin1": "Île-de-France Region",
  "country": "France"
} ] }
```

- `admin1` is the **region**, `country` is the **country**. That is exactly
  what the subject asks to display in the suggestion list.
- **Trap:** when nothing matches, the answer has **no `results` key at all** —
  it is `{"generationtime_ms": 0.27}`, *not* `{"results": []}`. So the test
  must be `if (!Array.isArray(data.results)) return []`, never
  `data.results.length === 0` (that would crash).

### 4.2 Weather — coordinates → weather

```
https://api.open-meteo.com/v1/forecast
  ?latitude=48.85&longitude=2.34
  &current=temperature_2m,weather_code,wind_speed_10m
  &hourly=temperature_2m,weather_code,wind_speed_10m
  &daily=weather_code,temperature_2m_min,temperature_2m_max
  &timezone=auto&forecast_days=7
```

One single call feeds the three tabs. That is deliberate: switching tabs
must never trigger a new request (the subject says the tabs show the data of
the last search).

The answer uses **parallel arrays**, not a list of objects:

```json
"hourly": {
  "time": ["2026-08-27T00:00", "2026-08-27T01:00", ...],
  "temperature_2m": [9.3, 9.3, ...]
}
```

So you rebuild the objects yourself by index:

```ts
data.hourly.time.slice(0, 24).map((time, index) => ({
  time: time.slice(11, 16),                    // "2026-08-27T13:00" -> "13:00"
  temperature: data.hourly.temperature_2m?.[index],
  ...
}))
```

- **Why `timezone=auto`:** it makes `hourly.time` start at `00:00` **local**
  time. Verified: index 0 is `T00:00` and index 23 is `T23:00`. That is what
  makes `.slice(0, 24)` mean exactly "today". Without it you get UTC and the
  24 first hours are not the local day.
- `forecast_days=7` gives 168 hourly entries and 7 daily entries.

### 4.3 Weather codes

The API returns a **number** (`weather_code`), not a sentence. A
`Record<number, string>` maps them (0 = clear sky, 3 = overcast, 61 = slight
rain, 95 = thunderstorm...). Always keep a fallback:

```ts
function describeWeather(code: number): string {
  return WEATHER_DESCRIPTIONS[code] ?? "Unknown weather";
}
```

Otherwise a code you did not list displays `undefined`.

### 4.4 `askApi` — one funnel for every failure

**The most important trap of the project:** `fetch` **does not throw** on
HTTP 400 or 500. It only rejects when the network itself failed. So a naive
`await fetch(url); await response.json()` happily returns an error page, and
the app crashes later on `data.current.temperature_2m`.

Every call goes through one helper that turns *anything abnormal* into a
throw:

```ts
async function askApi(url: string) {
  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Cannot reach the weather service");   // no network
  }

  if (!response.ok) {                                       // 400, 500...
    throw new Error(`The weather service answered ${response.status}`);
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The weather service sent a broken answer");
  }

  if (data?.error) {                    // Open-Meteo says {"error": true}
    throw new Error("The weather service refused the request");
  }

  return data;
}
```

Consequence for the whole app: **a throw always means "connection problem"**,
and "city not found" is *not* a throw, it is an empty array. That one rule
makes the error handling in `index.tsx` trivial.

`fetchWeather` also checks the sections exist before reading them:

```ts
if (!data.current || !Array.isArray(data.hourly?.time)) {
  throw new Error("The weather service sent an incomplete answer");
}
```

---

## 5. The state — and why it lives where it lives

Everything is in `app/index.tsx`:

| State | Role |
| --- | --- |
| `searchText` | text of the input |
| `suggestions` | cities proposed under the bar |
| `selectedCity` | the place currently displayed (`City \| null`) |
| `weather` | its weather, for the 3 tabs (`Weather \| null`) |
| `searchError` | red message (not found / connection) |
| `locationError` | red message about the GPS or the permission |
| `isLoading` | true while waiting for the position **or** the weather |
| `isSearchOpen` | true while the suggestion list covers the screen |
| `connectionFailed` | true while the weather call keeps failing |

Two placements are **requirements, not taste**:

- `weather` must be **above** the tabs, in `index.tsx`. If it were inside
  `BottomBar`, changing tab would refetch and lose the last search.
- `activeTab` must be **inside** `BottomBar`. Nothing in the search path
  touches it, which is what makes "stay on the tab where you searched" true
  for free.

And three `useRef`, which are **not** state because changing them must not
re-render:

```ts
const searchTimer = useRef(null);     // the debounce timer
const lastSearchId = useRef(0);       // see §8.1
const lastWeatherId = useRef(0);
```

---

## 6. Feature by feature

### 6.1 My position (start of the app + blue button)

The trick that keeps the code small: **the position is converted into a
`City`**, the same type a search produces. So everything after that point is
identical for a search and for the GPS.

```ts
const buildCityFromCoords = async (position) => {
  let name = "My position";
  let region = "";
  let country = "";

  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });

    if (places.length > 0) {
      name = places[0].city ?? places[0].subregion ?? name;
      region = places[0].region ?? "";
      country = places[0].country ?? "";
    }
  } catch {
    // could not name the place: we keep "My position"
  }

  return { id: 0, name, region, country, latitude, longitude };
};
```

- Open-Meteo has **no** reverse geocoding. `Location.reverseGeocodeAsync`
  uses the **native** geocoder of the phone (Android `Geocoder`, iOS
  CoreLocation). It needs network, and it is **not supported on web**.
- The `catch` is important: if naming fails, only the *label* degrades, the
  weather still loads from the raw coordinates.

Speed: asking for a fresh GPS fix takes 10–30 s indoors, so the cached
position is tried first:

```ts
let position = await Location.getLastKnownPositionAsync();

if (!position) {
  position = await Location.getCurrentPositionAsync({});
}
```

Permission, in `showMyPosition`:

```ts
const { status } = await Location.requestForegroundPermissionsAsync();

if (status !== "granted") {
  setLocationError("Permission denied, please enable it from settings");
  setIsLoading(false);
  return;
}
```

The whole block is wrapped in `try/catch` because the permission can be
granted **while the GPS is off** — `getCurrentPositionAsync` then throws, and
without the catch you get a silent unhandled rejection and a blank screen.

`app.json` must declare the permission or a real build cannot ask for it:

```json
["expo-location", { "locationWhenInUsePermission": "..." }]
```

### 6.2 Suggestions while typing (debounce)

```ts
const handleSearchChange = (text: string) => {
  setSearchText(text);
  setIsSearchOpen(true);

  if (searchTimer.current) clearTimeout(searchTimer.current);   // cancel

  if (text.trim().length < 2) {
    setSuggestions([]);
    if (!connectionFailed) setSearchError("");
    return;
  }

  searchTimer.current = setTimeout(() => runSearch(text), 300);
};
```

Each keystroke cancels the pending timer, so typing "Paris" makes **one**
request instead of five. Under 2 characters there is no request at all.

### 6.3 Searching without choosing a suggestion

`handleSearchSubmit` re-geocodes the **current** text (not the possibly stale
suggestion list) and uses the best match only for the coordinates:

```ts
showCity(cities[0], false);    // false = do NOT overwrite the typed text
```

`showCity(city, replaceSearchText)` is shared by both paths:

| Action | `replaceSearchText` | Search bar after |
| --- | --- | --- |
| tap a suggestion | `true` | the city name (the user picked it) |
| type + submit | `false` | exactly what was typed |

### 6.4 The three tabs

`renderInfo()` uses **early returns instead of nested ternaries** — a 4-deep
`? :` in JSX is unreadable:

```ts
const renderInfo = () => {
  if (searchError) return <Text style={styles.errorText}>{searchError}</Text>;
  if (locationError) return <Text style={styles.errorText}>{locationError}</Text>;
  if (isLoading) return renderLoader();
  if (!selectedCity) return null;
  if (!weather) return renderLoader();

  if (activeTab === "Current") return renderCurrent(selectedCity, weather);
  if (activeTab === "Today") return renderToday(selectedCity, weather);
  return renderWeekly(selectedCity, weather);
};
```

**The order is logic, not style:** `searchError` is tested *before*
`isLoading`. The connection retry (§7) calls `loadWeather` every 5 s, which
flips `isLoading`; if the loader were tested first, the red message would
blink into a spinner every 5 seconds instead of staying on screen.

The location is three separate lines, and the region is skipped when empty
(some places have no `admin1`, which would leave a blank line):

```tsx
<Text>{city.name}</Text>
{city.region !== "" && <Text>{city.region}</Text>}
<Text>{city.country}</Text>
```

### 6.5 Swipe + animation

One `Animated.Value` drives both the fade and the slide:

```ts
const progress = useRef(new Animated.Value(1)).current;

useEffect(() => {
  progress.setValue(0);
  Animated.timing(progress, {
    toValue: 1, duration: 250, useNativeDriver: true,
  }).start();
}, [activeTab, progress]);

const slide = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [direction * 40, 0],
});
```

`direction` (`1` / `-1`) makes the content arrive from the side you swiped
from. **All** tab changes go through one function so the direction is always
computed — swipe and tab-bar taps included:

```ts
const goToTab = (index: number) => {
  const currentIndex = TABS.findIndex((tab) => tab.name === activeTab);
  if (index < 0 || index >= TABS.length || index === currentIndex) return;
  setDirection(index > currentIndex ? 1 : -1);
  setActiveTab(TABS[index].name);
};
```

`useNativeDriver: true` runs it on the UI thread, so it stays smooth while
the weather is loading.

---

## 7. Error handling

Two messages, defined once at the top of `index.tsx`:

```ts
const NOT_FOUND_MESSAGE = "Could not find any city with this name, please try another one";
const CONNECTION_MESSAGE = "Cannot reach the weather service, check your connection";
```

**"Not found" is detected in both paths**, not only on submit — typing a
bogus name must also explain itself instead of just showing an empty list:

```ts
setSuggestions(cities);
setSearchError(cities.length === 0 ? NOT_FOUND_MESSAGE : "");
```

**The message must survive typing.** The first version called
`setSearchError("")` on every keystroke, so any message vanished the instant
a key was pressed. That line is gone: the message is now cleared only by
something that actually solves the problem (a search returning cities, or a
successful weather load).

**"Until the connection is restored" implies retrying by ourselves**,
otherwise the message could never disappear without user action:

```ts
useEffect(() => {
  if (!connectionFailed || !selectedCity) return;

  const retryTimer = setInterval(() => loadWeather(selectedCity), 5000);

  return () => clearInterval(retryTimer);
}, [connectionFailed, selectedCity]);
```

Test it: display a city, turn on airplane mode, wait for the message, turn it
off — the weather comes back alone after ~5 s.

---

## 8. The traps (read this before rewriting)

### 8.1 A slow answer must not overwrite a fresh one

Type "Paris" then quickly "Lyon". If Paris's answer arrives *after* Lyon's,
you see Lyon in the bar and Paris's suggestions. Fix: number every call and
ignore the late ones.

```ts
const searchId = lastSearchId.current + 1;
lastSearchId.current = searchId;

const cities = await searchCities(text);

if (searchId !== lastSearchId.current) return;   // a newer call started
```

Note in `loadWeather` the stale branch returns **without** clearing
`isLoading` — the newer call owns the loader now.

### 8.2 The suggestion taps need `keyboardShouldPersistTaps`

Without it, the first tap on a suggestion is eaten by the keyboard
dismissal and nothing happens:

```tsx
<ScrollView keyboardShouldPersistTaps="handled">
```

### 8.3 ...but that same option creates a bug

`keyboardShouldPersistTaps` works by **keeping the input focused** through
the tap. So after choosing a city, `isSearchOpen` is `false` while the input
is still focused — tapping it again fires **no** `onFocus` (it never lost
focus), and the list can never reopen.

Fix: blur the input yourself on every exit.

```ts
const inputRef = useRef<TextInput>(null);

const closeAndRun = (action: () => void) => {
  inputRef.current?.blur();
  action();
};
```

All five controls (magnifier, keyboard key, blue button, "My location" row,
city rows) go through `closeAndRun`. Second safety net: typing sets
`isSearchOpen` back to `true`.

### 8.4 Hiding the tabs must not unmount them

The suggestion list takes the full height, so `BottomBar` has to disappear.
**Unmounting it would destroy `activeTab`** and reset you to "Current" after
every search — which breaks the subject. `display: "none"` removes it from
the layout while keeping the component mounted and its state alive:

```tsx
<View style={[styles.bottom, isSearchOpen && styles.hidden]}>
  <BottomBar ... />
</View>
```

### 8.5 The swipe must not steal the touches from the lists

The first version claimed the gesture as soon as a finger landed:

```tsx
onStartShouldSetResponder={() => true}    // WRONG once a list exists
```

That makes the 24-hour `ScrollView` impossible to scroll, because the parent
grabs every gesture. Use the touch events instead — they read the same
start/end X without claiming the responder:

```tsx
onTouchStart={(e) => { touchStartX.current = e.nativeEvent.pageX; }}
onTouchEnd={handleSwipe}
```

### 8.6 The loader must cover the position too

`renderInfo` used to return `null` while `selectedCity` was still `null`, so
the slowest part of the start-up (permission + GPS + reverse geocoding) showed
a **blank screen**. One `isLoading` flag now covers the whole wait; it is set
in 3 places and cleared in every terminal branch (check with
`grep -n "setIsLoading" app/index.tsx` — no branch may forget it).

---

## 9. Rebuilding from scratch, in order

1. `npx create-expo-app` (Expo SDK 54, expo-router template), then
   `npx expo install expo-location`, and add the plugin to `app.json`.
2. `api/weather.ts`: the types, `WEATHER_DESCRIPTIONS`, `describeWeather`,
   `askApi`, `searchCities`, `fetchWeather`. **Test it with `curl` before
   writing any UI** — including a nonsense city, so you see the missing
   `results` key yourself.
3. `app/index.tsx`: `searchText` + `suggestions` + `selectedCity`, and
   `runSearch` with the 300 ms debounce.
4. `AppBar`: input + suggestion list (name / region, country).
5. `BottomBar`: the 3 tabs, `renderInfo` with early returns, one call feeding
   all three.
6. The GPS: `showMyPosition`, `buildCityFromCoords`, permission messages.
7. The errors: the two messages, the 5 s retry, and remove any
   `setSearchError("")` sitting in the keystroke handler.
8. The polish: `isLoading` + `ActivityIndicator`, the `Animated` tab
   transition, the full-height list with `display: "none"`.

After each step: `npx tsc --noEmit` and `npx eslint app api`. Both must be
silent — that is how every mistake in this README was caught.

---

## 10. Running it

```bash
npm install
npx expo start          # add --dev-client for a native dev build
```

### Windows / Android notes (things that cost hours)

- **Gradle needs JDK 21**, not 25:
  `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`
- **260-character path limit.** The CMake step fails on
  `RNCSafeAreaViewShadowNode.cpp.o` (`Filename longer than 260 characters`).
  Setting `LongPathsEnabled=1` in the registry **does not fix it** — the
  NDK's `ninja` is not `longPathAware`. Build through a short junction:
  ```powershell
  New-Item -ItemType Junction -Path C:\wa -Target <project path>
  & C:\wa\android\gradlew.bat -p C:\wa\android assembleDebug -PreactNativeArchitectures=arm64-v8a
  ```
- **Xiaomi / MIUI** refuses `adb install` (`INSTALL_FAILED_USER_RESTRICTED`)
  until *Install via USB* is enabled in the developer options.
- **Wireless debugging:** the pairing port and the connect port are two
  different numbers. Prefer pointing the dev client at the PC's LAN address
  (`http://192.168.x.x:8081`) rather than `localhost:8081`, because
  `localhost` only works through `adb reverse` and dies with the connection.
