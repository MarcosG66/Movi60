Movi60 — Functional Prototype in React Native + Expo

Academic extension project developed for the Mobile Platform Development course at Unifor.

Built based on the prototype provided in Figma Make and on Stages 1 and 2 of the project.

---

Features

Authentication and Onboarding

- Onboarding flow.
- Login and sign-up.
- Demo password recovery.
- Quick-access buttons for test accounts.
- Three user roles: Student, Instructor, and Administrator.

Student

The student interface contains five main tabs:

Tab| Features
Home| Dashboard and workout of the day
Workout| Workout details, execution, and history
Progress| Progress indicators and weekly chart
Schedule| Student schedule
Profile| Personal information and accessibility settings

Workout functionality:

- View assigned workouts.
- Follow step-by-step exercise instructions.
- Log sets, repetitions, loads, and notes.
- Complete workouts.
- Access workout history.
- View progress indicators calculated from workout history.

Workout information linked to a student is displayed only to that student within the student navigation.

Instructor

- Search and view assigned students.
- Create, edit, view, and delete exercises.
- Create, edit, view, and delete workouts.
- Manage only workouts created by the instructor.
- Assign workouts only to students linked to the instructor.

Administrator

- View registered users.
- Create users and select their roles.
- Edit user information and roles.
- Assign instructors to students.
- Delete users created locally on the device.
- View global dashboard metrics.

Workout and exercise CRUD operations are not available in the administrator navigation.

Movi60 Assistant

The prototype includes an assistant with locally programmed responses.

- Answers predefined questions.
- Provides guidance based on available exercises.
- Uses simple rules and instructions.

Note: The assistant is not connected to an external AI service in this version.

Accessibility

The application includes:

- Text scaling.
- Adjustable icon sizes.
- Enlarged buttons.
- High-contrast mode.
- Font selection.

On the first student login, the accessibility screen appears as an initial setup.

Select Save and start or return to access the main tabs.

---

Technologies

Technology| Purpose
React Native| Mobile application development
Expo| Development and execution environment
JavaScript / JSX| Application logic and components
AsyncStorage| Local data persistence
Lucide React Native| Interface icons
React Native SVG| SVG rendering

The application uses local state and AsyncStorage instead of a remote database.

---

Test Credentials

Role| Email| Password
Student| "ana@movi60.com"| "123456"
Instructor| "professor@movi60.com"| "123456"
Administrator| "admin@movi60.com"| "123456"

Quick-access buttons are available on the initial screen.

Additional demo users:

- Bruno Dias
- Lúcia Costa

Ana and Bruno are assigned to instructor Carlos by default. The administrator can modify these assignments.

New users created through public sign-up automatically receive the Student role.

When creating users through the administrator interface, a role and optionally an instructor can be selected.

The temporary password "123456" is used exclusively for demonstration purposes.

---

Running Locally

Requirements

- Node.js 22 (recommended for Expo SDK 57).
- npm.
- Expo Go on a smartphone or an Android/iOS emulator.
- Internet connection for initial dependency installation.

Installation

Clone the repository:

git clone https://github.com/MarcosG66/Movi60.git

Navigate to the project directory:

cd Movi60

Install dependencies:

npm install

Fix Expo dependency versions if necessary:

npx expo install --fix

Start the development server:

npx expo start

Running on a Smartphone

1. Install Expo Go.
2. Connect the smartphone and computer to the same network.
3. Run "npx expo start".
4. Scan the displayed QR Code.
5. Open the application in Expo Go.

Running on Web

Use:

npx expo start --web

The application can then be accessed through the local web preview.

---

Running on Expo Snack

A standalone version of the application is provided as:

"Movi60_Snack_App.js"

This file contains the application flows in a single file.

Instructions

