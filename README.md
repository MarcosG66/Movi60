# Movi60 — Accessible Fitness Management App

**Movi60** is a mobile application developed with **React Native and Expo**, designed to support physical activity, workout management, and accessibility for adults aged 60 and older.

The project was developed as an academic extension initiative for the **Mobile Platform Development** course at the **University of Fortaleza (Unifor)**, Brazil.

Movi60 provides dedicated interfaces for students, instructors, and administrators, combining workout management, progress tracking, accessibility features, Firebase integration, and an AI-powered assistant.

The application was initially designed using **Figma Make** and progressively developed into a functional prototype.

---

## 1. Project Overview

### Purpose

Movi60 aims to make fitness applications more accessible to older adults by providing an intuitive interface for managing and following physical activities.

The application addresses common challenges such as:

- Difficulty understanding exercise instructions.
- Limited accessibility in conventional fitness applications.
- Difficulty organizing workout schedules.
- Lack of accessible workout progress tracking.
- Difficulty communicating exercise-related questions.
- Complex interfaces with small buttons and text.

### Target Audience

The primary audience consists of adults aged 60 and older who participate in or intend to participate in physical activities at gyms, fitness centers, and community wellness programs.

The application also supports fitness instructors and administrators responsible for managing students and their workout routines.

---

## 2. Technologies

| Technology | Purpose |
|---|---|
| React Native | Cross-platform mobile development |
| Expo | Development environment and application execution |
| JavaScript / JSX | Application logic and interface components |
| Firebase Authentication | User authentication |
| Cloud Firestore | Cloud database and data persistence |
| Firebase Security Rules | Database access control |
| AsyncStorage | Local application data and preferences |
| Cloudflare AI | AI assistant integration in the latest development |
| Lucide React Native | Interface icons |
| React Native SVG | SVG rendering |
| Figma Make | Initial interface prototyping |

### Development Environment

- Node.js
- npm
- Expo CLI
- Visual Studio Code
- Expo Go
- Git and GitHub

The audited project revision uses **Expo SDK 58**.

The exact Node.js and dependency requirements should be checked against the current `package.json` before installation.

---

## 3. Application Features

### 3.1 Authentication

Movi60 provides an authentication flow with:

- User login.
- User registration.
- Password recovery interface.
- Role-based navigation.
- User session management.
- Firebase Authentication integration.

New users registered through the public sign-up interface receive the **Student** role by default.

The application supports three roles:

1. Student
2. Instructor
3. Administrator

Each role has a dedicated interface and access to different features.

### 3.2 Student Features

Students can access five main navigation tabs.

| Tab | Description |
|---|---|
| Home | Dashboard and workout of the day |
| Workout | Assigned workouts and exercise execution |
| Progress | Workout history and progress indicators |
| Schedule | Scheduled activities |
| Profile | Personal information and accessibility preferences |

#### Workout Management

Students can:

- View assigned workouts.
- Access exercise details.
- Read step-by-step exercise instructions.
- View exercise illustrations or images.
- Record completed sets.
- Record repetitions and loads.
- Add workout notes.
- Mark exercises as completed.
- Complete workouts.
- Review previous workout sessions.

Workout information is associated with the corresponding student.

#### Progress Tracking

The Progress section provides indicators calculated from recorded workout activity.

Features include:

- Workout completion history.
- Weekly activity visualization.
- Progress indicators.
- Historical workout information.

These indicators help students monitor their activity over time.

### 3.3 Instructor Features

Instructors have access to tools for managing students, exercises, and workouts.

#### Student Management

Instructors can:

- Search for students.
- View students assigned to them.
- Access relevant student information.
- Select assigned students when creating workouts.

Students outside an instructor's assignment scope should not be available for workout assignment.

#### Exercise CRUD

The application provides CRUD operations for exercises:

- **Create:** Register exercises.
- **Read:** View exercise information.
- **Update:** Modify existing exercises.
- **Delete:** Remove exercises with confirmation.

Exercise information may include:

- Name.
- Description.
- Muscle group.
- Instructions.
- Image.
- Additional notes or precautions.

#### Workout CRUD

Instructors can:

- Create workouts.
- View existing workouts.
- Edit workout information.
- Delete workouts.
- Associate workouts with assigned students.
- Select exercises for each workout.
- Configure sets, repetitions, and additional instructions.

Workout ownership is associated with the responsible instructor.

### 3.4 Administrator Features

Administrators have a dedicated management interface.

Available functionality includes:

- Viewing registered users.
- Creating users.
- Editing user information.
- Managing user roles.
- Assigning instructors to students.
- Removing users when permitted.
- Viewing global application metrics.

The administrative interface focuses on user management and instructor-student relationships.

**Exercise and workout CRUD operations belong to the instructor interface and are not included in the current administrator navigation.**

---

## 4. AI Assistant

Movi60 includes an AI assistant intended to help students understand exercise instructions and workout-related information.

### Purpose

The assistant provides accessible explanations about physical activities.

Examples of supported questions include:

- How do I perform this exercise?
- Can you explain this movement more simply?
- What should I pay attention to during this exercise?
- What is the purpose of this exercise?
- Can you explain the instructions step by step?

