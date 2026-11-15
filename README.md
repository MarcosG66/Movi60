# Movi60 — Functional Prototype in React Native + Expo

Academic extension project for the Mobile Platform Development course (Unifor). Built based on the prototype provided in Figma Make and on Stages 1 and 2.

## What already works locally

- Onboarding, login, sign-up, and demo password recovery flow.
- Student, instructor, and administrator profiles, each with its own pages and navigation.
- Five student tabs: **Home, Workout, Progress, Schedule, Profile**.
- Workout of the day, details, step-by-step execution, logging of sets, reps, load, and notes, completion, and history.
- Progress indicators calculated from workout history, including a weekly chart.
- Movi60 Assistant with **local pre-programmed responses**. **It is not a connected AI**.
- Accessibility: text scaling, icons, enlarged buttons, high contrast, and font selection.
- Instructor: search and view students, create, edit, view, and delete exercises and workouts.
- Administrator: view users, edit data and roles, delete users created on the device itself, as well as exercises/workouts.
- All changes are stored in the device's **AsyncStorage**. Workout data linked to a student is displayed only to that student in the student navigation. Confirmation prompt before deletions.

The data is for demonstration purposes only, with no real server-side authentication or access control. **Do not use sensitive data or personal passwords.**

## Test credentials

| Role | Email | Password |
|------|-------|----------|
| Student | ana@movi60.com | 123456 |
| Instructor | professor@movi60.com | 123456 |
| Administrator | admin@movi60.com | 123456 |

Quick-access buttons are available on the initial screen. Bruno Dias and Lúcia Costa are sample users for the administrative list.

**First login as a student:** the accessibility screen appears as an initial setup. Press **Save and start** or go back to access the tabs.

## How to run as an Expo project on your computer

Requirements: Node.js 22 (recommended for Expo SDK 57), a smartphone with Expo Go or an emulator, and internet access for the initial installation.

```bash
npm install
npx expo install --fix
npx expo start
```

Then, scan the QR Code using Expo Go (Android) or the Camera/Expo Go (iOS). You can also open the web preview via the terminal or by running `npx expo start --web`.

The main code is located in `src/App.jsx`, the screens reuse components from `src/components`, the theme is in `src/styles/theme.js`, and the local data layer is in `src/services/local.js`.

## How to run on Expo Snack (without installing Node.js)

A **single-file App.js**, equivalent to this project, is included separately in the delivery under the name `Movi60_Snack_App.js`.

1. Go to **https://snack.expo.dev** and create an empty Snack.
2. If an SDK selector is available, choose **Expo SDK 57**, which matches the project received in the Figma ZIP. If that version is not listed, use the closest supported option and check if the libraries are compatible.
3. Open `Movi60_Snack_App.js` on your computer and **copy the entire content**.
4. In Snack, open `App.js`, **delete the sample code**, and **paste the copied code**.
5. Under **Dependencies**, add (if Snack hasn't resolved them automatically):
   - `@react-native-async-storage/async-storage`
   - `lucide-react-native`
   - `react-native-svg`
6. Select the **Android**, **iOS**, or **Web** preview and open the app. To test on a smartphone, install **Expo Go** and scan the Snack QR Code.
7. To save the project on Snack, sign in with an Expo account and click **Save**.

The single-file version contains the same flows and persists data locally within the runtime environment. Persistence in a web preview may behave differently from persistence in Expo Go on a mobile device.

## What was intentionally not integrated

- **Firebase Authentication**: local login and sign-up using demo credentials.
- **Firebase Firestore**: collections temporarily replaced by React state + AsyncStorage.
- **Gemini / AI**: the assistant responds using simple rules and instructions from the available exercises. No external service calls are made.
- **Final exercise photos**: the visual model keeps the illustrated placeholder from Figma. In the CRUD, it is possible to provide an image URL when an internet connection is available.

**Important:** local credential storage is strictly for educational purposes. It is not secure for a production environment, and permission control is handled solely on the UI level. For a real deployment, use Firebase Auth, Firestore security rules, and a backend for AI requests.

## Possible extensions

In a future integration, replace the functions in `src/services/local.js` with Auth/Firestore, migrate local records to `usuarios`, `exercicios`, `treinos`, `treino_exercicios`, `historico`, and `agenda` collections, and replace `src/services/assistant.js` with a backend-protected AI service.

## Verification of this delivery

The code was checked with a JavaScript/JSX parser, and the local authentication functions were validated through automated tests. **It was not possible to run a real Expo Go build in this environment**; therefore, any platform-specific version differences should be verified on Snack or on a physical device.


## Role separation — update

- **Student:** views and logs their own workouts. New public sign-ups default to the student role.
- **Instructor:** manages exercises, views only students assigned to them, and creates/edits/deletes only their own workouts. Only assigned students can be selected in the workout form.
- **Administrator:** manages users, roles, and the assignment of instructors to students. Their dashboard displays global metrics; workout and exercise CRUDs do not appear in the administrative navigation.
- **Local data:** the link is stored via the `instructorId` field on the user/student and `professionalId` on the workout. Permissions are for demonstration only and do not represent real security; Firebase rules should be applied in the next stage.
- **Admin user creation:** choose a role and optionally an instructor; temporary password `123456` is for testing only.
- Demo users Ana and Bruno are assigned to instructor Carlos by default; the administrator can change these assignments.