1. Access "Expo Snack" (https://snack.expo.dev).
2. Create an empty Snack project.
3. Select Expo SDK 57, if available.
4. Open "Movi60_Snack_App.js".
5. Copy its entire content.
6. Replace the default "App.js" content with the copied code.
7. Add the required dependencies.
8. Select Android, iOS, or Web preview.
9. Run the application.

Dependencies

@react-native-async-storage/async-storage
lucide-react-native
react-native-svg

If SDK 57 is unavailable, select the closest supported version and verify dependency compatibility.

To test on a smartphone, scan the Snack QR Code using Expo Go.

To save the project, sign in with an Expo account and select Save.

Note: Local persistence in the web preview may behave differently from persistence in Expo Go.

---

Project Structure

src/
├── App.jsx
├── components/
├── styles/
│   └── theme.js
└── services/
    ├── local.js
    └── assistant.js

Main Files

"src/App.jsx"

Main application component, responsible for coordinating screens, navigation, and application flows.

"src/components/"

Reusable interface components shared across application screens.

"src/styles/theme.js"

Theme configuration and visual styling definitions.

"src/services/local.js"

Local data management, authentication simulation, and AsyncStorage persistence.

"src/services/assistant.js"

Local assistant logic and predefined responses.

---

Data Persistence

All application changes are stored locally using AsyncStorage.

The local data layer manages:

- Users and profiles.
- Exercises.
- Workouts.
- Workout assignments.
- Workout history.
- Student-instructor relationships.

Role Relationships

Student-instructor assignments use the following fields:

Field| Description
"instructorId"| Identifies the instructor assigned to a student
"professionalId"| Identifies the instructor responsible for a workout

These relationships determine which records appear in the application interface.

Demonstration Permissions

Student

- Views and logs their own workouts.
- Accesses their own workout history.

Instructor

- Views assigned students.
- Creates and manages their own workouts.
- Selects only assigned students in workout forms.

Administrator

- Manages users and roles.
- Manages instructor-student assignments.
- Views global dashboard information.

A confirmation prompt appears before deletion operations.

Security warning: These restrictions are implemented locally and do not constitute secure server-side authorization.

---

Integrations Not Included

The following integrations were intentionally excluded from this prototype.

Firebase Authentication

Authentication is simulated using local credentials.

A production implementation should use Firebase Authentication for secure identity management.

Firebase Firestore

Firestore collections are temporarily replaced with React state and AsyncStorage.

Gemini / External AI

The assistant currently uses predefined responses and local exercise information.

No external AI service calls are made in this version.

Final Exercise Images

The application retains illustrated placeholders from the original Figma prototype.

Exercise images can be provided through URLs in the CRUD interface when an internet connection is available.

---

Future Improvements

Firebase Integration

Replace the local functions in:

"src/services/local.js"

With Firebase Authentication and Firestore operations.

Proposed Firestore Collections

usuarios/
exercicios/
treinos/
treino_exercicios/
historico/
agenda/

Security

Implement:

- Firebase Authentication.
- Firestore Security Rules.
- Server-side role validation.
- Secure user data access.
- Proper authorization for CRUD operations.

AI Integration

Replace the local assistant implementation in:

"src/services/assistant.js"

With a backend-protected AI service.

API credentials should never be exposed directly in the mobile application.

---

Prototype Limitations

This project is intended for academic demonstration purposes only.

- Authentication is simulated locally.
- Data is stored on the device.
- Permissions are enforced at the interface/application level.
- No production-grade backend security is implemented.
- Demo credentials are not secure.
- Data synchronization between devices is unavailable.

Do not use sensitive information or personal passwords.

---

Verification

The delivered code was checked using a JavaScript/JSX parser.

Local authentication functions were validated through automated tests.

A real Expo Go build could not be executed in the original verification environment.

Platform-specific compatibility should therefore be tested using Expo Snack or a physical device.

---

Academic Context

Project: Movi60
Course: Mobile Platform Development
Institution: Universidade de Fortaleza (Unifor)
Project Type: Academic Extension Project
Framework: React Native + Expo
Status: Functional Prototype

---

Disclaimer

Movi60 is an academic prototype developed for educational purposes.

The current implementation demonstrates application navigation, role-based interfaces, local persistence, workout management, accessibility features, and simulated authentication.

It is not intended for production use without implementing secure authentication, database access controls, and backend services.