### AI Integration

The latest development work introduced integration with an AI service through **Cloudflare**.

The assistant is designed to:

- Receive questions from the user.
- Process the question using an AI service.
- Return a natural-language response.
- Provide explanations related to exercises.
- Support accessible communication.

The application may use locally programmed responses as a fallback when the external AI service is unavailable, depending on the installed revision.

### Integration Status

An earlier audited revision used Firebase AI Logic and Gemini. Subsequent development introduced Cloudflare AI.

The final provider configuration and successful execution on physical devices must be verified against the latest source code.

The application does not require continuous voice conversation as part of its core assistant functionality.

### AI Limitations

The assistant is intended for educational and informational purposes.

It does not replace:

- Fitness instructors.
- Healthcare professionals.
- Medical diagnoses.
- Personalized medical recommendations.

AI-generated responses should be treated as supplementary information.

---

## 5. Accessibility

Accessibility is a central component of Movi60.

The application provides settings intended to improve usability for older adults.

### Available Settings

- Adjustable text size.
- Adjustable icon size.
- Enlarged interactive buttons.
- High-contrast interface.
- Font selection.
- Accessible navigation elements.

### Initial Accessibility Setup

On the first student login, the application presents an accessibility configuration screen.

Students can customize the interface before accessing the main application.

The selected preferences are intended to remain available during subsequent usage.

### Design Principles

The interface prioritizes:

- Clear visual hierarchy.
- Readable typography.
- Large touch targets.
- Simple navigation.
- Reduced visual complexity.
- Consistent interface elements.
- Understandable instructions.

---

## 6. Application Architecture

Movi60 uses a component-based architecture built with React Native.

The application separates interface components, navigation logic, styling, and data services.

### Main Components

| Component | Responsibility |
|---|---|
| Application entry point | Initializes the application |
| App screens | Displays application functionality |
| Navigation logic | Controls screen transitions and role-based navigation |
| Reusable components | Provides shared interface elements |
| Theme | Defines application colors, typography, and styles |
| Firebase services | Handles authentication and database operations |
| Assistant service | Processes AI assistant requests |
| Local storage | Stores supported local data and preferences |

### Navigation

The application uses **state-based navigation**, rather than React Navigation.

Navigation is controlled through application state and conditional rendering.

The navigation structure distinguishes between:

- Authentication screens.
- Student screens.
- Instructor screens.
- Administrator screens.
- Modal interfaces.
- Accessibility configuration.

Different navigation options are displayed according to the authenticated user's role.

### Architecture Decisions

**State-based navigation**

Selected to support the application's existing screen structure and maintain direct control over transitions.

**Reusable components**

Reduce duplicated interface code and help maintain visual consistency.

**Centralized styling**

The audited revision uses `src/styles/theme.js` as the primary source for React Native styles.

**Service separation**

Data access and AI-related functionality are organized separately from the main interface logic.

---

## 7. Firebase Integration

Firebase is used to support authentication and cloud data management.

### Firebase Authentication

Firebase Authentication provides the identity management layer.

It is responsible for:

- User authentication.
- Authentication sessions.
- Account identity.
- Integration with authenticated database operations.

Authentication and application roles are separate concepts.

A valid authenticated session does not automatically grant administrator or instructor permissions.

### Cloud Firestore

Cloud Firestore provides persistent storage for application data.

The domain includes:

- Users.
- Exercises.
- Workouts.
- Workout-exercise relationships.
- Workout history.
- Schedules.
- Instructor-student assignments.

### Data Relationships

The application uses identifiers to associate users and workouts.

| Field | Purpose |
|---|---|
| `instructorId` | Identifies the instructor assigned to a student |
| `professionalId` | Identifies the instructor responsible for a workout |

These relationships support filtering and role-specific access to application data.

### CRUD Operations

The application includes CRUD functionality for:

- User administration.
- Exercise management.
- Workout management.

The available operations depend on the authenticated user's role.

---

## 8. Roles and Permissions

Movi60 implements role-based functionality for three types of users.

| Permission | Student | Instructor | Administrator |
|---|---|---|---|
| View personal workouts | Yes | — | — |
| Record workout execution | Yes | — | — |
| View personal progress | Yes | — | — |
| Access AI assistant | Yes | — | — |
| View assigned students | — | Yes | Yes |
| Create exercises | — | Yes | — |
| Edit exercises | — | Yes | — |
| Delete exercises | — | Yes | — |
| Create workouts | — | Yes | — |
| Edit own workouts | — | Yes | — |
| Delete own workouts | — | Yes | — |
| Manage users | — | — | Yes |
| Manage user roles | — | — | Yes |
| Assign instructors | — | — | Yes |
| View global metrics | — | — | Yes |

### Security Model

Role-based navigation limits which features are displayed to each user.

However, hiding interface elements is not sufficient to secure application data.

Firestore Security Rules must independently validate access to protected resources.

The intended security model includes:

- Authentication validation.
- Role-based authorization.
- Workout ownership validation.
- Student-instructor relationship validation.
- Restricted administrative operations.
- Protection against unauthorized data modification.

