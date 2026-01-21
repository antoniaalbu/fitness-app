🏋️‍♂️ FitTrack – Fitness Tracking Web App
FitTrack is a fitness web application built with Angular, designed to help users organize their workouts, meals, and fitness goals in one place. The app provides a personalized dashboard where users can track their daily activity, monitor progress over time, and log workout sessions.
Authentication is handled using Firebase Authentication, while application state is managed with NgRx Signal Store, ensuring a fast, reactive, and maintainable architecture.
________________________________________
✨ Key Features
🔐 Authentication
  •	User registration with email and password
  •	Login with email and password
  •	Google authentication
  •	Facebook authentication
  •	Secure logout and route protection
________________________________________
📊 User Dashboard
  •	Display of the user’s name
  •	Activity streak tracking
  •	Daily progress overview
________________________________________
🏋️ Today’s Workout
  •	Add and edit exercises
  •	Set number of sets, reps, and weight
  •	Mark sets as completed
  •	Automatic workout progress calculation
________________________________________
🎯 Goals
  •	Create, edit, and delete fitness goals
  •	Set targets and deadlines
  •	Real-time form validation
  •	Persistent goal tracking
________________________________________
🍽️ Meal Planning
  •	Manage daily meals
  •	Track calories, protein, carbs, and fats
  •	Automatic nutrition totals calculation
________________________________________
📈 Progress Tracking
  •	Track weight changes and workout frequency
  •	View progress over time
________________________________________
🏋️ Workout Management (Exercise Page)
  •	Create and manage multiple workouts
  •	Add and remove exercises
  •	Add and edit workout sets
  •	Adjust reps and weight
  •	Automatic saving with debounce
  •	Log completed workouts to history
________________________________________
🕒 Workout History
  •	Log completed workout sessions
  •	View recent workout history
  •	Filter history by exercise type
________________________________________
🧩 User Experience & Architecture
  •	Modal-based UI for managing data
  •	Real-time validation and feedback
  •	Clean separation between UI and business logic
  •	Signal-based reactive state management
  •	Standalone Angular components
________________________________________
🛠️ Tech Stack
  •	Angular 17+
  •	NgRx Signal Store & Angular Signals
  •	Firebase Authentication
  •	TypeScript
  •	Standalone Components
________________________________________
________________________________________

🚀 Setup & Running the Application
Follow the steps below to run the application locally.
________________________________________
1️⃣ Prerequisites
Before getting started, make sure you have the following installed:
  •	Node.js (recommended version: >= 18)
  •	npm (comes with Node.js)
  •	Angular CLI
If Angular CLI is not installed:
  npm install -g @angular/cli
  Verify installations:
  node -v
  npm -v
  ng version
________________________________________
2️⃣ Clone the Repository
Clone the repository and navigate into the project folder:
  git clone https://github.com/antoniaalbu/fitness-app
  cd fitness-app
________________________________________
3️⃣ Install Dependencies
Install all required dependencies:
  npm install
________________________________________
4️⃣ Firebase Configuration
The application uses Firebase for authentication and data storage.
  1.	Go to Firebase Console
  2.	Create a new Firebase project
  3.	Enable Authentication
  o	Email / Password
  o	Google
  o	Facebook (optional)
  4.	Create a Web App in Firebase
  5.	Copy the Firebase configuration
  Add the configuration to:
  // src/environments/environment.ts
  export const environment = {
    production: false,
    firebase: {
      apiKey: 'YOUR_API_KEY',
      authDomain: 'YOUR_AUTH_DOMAIN',
      projectId: 'YOUR_PROJECT_ID',
      storageBucket: 'YOUR_STORAGE_BUCKET',
      messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
      appId: 'YOUR_APP_ID'
    }
  };
⚠️ Important: Do not commit this file to a public repository.
Make sure environment.ts is included in .gitignore.
________________________________________
5️⃣ Run the Application
Once everything is set up, start the development server:
  ng serve
The app will be available at:
http://localhost:4200
________________________________________
6️⃣ Production Build
To create a production-ready build:
  ng build --configuration production
The output files will be generated in the dist/ directory.
________________________________________
📌 Final Notes
•	The application uses standalone components
•	Business logic is fully separated from UI using Signal Store
•	State updates are reactive without RxJS boilerplate
•	Firebase provides a secure and scalable authentication solution

You can access the deployed version of the app at: https://fitness-app-tau-rust.vercel.app
