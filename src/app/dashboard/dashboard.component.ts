// dashboard.component.ts
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getAuth, signOut } from 'firebase/auth';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';

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
export class DashboardComponent {
  private router = inject(Router); 
  private auth = inject(Auth);
  
 
  userName = signal('Alex Johnson');
  userStreak = signal(12);
  
  
  todayWorkout = signal<WorkoutSet[]>([
    { exercise: 'Bench Press', sets: 4, reps: 8, weight: 185, completed: true },
    { exercise: 'Squats', sets: 4, reps: 10, weight: 225, completed: true },
    { exercise: 'Deadlift', sets: 3, reps: 6, weight: 315, completed: false },
    { exercise: 'Pull-ups', sets: 3, reps: 12, weight: 0, completed: false },
    { exercise: 'Shoulder Press', sets: 3, reps: 10, weight: 135, completed: false }
  ]);
  
  
  goals = signal<Goal[]>([
    { title: 'Bench Press Max', current: 185, target: 225, unit: 'lbs', deadline: 'Dec 31' },
    { title: 'Body Weight', current: 185, target: 175, unit: 'lbs', deadline: 'Jan 15' },
    { title: 'Weekly Workouts', current: 4, target: 5, unit: 'days', deadline: 'This Week' },
    { title: 'Running Distance', current: 12, target: 20, unit: 'miles', deadline: 'This Month' }
  ]);
  
 
  mealPlan = signal<Meal[]>([
    { name: 'Protein Shake + Oatmeal', time: '7:00 AM', calories: 450, protein: 35, carbs: 55, fats: 10 },
    { name: 'Chicken Breast + Rice + Veggies', time: '12:30 PM', calories: 650, protein: 50, carbs: 70, fats: 15 },
    { name: 'Greek Yogurt + Berries', time: '3:30 PM', calories: 200, protein: 15, carbs: 25, fats: 5 },
    { name: 'Salmon + Sweet Potato + Salad', time: '7:00 PM', calories: 600, protein: 45, carbs: 50, fats: 20 },
    { name: 'Cottage Cheese', time: '10:00 PM', calories: 150, protein: 20, carbs: 10, fats: 5 }
  ]);
  
  
  progressData = signal<ProgressData[]>([
    { date: 'Mon', weight: 187, workouts: 1 },
    { date: 'Tue', weight: 186, workouts: 1 },
    { date: 'Wed', weight: 186, workouts: 0 },
    { date: 'Thu', weight: 185, workouts: 1 },
    { date: 'Fri', weight: 185, workouts: 1 },
    { date: 'Sat', weight: 184, workouts: 0 },
    { date: 'Sun', weight: 185, workouts: 1 }
  ]);
  
  
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
    Math.round((this.completedSets() / this.totalSets()) * 100)
  );
  
  toggleWorkoutComplete(index: number) {
    const workouts = this.todayWorkout();
    workouts[index].completed = !workouts[index].completed;
    this.todayWorkout.set([...workouts]);
  }
  
  getGoalProgress(goal: Goal): number {
    return Math.round((goal.current / goal.target) * 100);
  }
  
 async logout() {
  try {
    await signOut(this.auth);
    this.router.navigate(['/login']); 
    console.log('Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
  }
}

}