**Important:** The implementation and deployment of Firestore Security Rules must be verified before using the application with real personal data.

---

## 9. Local Storage

AsyncStorage is used for supported local persistence requirements.

Depending on the application revision, local storage may include:

- Accessibility preferences.
- Application configuration.
- Local interface state.
- Demonstration data.

Cloud Firestore is the intended persistent database for shared application records.

AsyncStorage must not be treated as a secure replacement for authentication or server-side authorization.

---

## 10. Installation and Execution

### Requirements

Before running the application, install:

- Node.js compatible with the project's dependencies.
- npm.
- Git.
- Expo Go or a compatible emulator.

The audited SDK 58 revision contained Firebase dependencies requiring Node.js 24.12 or later.

### Clone the Repository

```bash
git clone https://github.com/MarcosG66/Movi60.git
```

Enter the project directory:

```bash
cd Movi60
```

### Install Dependencies

```bash
npm install
```

Check Expo dependency compatibility:

```bash
npx expo install --check
```

If necessary, align dependencies with the installed Expo SDK:

```bash
npx expo install --fix
```

### Configure External Services

The application requires valid configuration for the Firebase project and the AI service used by the installed revision.

Before execution:

1. Configure Firebase Authentication.
2. Configure Cloud Firestore.
3. Provide the Firebase project configuration.
4. Review Firestore Security Rules.
5. Configure the AI integration.
6. Verify the required environment variables and service permissions.

Do not commit private API keys, service-account credentials, or other secrets to the repository.

### Start the Application

```bash
npx expo start
```

To clear the Metro cache:

```bash
npx expo start -c
```

### Android

Install Expo Go on a compatible Android device.

Scan the QR Code displayed by Expo.

### iOS

Use Expo Go on a compatible iPhone or an available iOS simulator.

### Web

Start the web version using:

```bash
npx expo start --web
```

**Note:** Some native functionality and external integrations may behave differently between Web, Android, and iOS.

---

## 11. Testing and Verification

The project has undergone development-stage verification.

### Audited Revision

The November 14, 2026 revision reported:

- JavaScript and JSX syntax validation.
- Simulated authentication tests.
- Mocked Firestore tests.
- AI service tests using mocks.
- Fallback behavior verification.
- Interface control verification.

The audit reported **19 passing automated tests**.

These results apply to the audited revision and do not automatically validate subsequent changes.

### Running Tests

Where the test scripts are included:

```bash
npm test
```

Alternatively:

```bash
node --test tests/*.test.cjs
```

### Manual Verification

The following scenarios should be checked on the final application:

- Student registration and login.
- Instructor login.
- Administrator login.
- Correct navigation for each role.
- Student-instructor assignments.
- Exercise creation, editing, and deletion.
- Workout creation, editing, and deletion.
- Workout completion and history.
- Progress calculation.
- Accessibility preferences.
- Firebase data persistence.
- Firestore permission enforcement.
- AI assistant responses.
- AI service error handling.
- Android and iOS compatibility.

### Known Verification Limitations

Automated tests do not guarantee that all features work correctly on physical devices.

External integrations require additional testing with valid Firebase and AI service configurations.

---

## 12. Known Limitations

Movi60 is currently an academic prototype.

Known limitations and considerations include:

- External services require valid configuration.
- AI availability depends on network connectivity and service availability.
- Firebase authorization rules require deployment and verification.
- Some behavior may differ between mobile and web environments.
- The application has not undergone a complete production security audit.
- Performance and accessibility require further testing with real users.
- Some exercise images may still use prototype placeholders.
- Data consistency should be reviewed when deleting exercises referenced by multiple workouts.

The application should not be deployed with real sensitive user information until the required security controls have been validated.

---

## 13. Future Improvements

Potential improvements include:

- Expanded accessibility testing with older adults.
- More comprehensive automated testing.
- Improved offline support.
- Push notifications for scheduled activities.
- Additional workout progress visualizations.
- More detailed exercise illustrations.
- Improved AI response handling.
- Performance optimization.
- Stronger database consistency validation.
- Further separation of navigation and screen components.
- Production deployment and security hardening.

---

## 14. Academic Information

**Project:** Movi60  
**Institution:** University of Fortaleza (Unifor)  
**Course:** Computer Science  
**Subject:** Mobile Platform Development  
**Project Type:** Academic Extension Project  
**Year:** 2026  
**Framework:** React Native + Expo

### Development Team

- Luiz Henrique Lins Bahia Lopes Aguiar
- Igor Theophilo Lima Maia
- Henrique José Barbosa Vitalino Carneiro
- Marcos Gentili Oliveira Carneiro

### Repository

[Movi60 — GitHub](https://github.com/MarcosG66/Movi60)

---

## Disclaimer

Movi60 is an academic application developed for educational and demonstration purposes.

The project aims to improve accessibility and support the organization of physical activities for older adults.

The application and its AI assistant do not provide medical diagnoses or replace qualified fitness and healthcare professionals.

Production use requires appropriate security validation, service configuration, and additional testing.

---

**Movi60 — Making physical activity more accessible, organized, and connected.**
