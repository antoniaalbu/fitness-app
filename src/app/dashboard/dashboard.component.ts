import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { UserDataService } from '../services/user-data.service';
import { WorkoutService, Workout } from '../services/workout.service';

interface WorkoutSet {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface Goal {
  title: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
}

interface Meal {
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface ProgressData {
  date: string;
  weight: number;
  workouts: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);
  private userData = inject(UserDataService);
  private workoutService = inject(WorkoutService);

  userName = signal('Loading...');
  userStreak = signal(0);

  todayWorkout = signal<WorkoutSet[]>([]);
  goals = signal<Goal[]>([]);
  mealPlan = signal<Meal[]>([]);
  progressData = signal<ProgressData[]>([]);
  
  // Add workouts from workout service
  workouts = signal<Workout[]>([]);

  async ngOnInit() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userName.set(user.displayName || user.email || 'User');
        await this.loadAllData();
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }

  async createInitialData() {
    const defaultWorkout: WorkoutSet[] = [
      { exercise: 'Bench Press', sets: 4, reps: 8, weight: 185, completed: false },
      { exercise: 'Squats', sets: 4, reps: 10, weight: 225, completed: false }
    ];

    const defaultGoals: Goal[] = [
      { title: 'Bench Max', current: 185, target: 225, unit: 'lbs', deadline: '2025-01-01' }
    ];

    const defaultMeals: Meal[] = [
      { name: 'Chicken + Rice', time: '12:00 PM', calories: 650, protein: 50, carbs: 65, fats: 10 }
    ];

    const defaultProgress: ProgressData[] = [
      { date: 'Mon', weight: 185, workouts: 1 }
    ];

    await this.userData.createData('workout/today', { data: defaultWorkout });
    await this.userData.createData('goals/list', { data: defaultGoals });
    await this.userData.createData('meals/plan', { data: defaultMeals });
    await this.userData.createData('progress/weekly', { data: defaultProgress });

    this.todayWorkout.set(defaultWorkout);
    this.goals.set(defaultGoals);
    this.mealPlan.set(defaultMeals);
    this.progressData.set(defaultProgress);
  }

  async loadAllData() {
    try {
      
      const workout = await this.userData.getData('workout/today');
      const goals = await this.userData.getData('goals/list');
      const meals = await this.userData.getData('meals/plan');
      const progress = await this.userData.getData('progress/weekly');

      this.todayWorkout.set(workout?.['data'] ?? []);
      this.goals.set(goals?.['data'] ?? []);
      this.mealPlan.set(meals?.['data'] ?? []);
      this.progressData.set(progress?.['data'] ?? []);

      // Load workouts from workout service
      const workouts = await this.workoutService.loadWorkouts();
      this.workouts.set(workouts);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  totalCalories = computed(() =>
    this.mealPlan().reduce((sum, meal) => sum + meal.calories, 0)
  );

  totalProtein = computed(() =>
    this.mealPlan().reduce((sum, meal) => sum + meal.protein, 0)
  );

  completedSets = computed(() =>
    this.todayWorkout().filter(w => w.completed).length
  );

  totalSets = computed(() =>
    this.todayWorkout().length
  );

  workoutProgress = computed(() =>
    this.totalSets() > 0 ? Math.round((this.completedSets() / this.totalSets()) * 100) : 0
  );


  totalExercises = computed(() =>
    this.workouts().reduce((sum, workout) => sum + workout.exercises.length, 0)
  );

  
  totalWorkoutSets = computed(() =>
    this.workouts().reduce((sum, workout) => 
      sum + workout.exercises.reduce((exerciseSum, exercise) => 
        exerciseSum + exercise.sets.length, 0
      ), 0
    )
  );

  async toggleWorkoutComplete(index: number) {
    const workouts = this.todayWorkout();
    workouts[index].completed = !workouts[index].completed;

    this.todayWorkout.set([...workouts]);

    await this.userData.updateData('workout/today', {
      data: workouts
    });
  }

  getGoalProgress(goal: Goal): number {
    return Math.round((goal.current / goal.target) * 100);
  }

  
  goToExercises() {
    this.router.navigate(['/exercises']);
  }

  
  getExerciseCount(workout: Workout): number {
    return workout.exercises.length;
  }

  
  getTotalSets(workout: Workout): number {
    return workout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/auth']);
  }
}